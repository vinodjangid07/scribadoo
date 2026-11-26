"use client";

import { useState, useCallback, FormEvent } from "react";
import { signIn, signUp } from "@/app/auth/actions";
import { createClient } from "@/utils/supabase/client";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setErrorMessage(null);
      setIsSubmitting(true);

      const formData = new FormData(event.currentTarget);

      try {
        const res =
          mode === "signin"
            ? await signIn(formData)
            : await signUp(formData);

        if (res?.error) {
          setErrorMessage(res.error);
          setIsSubmitting(false);
        }
      } catch {
        // Next.js redirect throws an error internally, which is standard
      }
    },
    [mode]
  );

  const handleGoogleSignIn = useCallback(async () => {
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
    }
  }, []);

  const handleToggleMode = useCallback(() => {
    setMode((prev) => (prev === "signin" ? "signup" : "signin"));
    setErrorMessage(null);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-[#FFFFFF] dark:bg-[#191919] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl flex flex-col gap-6 shadow-xl">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl sm:text-3xl text-[#18181B] dark:text-[#EDEDED] font-bold tracking-tight">
          Scribadoo
        </h1>
        <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
          {mode === "signin"
            ? "Sign in to manage your tuition batches and students."
            : "Create your teacher account to get started."}
        </p>
      </div>

      <GoogleSignInButton onClick={handleGoogleSignIn} />

      <div className="flex items-center gap-3">
        <span className="flex-1 h-px bg-black/[0.08] dark:bg-white/[0.12]" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
          or with email
        </span>
        <span className="flex-1 h-px bg-black/[0.08] dark:bg-white/[0.12]" />
      </div>

      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 p-3.5 rounded-xl text-xs font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "signup" && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="fullName"
              className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]"
            >
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="e.g. Priya Sharma"
              className="w-full h-11 px-3.5 rounded-xl bg-[#F4F4F0] dark:bg-[#262626] border border-black/[0.08] dark:border-white/[0.12] text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDED] placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none focus:border-black/[0.3] dark:focus:border-white/[0.3] focus:bg-white dark:focus:bg-[#1E1E1E] transition-all"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="teacher@example.com"
            className="w-full h-11 px-3.5 rounded-xl bg-[#F4F4F0] dark:bg-[#262626] border border-black/[0.08] dark:border-white/[0.12] text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDED] placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none focus:border-black/[0.3] dark:focus:border-white/[0.3] focus:bg-white dark:focus:bg-[#1E1E1E] transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            placeholder="At least 6 characters"
            className="w-full h-11 px-3.5 rounded-xl bg-[#F4F4F0] dark:bg-[#262626] border border-black/[0.08] dark:border-white/[0.12] text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDED] placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none focus:border-black/[0.3] dark:focus:border-white/[0.3] focus:bg-white dark:focus:bg-[#1E1E1E] transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 mt-1 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-none flex items-center justify-center"
        >
          {isSubmitting
            ? "Please wait..."
            : mode === "signin"
            ? "Sign in to Scribadoo"
            : "Create teacher account"}
        </button>
      </form>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={handleToggleMode}
          className="text-xs sm:text-sm font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors cursor-pointer"
        >
          {mode === "signin"
            ? "New teacher? Create an account"
            : "Already registered? Sign in instead"}
        </button>
      </div>
    </div>
  );
}
