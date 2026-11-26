"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudentItem, StudentModal } from "./student-modal";
import {
  BatchItem,
  StudentAttendanceSummary,
  StudentFeeHistory,
  PaymentMethod,
} from "@/types/dashboard";
import { toggleArchiveStudent, deleteStudent } from "@/app/actions/students";
import { useDashboard } from "@/context/dashboard-context";
import { useUser } from "@/context/user-context";
import { ReceiptModal } from "@/components/fees/receipt-modal";
import { StudentAvatar } from "@/components/shared/student-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  MessageCircle,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils";

interface StudentProfileViewProps {
  student: StudentItem;
  batches: BatchItem[];
  initialAttendanceSummary?: StudentAttendanceSummary | null;
  initialFeeHistory?: StudentFeeHistory | null;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "Not specified";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function cleanWhatsappPhone(phone?: string | null) {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length === 10 ? `91${cleaned}` : cleaned;
}

export function StudentProfileView({
  student,
  batches,
  initialAttendanceSummary = null,
  initialFeeHistory = null,
}: StudentProfileViewProps) {
  const router = useRouter();
  const { profile } = useUser();
  const { refreshData, removeStudentLocal } = useDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [selectedReceipt, setSelectedReceipt] = useState<{
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

  const whatsappNumber = useMemo(() => {
    return cleanWhatsappPhone(student.parent_phone);
  }, [student.parent_phone]);

  const totalMonthlyFee = useMemo(() => {
    return (student.enrollments || []).reduce((sum, enr) => {
      if (enr.custom_fee !== null && enr.custom_fee !== undefined) {
        return sum + Number(enr.custom_fee);
      }
      return sum + Number(enr.batch?.default_monthly_fee || 0);
    }, 0);
  }, [student.enrollments]);

  const [attendanceSummary, setAttendanceSummary] = useState<StudentAttendanceSummary | null>(
    initialAttendanceSummary
  );
  const [feeHistory, setFeeHistory] = useState<StudentFeeHistory | null>(
    initialFeeHistory
  );

  useEffect(() => {
    setAttendanceSummary(initialAttendanceSummary);
  }, [initialAttendanceSummary, student.id]);

  useEffect(() => {
    setFeeHistory(initialFeeHistory);
  }, [initialFeeHistory, student.id]);

  const handleToggleArchive = useCallback(async () => {
    setIsArchiving(true);
    try {
      const res = await toggleArchiveStudent(student.id, !student.is_archived);
      if (res.success) {
        await refreshData();
        router.refresh();
      }
    } finally {
      setIsArchiving(false);
    }
  }, [student.id, student.is_archived, refreshData, router]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteStudent(student.id);
      if (res.success) {
        removeStudentLocal(student.id);
        await refreshData();
        router.push("/students");
      } else if (res.error) {
        setDeleteError(res.error);
        setIsDeleting(false);
      }
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete student");
      setIsDeleting(false);
    }
  }, [student.id, removeStudentLocal, refreshData, router]);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <div className="w-full flex flex-col gap-6 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to students</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleArchive}
            disabled={isArchiving}
            className="h-9 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors cursor-pointer"
          >
            {isArchiving
              ? "Saving..."
              : student.is_archived
              ? "Restore student"
              : "Archive student"}
          </button>

          <button
            type="button"
            onClick={handleOpenModal}
            className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit student</span>
          </button>
        </div>
      </div>

