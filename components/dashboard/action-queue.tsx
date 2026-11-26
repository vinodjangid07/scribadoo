"use client";

import React from "react";
import Link from "next/link";
import { MessageCircle, Zap, Megaphone } from "lucide-react";
import type {
  TodayBatchSchedule,
  AttendanceRiskStudent,
  OverdueSummaryAlert,
} from "@/types/dashboard";

interface ActionQueueProps {
  unrecordedBatches: TodayBatchSchedule[];
  consecutiveAbsences: AttendanceRiskStudent[];
  overdueSummary?: OverdueSummaryAlert | null;
  teacherName: string;
  onMarkAllPresent: (batchId: string) => Promise<void>;
  onOpenBroadcastFeeReminder: () => void;
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

export function ActionQueue({
  unrecordedBatches,
  consecutiveAbsences,
  overdueSummary,
  teacherName,
  onMarkAllPresent,
  onOpenBroadcastFeeReminder,
}: ActionQueueProps) {
  const totalActionItems =
    unrecordedBatches.length +
    consecutiveAbsences.length +
    (overdueSummary ? 1 : 0);

  const handleWhatsAppAbsenceInquiry = (student: AttendanceRiskStudent) => {
    const parentSalutation = student.parentName
      ? `${student.parentName} ji`
      : "Parent";
    const msg = `Namaste ${parentSalutation}, this is ${teacherName}. I noticed that ${student.studentName} was absent for the last ${student.consecutiveAbsences} tuition classes in ${student.batchName}. Hope everything is fine with them! Please let me know if they need any help with the missed lessons.`;
    const cleanPhone = student.parentPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91")
      ? cleanPhone
      : `91${cleanPhone}`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED]">
            Attention Required
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-mono font-semibold">
            {totalActionItems}
          </span>
        </div>
        <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">
          Priority triage
        </span>
      </div>

      {totalActionItems === 0 ? (
        <div className="py-8 text-center border border-dashed border-black/[0.08] dark:border-white/[0.12] rounded-xl">
          <p className="text-xs font-medium text-[#18181B] dark:text-[#EDEDED]">
            All caught up
          </p>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
            No pending roll calls, absences, or overdue alerts.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {unrecordedBatches.map((batch) => (
            <div
              key={`batch-${batch.id}`}
              className="p-3.5 rounded-xl bg-[#FAFAF9] dark:bg-[#181818] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] truncate">
                  Roll call pending: {batch.name}
                </div>
                <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                  Scheduled today, {batch.studentCount} students
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onMarkAllPresent(batch.id)}
                  className="h-8 px-3 rounded-lg bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Mark all present for today"
                >
                  <Zap className="w-3 h-3" />
                  <span>All Present</span>
                </button>
                <Link
                  href={`/attendance?batchId=${batch.id}`}
                  className="h-8 px-2.5 rounded-lg bg-[#FFFFFF] dark:bg-[#262626] border border-black/[0.08] dark:border-white/[0.12] hover:bg-[#F4F4F0] dark:hover:bg-[#323232] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] flex items-center transition-colors"
                >
                  Roll Call
                </Link>
              </div>
            </div>
          ))}

          {consecutiveAbsences.map((student) => (
            <div
              key={`absence-${student.studentId}`}
              className="p-3.5 rounded-xl bg-[#FAFAF9] dark:bg-[#181818] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] truncate">
                  {student.studentName} missed {student.consecutiveAbsences} classes
                </div>
                <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate mt-0.5">
                  {student.batchName}, parent {student.parentName || "not listed"}
                </div>
              </div>

              <button
                onClick={() => handleWhatsAppAbsenceInquiry(student)}
                className="h-8 px-3 rounded-lg bg-[#FFFFFF] dark:bg-[#262626] border border-black/[0.08] dark:border-white/[0.12] hover:bg-[#F4F4F0] dark:hover:bg-[#323232] text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] flex items-center gap-1.5 transition-colors shrink-0 active:scale-[0.98] cursor-pointer"
              >
                <MessageCircle className="w-3 h-3" />
                <span>Check-in</span>
              </button>
            </div>
          ))}

          {overdueSummary && (
            <div className="p-3.5 rounded-xl bg-[#FAFAF9] dark:bg-[#181818] border border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                    {overdueSummary.overdueCount} students overdue for{" "}
                    {formatMonthLabel(overdueSummary.month)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-mono font-semibold">
                    {overdueSummary.daysOverdue}d past due
                  </span>
                </div>
                <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                  ₹{overdueSummary.totalPendingAmount.toLocaleString("en-IN")} pending across active batches
                </div>
              </div>

              <button
                onClick={onOpenBroadcastFeeReminder}
                className="w-full sm:w-auto h-8 px-3 rounded-lg bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] shrink-0 cursor-pointer"
                title="Broadcast fee reminder to parents via WhatsApp"
              >
                <Megaphone className="w-3 h-3" />
                <span>Broadcast Reminder</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
