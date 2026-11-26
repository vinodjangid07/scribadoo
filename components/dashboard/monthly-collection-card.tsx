"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface MonthlyCollectionCardProps {
  month: string;
  totalBilled: number;
  totalCollected: number;
  totalPending: number;
  clearanceRate: number;
  totalStudents: number;
  paidStudentsCount: number;
  pendingStudentsCount: number;
}

function formatMonthLabel(monthStr: string) {
  try {
    const [y, m] = monthStr.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  } catch {
    return monthStr;
  }
}

export function MonthlyCollectionCard({
  month,
  totalBilled,
  totalCollected,
  totalPending,
  clearanceRate,
  totalStudents,
  paidStudentsCount,
  pendingStudentsCount,
}: MonthlyCollectionCardProps) {
  return (
    <section className="bg-[#FFFFFF] dark:bg-[#191919] border border-black/[0.07] dark:border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2.5 min-w-0">
          <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED] truncate">
            Monthly Collections
          </h2>
          <span className="hidden sm:inline text-xs text-[#71717A] dark:text-[#A1A1AA] shrink-0">
            {formatMonthLabel(month)}
          </span>
        </div>

        <Link
          href="/fees"
          className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] inline-flex items-center gap-1 transition-colors shrink-0 group"
        >
          <span>Full ledger</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 divide-x divide-black/[0.06] dark:divide-white/[0.07] border-b border-black/[0.06] dark:border-white/[0.07]">
        <div className="px-5 py-4">
          <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Collected
          </div>
          <div className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] dark:text-[#EDEDED] mt-1 tabular-nums truncate">
            ₹{totalCollected.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5 tabular-nums">
            {paidStudentsCount} of {totalStudents} cleared
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Pending
          </div>
          <div className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] dark:text-[#EDEDED] mt-1 tabular-nums truncate">
            ₹{totalPending.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5 tabular-nums">
            {pendingStudentsCount} students due
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Clearance progress
          </span>
          <span className="font-semibold text-[#18181B] dark:text-[#EDEDED] tabular-nums">
            {clearanceRate}%{" "}
            <span className="font-normal text-[#71717A] dark:text-[#A1A1AA]">
              of ₹{totalBilled.toLocaleString("en-IN")}
            </span>
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-[#F4F4F0] dark:bg-[#262626] overflow-hidden">
          <div
            className="h-full bg-[#18181B] dark:bg-[#EDEDED] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, clearanceRate)}%` }}
          />
        </div>
      </div>
    </section>
  );
}
