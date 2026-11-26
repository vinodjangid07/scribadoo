"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExecutiveDashboardData,
  OverdueStudentItem,
} from "@/types/dashboard";
import { StudentFeeEntry, PaymentMethod } from "@/types/fees";
import { useUser } from "@/context/user-context";
import { markBatchAllPresentToday } from "@/app/actions/dashboard";

import { DashboardHeader } from "./dashboard-header";
import { TodayTimeline } from "./today-timeline";
import { ActionQueue } from "./action-queue";
import { AttendanceAnalyticsCard } from "./attendance-analytics-card";
import { MonthlyCollectionCard } from "./monthly-collection-card";
import { BroadcastNoticeModal } from "./broadcast-notice-modal";
import { QuickRollCallModal } from "./quick-roll-call-modal";
import { QuickCollectModal } from "./quick-collect-modal";
import { WhatsappReminderModal } from "./whatsapp-reminder-modal";
import { RecordPaymentModal } from "@/components/fees/record-payment-modal";
import { ReceiptModal } from "@/components/fees/receipt-modal";
import { StudentAvatar } from "@/components/shared/student-avatar";
import { CreditCard, MessageCircle, ArrowRight } from "lucide-react";

interface DashboardViewProps {
  initialData: ExecutiveDashboardData;
}

