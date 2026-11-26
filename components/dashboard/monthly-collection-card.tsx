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
    <div className="bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED] truncate">
              Monthly Fee Collections
            </h2>
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] font-mono shrink-0">
              {formatMonthLabel(month)}
            </span>
          </div>

          <Link
            href="/fees"
            className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] flex items-center gap-1 transition-colors shrink-0"
          >
            <span>Full Ledger</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-[#FAFAF9] dark:bg-[#181818] border border-black/[0.04] dark:border-white/[0.06]">
            <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
              Collected
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#18181B] dark:text-[#EDEDED] mt-1 truncate">
              ₹{totalCollected.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              {paidStudentsCount} of {totalStudents} cleared
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAFAF9] dark:bg-[#181818] border border-black/[0.04] dark:border-white/[0.06]">
            <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
              Pending
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#18181B] dark:text-[#EDEDED] mt-1 truncate">
              ₹{totalPending.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              {pendingStudentsCount} students due
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#71717A] dark:text-[#A1A1AA]">
              Clearance rate
            </span>
            <span className="font-mono font-semibold text-[#18181B] dark:text-[#EDEDED]">
              {clearanceRate}% of ₹{totalBilled.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-[#F4F4F0] dark:bg-[#262626] overflow-hidden">
            <div
              className="h-full bg-[#18181B] dark:bg-[#EDEDED] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, clearanceRate)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
