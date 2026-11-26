"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
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
    <section className="bg-[#FFFFFF] dark:bg-[#191919] border border-black/[0.07] dark:border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2.5 min-w-0">
          <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED] truncate">
            Today&apos;s Schedule
          </h2>
          <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums shrink-0">
            {todayBatches.length} {todayBatches.length === 1 ? "class" : "classes"}
          </span>
        </div>

        <Link
          href="/attendance"
          className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] inline-flex items-center gap-1 transition-colors shrink-0 group"
        >
          <span>Open register</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {todayBatches.length === 0 ? (
        <div className="px-5 py-9 text-center">
          <p className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            No batches scheduled for today.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
          {todayBatches.map((batch) => {
            const isLoading = loadingBatchId === batch.id;

            return (
              <Link
                key={batch.id}
                href={`/attendance?batchId=${batch.id}`}
                className="px-5 py-3.5 hover:bg-[#F9F9F7] dark:hover:bg-white/[0.025] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] w-[68px] shrink-0 tabular-nums">
                    {batch.startTime ? formatTime12(batch.startTime) : "Flexible"}
                  </span>

                  <div className="flex items-baseline gap-2 min-w-0 truncate">
                    <span className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED] group-hover:underline truncate">
                      {batch.name}
                    </span>
                    {batch.subject && (
                      <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">
                        {batch.subject}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 shrink-0 pl-[82px] sm:pl-0">
                  {batch.isRecordedToday ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#18181B] dark:text-[#EDEDED] tabular-nums">
                      <Check className="w-3.5 h-3.5 text-[#18181B] dark:text-[#EDEDED]" />
                      <span>
                        {batch.attendanceStats
                          ? `${batch.attendanceStats.present} present${
                              batch.attendanceStats.absent > 0
                                ? `, ${batch.attendanceStats.absent} absent`
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
                        className="h-7 px-2.5 rounded-lg bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs font-semibold transition-colors active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        title="Mark all active students as present for today"
                      >
                        {isLoading ? "Saving..." : "Mark all present"}
                      </button>

                      <span className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1 group-hover:text-[#18181B] dark:group-hover:text-[#EDEDED] transition-colors">
                        <span>Roll call</span>
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
    </section>
  );
}
