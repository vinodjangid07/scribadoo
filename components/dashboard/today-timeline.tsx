"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Zap } from "lucide-react";
import type { TodayBatchSchedule } from "@/types/dashboard";
import { formatTime12 } from "@/lib/utils";

interface TodayTimelineProps {
  todayBatches: TodayBatchSchedule[];
  onMarkAllPresent: (batchId: string) => Promise<void>;
}

export function TodayTimeline({
  todayBatches,
  onMarkAllPresent,
}: TodayTimelineProps) {
  const [loadingBatchId, setLoadingBatchId] = useState<string | null>(null);

  const handle1TapPresent = async (batchId: string) => {
    try {
      setLoadingBatchId(batchId);
      await onMarkAllPresent(batchId);
    } finally {
      setLoadingBatchId(null);
    }
  };

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED] truncate">
            Today&apos;s Class Schedule
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] font-mono shrink-0">
            {todayBatches.length} {todayBatches.length === 1 ? "class" : "classes"}
          </span>
        </div>

        <Link
          href="/attendance"
          className="hidden sm:inline-flex text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] items-center gap-1 transition-colors shrink-0"
        >
          <span>Attendance Page</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {todayBatches.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-black/[0.08] dark:border-white/[0.12] rounded-xl">
          <p className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            No classes scheduled for today.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {todayBatches.map((batch) => {
            const isLoading = loadingBatchId === batch.id;

            return (
              <Link
                key={batch.id}
                href={`/attendance?batchId=${batch.id}`}
                className="p-3 sm:p-3.5 rounded-xl bg-[#FAFAF9] dark:bg-[#181818] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#18181B] dark:text-[#EDEDED] shrink-0">
                    {batch.startTime ? formatTime12(batch.startTime) : "Today"}
                  </span>
                  <span className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED] group-hover:underline truncate">
                    {batch.name}
                  </span>
                  {batch.subject && (
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">
                      • {batch.subject}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {batch.isRecordedToday ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#FFFFFF] dark:bg-[#262626] border border-black/[0.08] dark:border-white/[0.12] text-[#18181B] dark:text-[#EDEDED]">
                      <Check className="w-3.5 h-3.5 text-[#18181B] dark:text-[#EDEDED]" />
                      <span>
                        {batch.attendanceStats
                          ? `${batch.attendanceStats.present} Present${
                              batch.attendanceStats.absent > 0
                                ? `, ${batch.attendanceStats.absent} Absent`
                                : ""
                            }`
                          : "Recorded"}
                      </span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handle1TapPresent(batch.id);
                        }}
                        disabled={isLoading}
                        className="h-8 px-3 rounded-lg bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-[0.98] disabled:opacity-50"
                        title="Mark all active students as present for today"
                      >
                        <Zap className="w-3 h-3" />
                        <span>{isLoading ? "Saving..." : "All Present"}</span>
                      </button>

                      <span className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1 group-hover:text-[#18181B] dark:group-hover:text-[#EDEDED] transition-colors">
                        <span>Roll Call</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
