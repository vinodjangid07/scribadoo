"use client";

import React from "react";
import Link from "next/link";
import { MessageCircle, Megaphone, ArrowRight } from "lucide-react";
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
    <section className="bg-[#FFFFFF] dark:bg-[#191919] border border-black/[0.07] dark:border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED]">
            Action Needed
          </h2>
          {totalActionItems > 0 && (
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
              {totalActionItems} {totalActionItems === 1 ? "item" : "items"}
            </span>
          )}
        </div>
        <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
          Follow-ups
        </span>
      </div>

      {totalActionItems === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-xs font-medium text-[#18181B] dark:text-[#EDEDED]">
            All caught up
          </p>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
            No pending roll calls, consecutive absences, or overdue notices.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
          {unrecordedBatches.map((batch) => (
            <div
              key={`batch-${batch.id}`}
              className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9F9F7] dark:hover:bg-white/[0.025] transition-colors"
            >
              <div className="min-w-0 flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#18181B] dark:bg-[#EDEDED] mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#18181B] dark:text-[#EDEDED] truncate">
                    Roll call pending for {batch.name}
                  </div>
                  <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5 tabular-nums">
                    Scheduled today · {batch.studentCount} students
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-4 sm:pl-0">
                <button
                  onClick={() => onMarkAllPresent(batch.id)}
                  className="h-8 px-3 rounded-lg bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs font-semibold transition-colors cursor-pointer active:scale-[0.98]"
                >
                  Mark all present
                </button>
                <Link
                  href={`/attendance?batchId=${batch.id}`}
                  className="h-8 px-2.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] inline-flex items-center gap-1 transition-colors"
                >
                  <span>Edit</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}

          {consecutiveAbsences.map((student) => (
            <div
              key={`absence-${student.studentId}`}
              className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9F9F7] dark:hover:bg-white/[0.025] transition-colors"
            >
              <div className="min-w-0 flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#71717A] dark:bg-[#A1A1AA] mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#18181B] dark:text-[#EDEDED] truncate">
                    {student.studentName} missed {student.consecutiveAbsences} classes in a row
                  </div>
                  <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate mt-0.5">
                    {student.batchName} · {student.parentName || "Parent"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleWhatsAppAbsenceInquiry(student)}
                className="h-8 px-3 rounded-lg border border-black/[0.08] dark:border-white/[0.1] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 active:scale-[0.98] cursor-pointer self-start sm:self-auto ml-4 sm:ml-0"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                <span>Message parent</span>
              </button>
            </div>
          ))}

          {overdueSummary && (
            <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9F9F7] dark:hover:bg-white/[0.025] transition-colors">
              <div className="min-w-0 flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#18181B] dark:text-[#EDEDED]">
                      {overdueSummary.overdueCount} students overdue for{" "}
                      {formatMonthLabel(overdueSummary.month)}
                    </span>
                    <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
                      · {overdueSummary.daysOverdue}d past due
                    </span>
                  </div>
                  <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5 tabular-nums">
                    ₹{overdueSummary.totalPendingAmount.toLocaleString("en-IN")} pending across active batches
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenBroadcastFeeReminder}
                className="w-full sm:w-auto h-8 px-3 rounded-lg bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] shrink-0 cursor-pointer"
                title="Broadcast fee reminder to parents via WhatsApp"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Send reminders</span>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
