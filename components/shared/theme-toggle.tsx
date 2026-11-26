"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    const isCurrentlyDark = (resolvedTheme || theme) === "dark";
    const nextTheme = isCurrentlyDark ? "light" : "dark";
    setTheme(nextTheme);

    if (typeof document !== "undefined") {
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        document.documentElement.setAttribute("data-theme", "light");
      }
    }
  }, [resolvedTheme, theme, setTheme]);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-xl bg-transparent" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-9 h-9 rounded-xl text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-[#EDEDED] bg-[#FFFFFF] dark:bg-[#1C1C1C] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] border border-black/[0.08] dark:border-white/[0.12] transition-colors cursor-pointer flex items-center justify-center shrink-0"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#EDEDED]" />
      ) : (
        <Moon className="w-4 h-4 text-[#18181B]" />
      )}
    </button>
  );
}
