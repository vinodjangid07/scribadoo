"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { BatchItem, StudentItem } from "@/types/dashboard";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/user-context";

interface DashboardContextType {
  batches: BatchItem[];
  students: StudentItem[];
  teacherProfile: { fullName?: string; email?: string } | null;
  isLoading: boolean;
  isLoaded: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  refreshData: () => Promise<void>;
  updateBatchLocal: (batch: BatchItem) => void;
  removeBatchLocal: (batchId: string) => void;
  updateStudentLocal: (student: StudentItem) => void;
  removeStudentLocal: (studentId: string) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({
  children,
  initialBatches = [],
  initialStudents = [],
  initialProfile = null,
}: {
  children: ReactNode;
  initialBatches?: BatchItem[];
  initialStudents?: StudentItem[];
  initialProfile?: { fullName?: string; email?: string } | null;
}) {
  const { user, profile } = useUser();
  const [batches, setBatches] = useState<BatchItem[]>(initialBatches);
  const [students, setStudents] = useState<StudentItem[]>(initialStudents);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(
    initialBatches.length > 0 || initialStudents.length > 0
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("scribadoo_sidebar_collapsed");
      if (saved !== null) {
        setSidebarCollapsed(saved === "true");
      }
    } catch {
      // Storage access may fail in private browsing
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("scribadoo_sidebar_collapsed", String(next));
      } catch {
        // Storage access may fail in private browsing
      }
      return next;
    });
  }, []);

  const refreshData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data: batchesData } = await supabase
      .from("batches")
      .select("*, batch_students(count)")
      .order("created_at", { ascending: false });

    if (batchesData) {
      setBatches(
        batchesData.map((b) => ({
          id: b.id,
          name: b.name,
          subject: b.subject,
          days: b.days,
          start_time: b.start_time,
          end_time: b.end_time,
          default_monthly_fee: Number(b.default_monthly_fee),
          student_count: b.batch_students?.[0]?.count || 0,
        }))
      );
    }

    const { data: studentsData } = await supabase
      .from("students")
      .select(`
        id,
        full_name,
        grade,
        parent_name,
        parent_phone,
        joined_date,
        notes,
        is_archived,
        batch_students (
          batch_id,
          custom_fee,
          batches (
            id,
            name,
            default_monthly_fee
          )
        )
      `)
      .order("full_name", { ascending: true });

    if (studentsData) {
      setStudents(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        studentsData.map((s: any) => ({
          id: s.id,
          full_name: s.full_name,
          grade: s.grade,
          parent_name: s.parent_name,
          parent_phone: s.parent_phone,
          joined_date: s.joined_date,
          notes: s.notes,
          is_archived: s.is_archived,
          enrollments: (s.batch_students || []).map((bs: any) => ({
            batch_id: bs.batch_id,
            custom_fee: bs.custom_fee !== null ? Number(bs.custom_fee) : null,
            batch: bs.batches
              ? {
                  id: bs.batches.id,
                  name: bs.batches.name,
                  default_monthly_fee: Number(bs.batches.default_monthly_fee),
                }
              : undefined,
          })),
        }))
      );
    }

    setIsLoading(false);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    refreshData();
  }, [user, refreshData]);

  const updateBatchLocal = useCallback((batch: BatchItem) => {
    setBatches((prev) => {
      const idx = prev.findIndex((b) => b.id === batch.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...batch };
        return next;
      }
      return [batch, ...prev];
    });
  }, []);

  const removeBatchLocal = useCallback((batchId: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
  }, []);

  const updateStudentLocal = useCallback((student: StudentItem) => {
    setStudents((prev) => {
      const idx = prev.findIndex((s) => s.id === student.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...student };
        return next;
      }
      return [...prev, student].sort((a, b) =>
        a.full_name.localeCompare(b.full_name)
      );
    });
  }, []);

  const removeStudentLocal = useCallback((studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        batches,
        students,
        teacherProfile: profile ? { fullName: profile.fullName, email: profile.email } : initialProfile,
        isLoading,
        isLoaded,
        sidebarCollapsed,
        toggleSidebar,
        refreshData,
        updateBatchLocal,
        removeBatchLocal,
        updateStudentLocal,
        removeStudentLocal,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