      {/* Student profile header */}
      <section className="bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl border border-black/[0.07] dark:border-white/[0.08] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <StudentAvatar name={student.full_name} size="lg" />

          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] dark:text-[#EDEDED] capitalize">
                {student.full_name}
              </h1>
              {student.grade && (
                <span className="px-2 py-0.5 rounded-md bg-[#F4F4F0] dark:bg-[#242424] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
                  {student.grade}
                </span>
              )}
              {student.is_archived && (
                <span className="px-2 py-0.5 rounded-md border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
                  Archived
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#71717A] dark:text-[#A1A1AA] flex-wrap tabular-nums">
              <span>Joined {formatDate(student.joined_date)}</span>
              <span>·</span>
              <span>
                {student.enrollments?.length || 0} active batch
                {student.enrollments?.length === 1 ? "" : "es"}
              </span>
            </div>
          </div>
        </div>

        <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-black/[0.06] dark:border-white/[0.07] w-full sm:w-auto flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
          <span className="font-heading text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDED] tabular-nums">
            ₹{totalMonthlyFee.toLocaleString("en-IN")}
            <span className="text-xs font-normal text-[#71717A] dark:text-[#A1A1AA]">/mo</span>
          </span>
          <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Monthly billing
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Attendance summary and recent records */}
          <section className="bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl border border-black/[0.07] dark:border-white/[0.08] overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED]">
                  Attendance Record
                </h2>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                  Cumulative sessions across enrolled batches
                </p>
              </div>

              {attendanceSummary && attendanceSummary.totalDays > 0 && (
                <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] tabular-nums">
                  {attendanceSummary.attendancePercentage}% turnout
                </span>
              )}
            </div>

            {!attendanceSummary || attendanceSummary.totalDays === 0 ? (
              <div className="px-5 py-10 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
                No attendance recorded yet. Records accumulate during batch roll calls.
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-black/[0.06] dark:border-white/[0.07]">
                  <div className="px-5 py-3.5 border-r border-b sm:border-b-0 border-black/[0.06] dark:border-white/[0.07]">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Total classes</span>
                    <span className="font-heading text-xl font-bold text-[#18181B] dark:text-[#EDEDED] mt-0.5 block tabular-nums">
                      {attendanceSummary.totalDays}
                    </span>
                  </div>
                  <div className="px-5 py-3.5 border-b sm:border-b-0 sm:border-r border-black/[0.06] dark:border-white/[0.07]">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Present</span>
                    <span className="font-heading text-xl font-bold text-[#18181B] dark:text-[#EDEDED] mt-0.5 block tabular-nums">
                      {attendanceSummary.presentDays}
                    </span>
                  </div>
                  <div className="px-5 py-3.5 border-r border-black/[0.06] dark:border-white/[0.07]">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Absent</span>
                    <span className="font-heading text-xl font-bold text-[#18181B] dark:text-[#EDEDED] mt-0.5 block tabular-nums">
                      {attendanceSummary.absentDays}
                    </span>
                  </div>
                  <div className="px-5 py-3.5">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Late</span>
                    <span className="font-heading text-xl font-bold text-[#18181B] dark:text-[#EDEDED] mt-0.5 block tabular-nums">
                      {attendanceSummary.lateDays}
                    </span>
                  </div>
                </div>

                <div className="px-5 py-2.5 bg-[#FBFBF9] dark:bg-[#151515] border-b border-black/[0.05] dark:border-white/[0.06] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
                  Recent sessions (Latest 30)
                </div>

                <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                  {attendanceSummary.recentRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="px-5 py-3 flex items-center justify-between text-xs hover:bg-[#F9F9F7] dark:hover:bg-white/[0.025] transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-medium text-[#18181B] dark:text-[#EDEDED] tabular-nums shrink-0">
                          {formatDate(rec.date)}
                        </span>
                        <span className="text-[#71717A] dark:text-[#A1A1AA] truncate">
                          {rec.batch_name}
                        </span>
                        {rec.note && (
                          <span className="text-[#71717A] dark:text-[#A1A1AA] italic truncate max-w-[180px]">
                            &ldquo;{rec.note}&rdquo;
                          </span>
                        )}
                      </div>

                      <StatusBadge status={rec.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Fee records and payment history */}
          <section className="bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl border border-black/[0.07] dark:border-white/[0.08] overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED]">
                  Fee Ledger &amp; Payments
                </h2>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                  Monthly billing cycles and payment receipts
                </p>
              </div>

              <Link
                href="/fees"
                className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] inline-flex items-center gap-1 transition-colors group"
              >
                <span>Open ledger</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {!feeHistory || (feeHistory.records.length === 0 && feeHistory.transactions.length === 0) ? (
              <div className="px-5 py-10 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
                No fee records generated yet. Monthly fee cycles generate automatically on the Fee Ledger page.
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-3 divide-x divide-black/[0.06] dark:divide-white/[0.07] border-b border-black/[0.06] dark:border-white/[0.07]">
                  <div className="px-5 py-3.5">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Total Paid</span>
                    <span className="font-heading text-base sm:text-xl font-bold text-[#18181B] dark:text-[#EDEDED] mt-0.5 block tabular-nums truncate">
                      ₹{feeHistory.totalLifetimePaid.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="px-5 py-3.5">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Balance Dues</span>
                    <span className="font-heading text-base sm:text-xl font-bold text-[#18181B] dark:text-[#EDEDED] mt-0.5 block tabular-nums truncate">
                      ₹{feeHistory.totalPendingDues.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="px-5 py-3.5">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Billing Cycles</span>
                    <span className="font-heading text-base sm:text-xl font-bold text-[#18181B] dark:text-[#EDEDED] mt-0.5 block tabular-nums">
                      {feeHistory.records.length}
                    </span>
                  </div>
                </div>

                <div className="px-5 py-2.5 bg-[#FBFBF9] dark:bg-[#151515] border-b border-black/[0.05] dark:border-white/[0.06] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
                  Monthly billing records
                </div>

                <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                  {feeHistory.records.map((rec) => {
                    const netDue = Math.max(0, rec.amount_due - rec.discount);
                    const balance = Math.max(0, netDue - rec.amount_paid);

                    return (
                      <div
                        key={rec.id}
                        className="px-5 py-3 flex items-center justify-between text-xs hover:bg-[#F9F9F7] dark:hover:bg-white/[0.025] transition-colors flex-wrap gap-2"
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-semibold text-[#18181B] dark:text-[#EDEDED] min-w-[68px] tabular-nums">
                            {rec.month}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
                            <span>Due ₹{rec.amount_due.toLocaleString("en-IN")}</span>
                            {rec.discount > 0 && <span>(-₹{rec.discount})</span>}
                            <span>·</span>
                            <span>Paid ₹{rec.amount_paid.toLocaleString("en-IN")}</span>
                            {balance > 0 && (
                              <span className="font-semibold text-[#18181B] dark:text-[#EDEDED]">
                                · Bal ₹{balance.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <StatusBadge status={rec.status} />

                          <Link
                            href={`/fees?month=${rec.month}`}
                            className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors"
                          >
                            Collect &rarr;
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {feeHistory.transactions.length > 0 && (
                  <>
                    <div className="px-5 py-2.5 bg-[#FBFBF9] dark:bg-[#151515] border-y border-black/[0.05] dark:border-white/[0.06] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
                      Payment receipts ({feeHistory.transactions.length})
                    </div>

                    <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                      {feeHistory.transactions.map((tx) => {
                        const parentRecord = feeHistory.records.find((r) => r.id === tx.fee_record_id);
                        const txMonth = parentRecord?.month || tx.payment_date.slice(0, 7);

                        return (
                          <div
                            key={tx.id}
                            className="px-5 py-3 flex items-center justify-between text-xs hover:bg-[#F9F9F7] dark:hover:bg-white/[0.025] transition-colors flex-wrap gap-2"
                          >
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-semibold font-mono text-xs text-[#18181B] dark:text-[#EDEDED]">
                                {tx.receipt_number}
                              </span>
                              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
                                {formatDate(tx.payment_date)}
                              </span>
                              <span className="text-[11px] uppercase px-1.5 py-0.5 rounded bg-[#F4F4F0] dark:bg-[#242424] text-[#71717A] dark:text-[#A1A1AA]">
                                {tx.payment_method.replace("_", " ")}
                              </span>
                              {tx.notes && (
                                <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] italic truncate max-w-[140px]">
                                  &ldquo;{tx.notes}&rdquo;
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-xs text-[#18181B] dark:text-[#EDEDED] tabular-nums">
                                ₹{tx.amount.toLocaleString("en-IN")}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedReceipt({
                                    receiptNumber: tx.receipt_number,
                                    studentName: student.full_name,
                                    parentName: student.parent_name,
                                    parentPhone: student.parent_phone,
                                    amount: tx.amount,
                                    paymentMethod: tx.payment_method,
                                    paymentDate: tx.payment_date,
                                    month: txMonth,
                                    teacherName: profile?.fullName || "Tuition Teacher",
                                  })
                                }
                                className="h-7 px-2.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Receipt className="w-3 h-3 text-[#71717A] dark:text-[#A1A1AA]" />
                                <span>Receipt</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Parent contact and enrolled batches sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl border border-black/[0.07] dark:border-white/[0.08] divide-y divide-black/[0.06] dark:divide-white/[0.07] overflow-hidden">
            <div className="p-5 flex flex-col gap-3">
              <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Parent &amp; Contact
              </span>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">Parent name</span>
                  <span className="font-semibold text-sm text-[#18181B] dark:text-[#EDEDED]">
                    {student.parent_name || "Not specified"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">Contact phone</span>
                  <span className="font-semibold text-sm text-[#18181B] dark:text-[#EDEDED] tabular-nums">
                    {formatPhoneNumber(student.parent_phone)}
                  </span>
                </div>

                {whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                      `Hi ${student.parent_name || "Parent"}, reaching out regarding ${student.full_name}'s tuition classes at Scribadoo.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 h-9 w-full flex items-center justify-center gap-2 rounded-xl bg-[#FBFBF9] dark:bg-[#141414] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                    <span>Chat on WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                  Enrolled Batches
                </span>
                <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
                  {student.enrollments?.length || 0} active
                </span>
              </div>

              {!student.enrollments || student.enrollments.length === 0 ? (
                <div className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  Not enrolled in any batches.
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                  {student.enrollments.map((enr) => {
                    const fee =
                      enr.custom_fee !== null && enr.custom_fee !== undefined
                        ? Number(enr.custom_fee)
                        : Number(enr.batch?.default_monthly_fee || 0);
                    const isOverridden = enr.custom_fee !== null && enr.custom_fee !== undefined;

                    return (
                      <div key={enr.batch_id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-[#18181B] dark:text-[#EDEDED]">
                            {enr.batch?.name || "Batch"}
                          </span>
                          <span className="font-semibold text-xs text-[#18181B] dark:text-[#EDEDED] tabular-nums">
                            ₹{fee.toLocaleString("en-IN")}/mo
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#71717A] dark:text-[#A1A1AA]">
                            {isOverridden ? "Custom rate" : "Standard fee"}
                          </span>
                          <Link
                            href="/batches"
                            className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors"
                          >
                            View batch &rarr;
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                  Teacher Notes
                </span>
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {student.notes ? (
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed italic">
                  &ldquo;{student.notes}&rdquo;
                </p>
              ) : (
                <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] italic">
                  No notes added for this student.
                </span>
              )}
            </div>

            <div className="p-5 flex flex-col gap-2 bg-[#FBFBF9] dark:bg-[#151515]">
              {deleteError && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA]">
                    Delete record
                  </span>
                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                    Permanently remove student
                  </span>
                </div>

                {showDeleteConfirm ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="h-7 px-2.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="h-7 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isDeleting ? "..." : "Confirm"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-7 px-2.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] hover:border-red-500/40 text-[#71717A] dark:text-[#A1A1AA] hover:text-red-600 dark:hover:text-red-400 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {isModalOpen && (
        <StudentModal
          isOpen={true}
          student={student}
          availableBatches={batches}
          onClose={handleCloseModal}
        />
      )}

      {selectedReceipt && (
        <ReceiptModal
          isOpen={Boolean(selectedReceipt)}
          receiptData={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
