"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/context/user-context";
import { useDashboard } from "@/context/dashboard-context";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Search,
  Calendar,
  CheckSquare,
  CreditCard,
  Menu,
  LogOut,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useUser();
  const { students, batches } = useDashboard();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { fullName, email, initials } = useMemo(() => {
    const name = profile?.fullName || user?.email?.split("@")[0] || "Tuition Teacher";
    const mail = profile?.email || user?.email || "";
    const inits = name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 2) || "TT";
    return { fullName: name, email: mail, initials: inits };
  }, [profile, user]);

  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard");
  const isBatches = pathname.startsWith("/batches");
  const isStudents = pathname.startsWith("/students");
  const isAttendance = pathname.startsWith("/attendance");
  const isFees = pathname.startsWith("/fees");
  const isStudentDetail = pathname.match(/^\/students\/[^/]+$/);

  const currentPage = isStudentDetail
    ? "Student Profile"
    : isDashboard
    ? "Dashboard"
    : isAttendance
    ? "Attendance"
    : isFees
    ? "Fees"
    : isStudents
    ? "Students"
    : "Batches";

  const [todayFormatted, setTodayFormatted] = useState("");
  useEffect(() => {
    setTodayFormatted(
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    );
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return {
        batches: batches.slice(0, 4),
        students: students.slice(0, 6),
      };
    }
    return {
      batches: batches.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.subject?.toLowerCase().includes(q)
      ),
      students: students.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.parent_name?.toLowerCase().includes(q) ||
          s.parent_phone?.includes(q) ||
          s.grade?.toLowerCase().includes(q)
      ),
    };
  }, [batches, students, searchQuery]);

  return (
    <div className="min-h-screen flex bg-[#FBFBF9] dark:bg-[#121212] text-[#18181B] dark:text-[#EDEDED] antialiased">
      {/* Sidebar navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-60 md:w-16 lg:w-60 bg-[#FFFFFF] dark:bg-[#1C1C1C] border-r border-black/[0.06] dark:border-white/[0.08] flex flex-col justify-between transition-all duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col">
          <div className="h-14 px-4 md:px-0 lg:px-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between md:justify-center lg:justify-between">
            <Link href="/dashboard" className="flex items-center justify-center py-1">
              <div className="hidden md:block lg:hidden">
                <Image
                  src="/dark-app-icon.webp"
                  alt="Scribadoo"
                  width={32}
                  height={32}
                  priority
                  className="block dark:hidden h-8 w-8 object-contain rounded-xl"
                />
                <Image
                  src="/light-app-icon.webp"
                  alt="Scribadoo"
                  width={32}
                  height={32}
                  priority
                  className="hidden dark:block h-8 w-8 object-contain rounded-xl"
                />
              </div>

              <div className="block md:hidden lg:block">
                <Image
                  src="/dark-logo.webp"
                  alt="Scribadoo"
                  width={120}
                  height={26}
                  priority
                  style={{ width: "auto" }}
                  className="block dark:hidden h-6 w-auto object-contain"
                />
                <Image
                  src="/light-logo.webp"
                  alt="Scribadoo"
                  width={120}
                  height={26}
                  priority
                  style={{ width: "auto" }}
                  className="hidden dark:block h-6 w-auto object-contain"
                />
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] cursor-pointer"
            >
              ✕
            </button>
          </div>

          <nav className="p-2 md:p-2 lg:p-3 flex flex-col gap-1">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              title="Dashboard"
              className={`flex items-center md:justify-center lg:justify-start gap-2.5 px-3 py-2 md:px-0 md:py-2.5 lg:px-3 lg:py-2 rounded-xl text-sm font-medium transition-colors ${
                isDashboard
                  ? "bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] font-semibold"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0]/60 dark:hover:bg-[#262626]/60"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4 shrink-0" />
              <span className="md:hidden lg:inline">Dashboard</span>
            </Link>

            <Link
              href="/batches"
              onClick={() => setMobileMenuOpen(false)}
              title="Batches"
              className={`flex items-center md:justify-center lg:justify-start gap-2.5 px-3 py-2 md:px-0 md:py-2.5 lg:px-3 lg:py-2 rounded-xl text-sm font-medium transition-colors ${
                isBatches
                  ? "bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] font-semibold"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0]/60 dark:hover:bg-[#262626]/60"
              }`}
            >
              <BookOpen className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4 shrink-0" />
              <span className="md:hidden lg:inline">Batches</span>
            </Link>

            <Link
              href="/attendance"
              onClick={() => setMobileMenuOpen(false)}
              title="Attendance"
              className={`flex items-center md:justify-center lg:justify-start gap-2.5 px-3 py-2 md:px-0 md:py-2.5 lg:px-3 lg:py-2 rounded-xl text-sm font-medium transition-colors ${
                isAttendance
                  ? "bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] font-semibold"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0]/60 dark:hover:bg-[#262626]/60"
              }`}
            >
              <CheckSquare className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4 shrink-0" />
              <span className="md:hidden lg:inline">Attendance</span>
            </Link>

            <Link
              href="/students"
              onClick={() => setMobileMenuOpen(false)}
              title="Students"
              className={`flex items-center md:justify-center lg:justify-start gap-2.5 px-3 py-2 md:px-0 md:py-2.5 lg:px-3 lg:py-2 rounded-xl text-sm font-medium transition-colors ${
                isStudents
                  ? "bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] font-semibold"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0]/60 dark:hover:bg-[#262626]/60"
              }`}
            >
              <Users className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4 shrink-0" />
              <span className="md:hidden lg:inline">Students</span>
            </Link>

            <Link
              href="/fees"
              onClick={() => setMobileMenuOpen(false)}
              title="Fees"
              className={`flex items-center md:justify-center lg:justify-start gap-2.5 px-3 py-2 md:px-0 md:py-2.5 lg:px-3 lg:py-2 rounded-xl text-sm font-medium transition-colors ${
                isFees
                  ? "bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] font-semibold"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0]/60 dark:hover:bg-[#262626]/60"
              }`}
            >
              <CreditCard className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4 shrink-0" />
              <span className="md:hidden lg:inline">Fees</span>
            </Link>
          </nav>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}

      <div className="flex-1 flex flex-col md:pl-16 lg:pl-60 min-w-0">
        {/* Sticky top header */}
        <header className="h-14 shrink-0 bg-[#FFFFFF]/95 dark:bg-[#1C1C1C]/95 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.08] px-3.5 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 sm:flex-initial">
            <Link
              href="/dashboard"
              className="h-9 w-9 shrink-0 md:hidden flex items-center justify-center focus:outline-none"
              title="Scribadoo Dashboard"
            >
              <Image
                src="/dark-app-icon.webp"
                alt="Scribadoo"
                width={36}
                height={36}
                priority
                className="block dark:hidden h-9 w-9 object-contain rounded-xl"
              />
              <Image
                src="/light-app-icon.webp"
                alt="Scribadoo"
                width={36}
                height={36}
                priority
                className="hidden dark:block h-9 w-9 object-contain rounded-xl"
              />
            </Link>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="h-9 flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 rounded-xl bg-[#F4F4F0] dark:bg-[#262626] hover:bg-[#EAEAE6] dark:hover:bg-[#323232] text-xs text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.06] dark:border-white/[0.08] transition-colors cursor-pointer w-full max-w-[200px] sm:max-w-none sm:w-64 justify-between"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Search className="w-3.5 h-3.5 text-[#A1A1AA] dark:text-[#71717A] shrink-0" />
                <span className="truncate">Search...</span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12] text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <ThemeToggle />

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="h-9 w-9 sm:w-auto p-0 sm:pl-1 sm:pr-3 rounded-xl bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12] hover:border-black/[0.16] dark:hover:border-white/[0.2] flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 shrink-0 transition-colors cursor-pointer"
                title="Account options"
              >
                <div className="w-7 h-7 rounded-lg bg-[#18181B] dark:bg-[#EDEDED] text-[#FAFAFA] dark:text-[#121212] flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] max-w-[90px] sm:max-w-[160px] truncate">
                  {fullName}
                </span>
              </button>

              {profileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12] p-1.5 flex flex-col gap-1 shadow-xl">
                    <div className="px-3 py-2 flex flex-col">
                      <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] truncate">
                        {fullName}
                      </span>
                      <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">
                        {email}
                      </span>
                    </div>

                    <div className="h-px bg-black/[0.06] dark:bg-white/[0.08] my-0.5" />

                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main page content */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#FFFFFF]/95 dark:bg-[#1C1C1C]/95 backdrop-blur-md border-t border-black/[0.08] dark:border-white/[0.12] px-1.5 py-1 flex items-center justify-around shadow-lg"
      >
        <Link
          href="/dashboard"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors ${
            isDashboard
              ? "text-[#18181B] dark:text-[#EDEDED] font-semibold"
              : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
          }`}
        >
          <div className={`p-1 rounded-lg ${isDashboard ? "bg-[#F4F4F0] dark:bg-[#262626]" : ""}`}>
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Dashboard</span>
        </Link>

        <Link
          href="/batches"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors ${
            isBatches
              ? "text-[#18181B] dark:text-[#EDEDED] font-semibold"
              : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
          }`}
        >
          <div className={`p-1 rounded-lg ${isBatches ? "bg-[#F4F4F0] dark:bg-[#262626]" : ""}`}>
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Batches</span>
        </Link>

        <Link
          href="/attendance"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors ${
            isAttendance
              ? "text-[#18181B] dark:text-[#EDEDED] font-semibold"
              : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
          }`}
        >
          <div className={`p-1 rounded-lg ${isAttendance ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212]" : ""}`}>
            <CheckSquare className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Roll Call</span>
        </Link>

        <Link
          href="/students"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors ${
            isStudents
              ? "text-[#18181B] dark:text-[#EDEDED] font-semibold"
              : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
          }`}
        >
          <div className={`p-1 rounded-lg ${isStudents ? "bg-[#F4F4F0] dark:bg-[#262626]" : ""}`}>
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Students</span>
        </Link>

        <Link
          href="/fees"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors ${
            isFees
              ? "text-[#18181B] dark:text-[#EDEDED] font-semibold"
              : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
          }`}
        >
          <div className={`p-1 rounded-lg ${isFees ? "bg-[#F4F4F0] dark:bg-[#262626]" : ""}`}>
            <CreditCard className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Fees</span>
        </Link>
      </nav>

      {/* Quick search modal (Cmd+K) */}
      {searchOpen && (
        <div
          onClick={() => setSearchOpen(false)}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/40 dark:bg-black/70 backdrop-blur-[2px]"
        >
          <div
            className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl border border-black/[0.08] dark:border-white/[0.12] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08]">
              <Search className="w-4 h-4 text-[#A1A1AA] dark:text-[#71717A] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type a student name, parent phone, or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#18181B] dark:text-[#EDEDED] placeholder-[#A1A1AA] dark:placeholder-[#71717A] outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] px-1.5 py-0.5 rounded border border-black/[0.06] dark:border-white/[0.08] cursor-pointer"
              >
                ESC
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-3">
              {searchResults.batches.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] px-2.5 pt-1">
                    Batches ({searchResults.batches.length})
                  </span>
                  {searchResults.batches.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        router.push(`/students?batchId=${b.id}`);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-[#F4F4F0] dark:hover:bg-[#262626] flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#18181B] dark:text-[#EDEDED]">{b.name}</span>
                        {b.subject && <span className="text-[#71717A] dark:text-[#A1A1AA]">{b.subject}</span>}
                      </div>
                      <span className="font-mono text-[#71717A] dark:text-[#A1A1AA]">
                        ₹{Number(b.default_monthly_fee).toLocaleString("en-IN")}/mo
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.students.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] px-2.5 pt-1">
                    Students ({searchResults.students.length})
                  </span>
                  {searchResults.students.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        router.push(`/students/${s.id}`);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-[#F4F4F0] dark:hover:bg-[#262626] flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#18181B] dark:text-[#EDEDED]">{s.full_name}</span>
                        <span className="text-[#71717A] dark:text-[#A1A1AA]">
                          {s.parent_name ? `${s.parent_name} • ` : ""}
                          {s.parent_phone}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#A1A1AA] dark:text-[#71717A]" />
                    </button>
                  ))}
                </div>
              )}

              {searchResults.batches.length === 0 && searchResults.students.length === 0 && (
                <div className="p-6 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  No matching batches or students found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