export function DashboardView({ initialData }: DashboardViewProps) {
  const router = useRouter();
  const { profile, user } = useUser();
  const fullName = profile?.fullName || user?.email?.split("@")[0] || "Teacher";

  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastTemplate, setBroadcastTemplate] = useState<"timing" | "fees">("timing");
  const [isQuickRollCallOpen, setIsQuickRollCallOpen] = useState(false);
  const [isQuickCollectOpen, setIsQuickCollectOpen] = useState(false);
  const [reminderStudent, setReminderStudent] = useState<OverdueStudentItem | null>(null);

  const [paymentModalEntry, setPaymentModalEntry] = useState<StudentFeeEntry | null>(null);
  const [receiptModalData, setReceiptModalData] = useState<{
    receiptNumber: string;
    studentName: string;
    parentName?: string | null;
    parentPhone?: string | null;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate?: string;
    month: string;
    teacherName?: string;
  } | null>(null);

  const {
    todayFormatted,
    todayBatches,
    allBatchesList,
    actionQueue,
    todayCollections,
    financials,
    overdueStudents,
  } = initialData;

  const todayBatchIds = todayBatches.map((b) => b.id);

  const handleMarkAllPresent = async (batchId: string) => {
    const res = await markBatchAllPresentToday(batchId);
    if (!res.error) {
      router.refresh();
    }
  };

  const handleOpenPayment = (student: OverdueStudentItem) => {
    const entry: StudentFeeEntry = {
      fee_record_id: student.feeRecordId,
      student_id: student.studentId,
      student_name: student.studentName,
      grade: student.grade,
      parent_name: student.parentName,
      parent_phone: student.parentPhone,
      enrolled_batches: student.enrolledBatchNames.map((name) => ({
        batch_id: "",
        batch_name: name,
        fee: 0,
      })),
      month: student.month,
      amount_due: student.amountDue,
      amount_paid: Math.max(0, student.amountDue - student.balanceRemaining),
      discount: 0,
      balance_remaining: student.balanceRemaining,
      status: "pending",
      due_date: null,
    };
    setPaymentModalEntry(entry);
  };

  const handlePaymentSuccess = (
    receiptNumber: string,
    studentName: string,
    amount: number,
    method: PaymentMethod,
    month: string
  ) => {
    const student = overdueStudents.find((s) => s.studentName === studentName);
    setReceiptModalData({
      receiptNumber,
      studentName,
      parentName: student?.parentName,
      parentPhone: student?.parentPhone,
      amount,
      paymentMethod: method,
      month,
      teacherName: fullName,
    });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Quick actions header */}
      <DashboardHeader
        teacherName={fullName}
        todayFormatted={todayFormatted}
        onOpenQuickRollCall={() => setIsQuickRollCallOpen(true)}
        onOpenBroadcastNotice={() => {
          setBroadcastTemplate("timing");
          setIsBroadcastOpen(true);
        }}
        onOpenQuickCollect={() => setIsQuickCollectOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Operations column: schedule, alerts, and analytics */}
        <div className="lg:col-span-7 space-y-6">
          <TodayTimeline
            todayBatches={todayBatches}
            onMarkAllPresent={handleMarkAllPresent}
          />

          <ActionQueue
            unrecordedBatches={actionQueue.unrecordedTodayBatches}
            consecutiveAbsences={actionQueue.consecutiveAbsences}
            overdueSummary={actionQueue.overdueSummary}
            teacherName={fullName}
            onMarkAllPresent={handleMarkAllPresent}
            onOpenBroadcastFeeReminder={() => {
              setBroadcastTemplate("fees");
              setIsBroadcastOpen(true);
            }}
          />

          <AttendanceAnalyticsCard
            points={initialData.attendanceAnalytics?.points || []}
            allBatches={allBatchesList}
          />
        </div>

        {/* Financial column: monthly collections and overdue dues */}
        <div className="lg:col-span-5 space-y-6">
          <MonthlyCollectionCard
            month={financials.month}
            totalBilled={financials.totalBilled}
            totalCollected={financials.totalCollected}
            totalPending={financials.totalPending}
            clearanceRate={financials.clearanceRate}
            totalStudents={financials.totalStudents}
            paidStudentsCount={financials.paidStudentsCount}
            pendingStudentsCount={financials.pendingStudentsCount}
          />

          <div className="bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED]">
                  Pending Fee Collections
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] font-mono">
                  {overdueStudents.length}
                </span>
              </div>

              <Link
                href="/fees"
                className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {overdueStudents.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-black/[0.08] dark:border-white/[0.12] rounded-xl">
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  All enrolled students are cleared for {financials.month}.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5 sm:pr-1">
                {overdueStudents.map((student) => (
                  <div
                    key={student.studentId}
                    className="p-2.5 sm:p-3 rounded-xl bg-[#FAFAF9] dark:bg-[#181818] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] border border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 transition-colors"
                  >
                    <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <StudentAvatar name={student.studentName} size="sm" />
                        <div className="min-w-0">
                          <Link
                            href={`/students/${student.studentId}`}
                            className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED] hover:underline truncate block"
                          >
                            {student.studentName}
                          </Link>
                          <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">
                            {student.parentName || "Parent"} • {student.enrolledBatchNames.join(", ") || "Batch"}
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:hidden shrink-0">
                        <div className="text-sm font-bold font-mono text-[#18181B] dark:text-[#EDEDED]">
                          ₹{student.balanceRemaining.toLocaleString("en-IN")}
                        </div>
                        <div className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                          due
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end sm:justify-start gap-2.5 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold font-mono text-[#18181B] dark:text-[#EDEDED]">
                          ₹{student.balanceRemaining.toLocaleString("en-IN")}
                        </div>
                        <div className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                          due
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => setReminderStudent(student)}
                          className="h-8 px-3 sm:px-2.5 sm:w-auto rounded-lg bg-[#FFFFFF] dark:bg-[#262626] border border-black/[0.08] dark:border-white/[0.12] hover:bg-[#F4F4F0] dark:hover:bg-[#323232] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                          title="Send WhatsApp Reminder"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="sm:hidden text-xs">Remind</span>
                        </button>
                        <button
                          onClick={() => handleOpenPayment(student)}
                          className="h-8 px-3 sm:px-2.5 sm:w-auto rounded-lg bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                          title="Collect Payment"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span className="sm:hidden text-xs">Collect</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action modals */}
      <BroadcastNoticeModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        batches={allBatchesList}
        teacherName={fullName}
        initialTemplate={broadcastTemplate}
      />

      <QuickRollCallModal
        isOpen={isQuickRollCallOpen}
        onClose={() => setIsQuickRollCallOpen(false)}
        batches={allBatchesList}
        todayBatchIds={todayBatchIds}
      />

      <QuickCollectModal
        isOpen={isQuickCollectOpen}
        onClose={() => setIsQuickCollectOpen(false)}
        overdueStudents={overdueStudents}
        onSelectStudent={handleOpenPayment}
      />

      {reminderStudent && (
        <WhatsappReminderModal
          isOpen={Boolean(reminderStudent)}
          onClose={() => setReminderStudent(null)}
          student={reminderStudent}
          teacherName={fullName}
        />
      )}

      {paymentModalEntry && (
        <RecordPaymentModal
          isOpen={Boolean(paymentModalEntry)}
          onClose={() => setPaymentModalEntry(null)}
          entry={paymentModalEntry}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {receiptModalData && (
        <ReceiptModal
          isOpen={Boolean(receiptModalData)}
          onClose={() => setReceiptModalData(null)}
          receiptData={receiptModalData}
        />
      )}
    </div>
  );
}
