"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({
  children,
  initialUser = null,
  initialProfile = null,
}: {
  children: ReactNode;
  initialUser?: User | null;
  initialProfile?: UserProfile | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const router = useRouter();
  const lastFetchedIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string, email: string) => {
    if (lastFetchedIdRef.current === userId) return;
    lastFetchedIdRef.current = userId;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile({
          id: userId,
          fullName: data.full_name || email.split("@")[0],
          email,
        });
      } else {
        setProfile({
          id: userId,
          fullName: email.split("@")[0],
          email,
        });
      }
    } catch {
      setProfile({
        id: userId,
        fullName: email.split("@")[0],
        email,
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    lastFetchedIdRef.current = null;
    await fetchProfile(user.id, user.email || "");
  }, [user, fetchProfile]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser.email || "");
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser.email || "");
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    lastFetchedIdRef.current = null;
    setUser(null);
    setProfile(null);
    router.push("/login");
  }, [router]);

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
