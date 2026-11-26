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
  Calendar,
  Check,
  X,
  Clock,
  MessageCircle,
  BookOpen,
  FileText,
  User,
  CreditCard,
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

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 2) || "ST"
  );
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
  const [isLoadingAttendance] = useState(false);

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
        router.push("/students");
      } else if (res.error) {
        setDeleteError(res.error);
      }
    } finally {
      setIsDeleting(false);
    }
  }, [student.id, removeStudentLocal, router]);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    router.refresh();
  }, [router]);

  return (
    <div className="w-full flex flex-col gap-6 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to students</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleArchive}
            disabled={isArchiving}
            className="h-9 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#1C1C1C] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors cursor-pointer"
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
      <div className="bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl border border-black/[0.08] dark:border-white/[0.12] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <StudentAvatar name={student.full_name} size="lg" />

          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] dark:text-[#EDEDED] capitalize">
                {student.full_name}
              </h1>
              {student.grade && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[#F4F4F0] dark:bg-[#262626] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.04] dark:border-white/[0.06]">
                  {student.grade}
                </span>
              )}
              {student.is_archived && (
                <span className="px-2 py-0.5 rounded-lg bg-[#F4F4F0] dark:bg-[#262626] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.06] dark:border-white/[0.08]">
                  Archived
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#71717A] dark:text-[#A1A1AA] flex-wrap">
              <span>Joined {formatDate(student.joined_date)}</span>
              <span>•</span>
              <span>{student.enrollments?.length || 0} active batch{student.enrollments?.length === 1 ? "" : "es"}</span>
            </div>
          </div>
        </div>

        <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-black/[0.06] dark:border-white/[0.08] w-full sm:w-auto flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
          <span className="text-xl sm:text-2xl font-bold font-mono text-[#18181B] dark:text-[#EDEDED]">
            ₹{totalMonthlyFee.toLocaleString("en-IN")}<span className="text-xs font-normal text-[#71717A] dark:text-[#A1A1AA]">/mo</span>
          </span>
          <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Total monthly billing
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Attendance summary and recent records */}
          <div className="bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl border border-black/[0.08] dark:border-white/[0.12] p-5 sm:p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h2 className="font-heading text-base font-bold text-[#18181B] dark:text-[#EDEDED]">
                  Attendance Record
                </h2>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] pt-0.5">
                  Cumulative sessions across all enrolled batches
                </p>
              </div>

              {attendanceSummary && attendanceSummary.totalDays > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] border border-black/[0.06] dark:border-white/[0.08]">
                  {attendanceSummary.attendancePercentage}% Attended
                </span>
              )}
            </div>

            {isLoadingAttendance ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full animate-spin" />
                <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  Loading attendance records...
                </span>
              </div>
            ) : !attendanceSummary || attendanceSummary.totalDays === 0 ? (
              <div className="py-10 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
                No attendance recorded yet. Attendance accumulates automatically during daily batch roll calls.
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-0 sm:divide-x sm:divide-black/[0.06] sm:dark:divide-white/[0.08] py-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <div className="flex flex-col sm:pr-3">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">Total classes</span>
                    <span className="text-xl font-bold font-mono text-[#18181B] dark:text-[#EDEDED] pt-0.5">
                      {attendanceSummary.totalDays}
                    </span>
                  </div>
                  <div className="flex flex-col sm:px-3">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">Present</span>
                    <span className="text-xl font-bold font-mono text-[#18181B] dark:text-[#EDEDED] pt-0.5">
                      {attendanceSummary.presentDays}
                    </span>
                  </div>
                  <div className="flex flex-col sm:px-3">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">Absent</span>
                    <span className="text-xl font-bold font-mono text-[#18181B] dark:text-[#EDEDED] pt-0.5">
                      {attendanceSummary.absentDays}
                    </span>
                  </div>
                  <div className="flex flex-col sm:pl-3">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">Late</span>
                    <span className="text-xl font-bold font-mono text-[#18181B] dark:text-[#EDEDED] pt-0.5">
                      {attendanceSummary.lateDays}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                    Recent Sessions (Latest 30)
                  </span>

                  <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-xl overflow-hidden">
                    <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                      {attendanceSummary.recentRecords.map((rec) => {
                        const isPresent = rec.status === "present";
                        const isAbsent = rec.status === "absent";
                        const isLate = rec.status === "late";

                        return (
                          <div
                            key={rec.id}
                            className="px-4 py-3 flex items-center justify-between text-xs hover:bg-[#F4F4F0]/40 dark:hover:bg-[#262626]/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-semibold text-[#18181B] dark:text-[#EDEDED]">
                                {formatDate(rec.date)}
                              </span>
                              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">
                                {rec.batch_name}
                              </span>
                              {rec.note && (
                                <span className="text-xs text-[#A1A1AA] dark:text-[#71717A] italic truncate max-w-[180px]">
                                  &ldquo;{rec.note}&rdquo;
                                </span>
                              )}
                            </div>

                            <StatusBadge status={rec.status} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fee records and payment history */}
          <div className="bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl border border-black/[0.08] dark:border-white/[0.12] p-5 sm:p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h2 className="font-heading text-base font-bold text-[#18181B] dark:text-[#EDEDED] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
                  <span>Fee Ledger & Payments</span>
                </h2>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] pt-0.5">
                  Monthly billing cycles and payment receipts
                </p>
              </div>

              <Link
                href="/fees"
                className="h-8 px-3 rounded-xl bg-[#F4F4F0] dark:bg-[#262626] hover:bg-[#EAEAE6] dark:hover:bg-[#333333] border border-black/[0.06] dark:border-white/[0.08] text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] transition-colors flex items-center gap-1.5"
              >
                <span>Manage in Fees</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
              </Link>
            </div>

            {!feeHistory || (feeHistory.records.length === 0 && feeHistory.transactions.length === 0) ? (
              <div className="py-10 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
                No fee records generated yet. Monthly fee cycles generate automatically when viewing the Fees dashboard.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-3 divide-x divide-black/[0.06] dark:divide-white/[0.08] py-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <div className="flex flex-col pr-2 sm:pr-3">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">Total Paid</span>
                    <span className="text-base sm:text-xl font-bold font-mono text-[#18181B] dark:text-[#EDEDED] pt-0.5 truncate">
                      ₹{feeHistory.totalLifetimePaid.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex flex-col px-2 sm:px-3">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">Balance Dues</span>
                    <span className="text-base sm:text-xl font-bold font-mono text-[#18181B] dark:text-[#EDEDED] pt-0.5 truncate">
                      ₹{feeHistory.totalPendingDues.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex flex-col pl-2 sm:pl-3">
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">Billing Cycles</span>
                    <span className="text-base sm:text-xl font-bold font-mono text-[#18181B] dark:text-[#EDEDED] pt-0.5">
                      {feeHistory.records.length}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                    Monthly Fee Records
                  </span>

                  <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-xl overflow-hidden">
                    <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                      {feeHistory.records.map((rec) => {
                        const netDue = Math.max(0, rec.amount_due - rec.discount);
                        const balance = Math.max(0, netDue - rec.amount_paid);
                        const isPaid = rec.status === "paid" || balance === 0;
                        const isPartial = rec.status === "partially_paid" || (rec.amount_paid > 0 && balance > 0);

                        return (
                          <div
                            key={rec.id}
                            className="px-4 py-3 flex items-center justify-between text-xs hover:bg-[#F4F4F0]/40 dark:hover:bg-[#262626]/30 transition-colors flex-wrap gap-2"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-[#18181B] dark:text-[#EDEDED] min-w-[70px]">
                                {rec.month}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                                <span>Due: ₹{rec.amount_due}</span>
                                {rec.discount > 0 && <span>(Disc: -₹{rec.discount})</span>}
                                <span>•</span>
                                <span>Paid: ₹{rec.amount_paid}</span>
                                {balance > 0 && (
                                  <span className="font-semibold text-[#18181B] dark:text-[#EDEDED]">
                                    (Bal: ₹{balance})
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <StatusBadge status={rec.status} />

                              <Link
                                href={`/fees?month=${rec.month}`}
                                className="text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors"
                              >
                                Collect &rarr;
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {feeHistory.transactions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                      Payment Receipts ({feeHistory.transactions.length})
                    </span>

                    <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-xl overflow-hidden">
                      <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                        {feeHistory.transactions.map((tx) => {
                          const parentRecord = feeHistory.records.find((r) => r.id === tx.fee_record_id);
                          const txMonth = parentRecord?.month || tx.payment_date.slice(0, 7);

                          return (
                            <div
                              key={tx.id}
                              className="px-4 py-3 flex items-center justify-between text-xs hover:bg-[#F4F4F0]/40 dark:hover:bg-[#262626]/30 transition-colors flex-wrap gap-2"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-semibold font-mono text-xs text-[#18181B] dark:text-[#EDEDED]">
                                  {tx.receipt_number}
                                </span>
                                <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                                  {formatDate(tx.payment_date)}
                                </span>
                                <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.06] dark:border-white/[0.08]">
                                  {tx.payment_method}
                                </span>
                                {tx.notes && (
                                  <span className="text-xs text-[#A1A1AA] dark:text-[#71717A] italic truncate max-w-[140px]">
                                    &ldquo;{tx.notes}&rdquo;
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-xs text-[#18181B] dark:text-[#EDEDED]">
                                  +₹{tx.amount.toLocaleString("en-IN")}
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
                                  className="h-7 px-2.5 rounded-lg bg-[#F4F4F0] dark:bg-[#262626] hover:bg-[#EAEAE6] dark:hover:bg-[#333333] border border-black/[0.06] dark:border-white/[0.08] text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Receipt className="w-3 h-3 text-[#71717A] dark:text-[#A1A1AA]" />
                                  <span>Receipt</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Parent contact and enrolled batches sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl border border-black/[0.08] dark:border-white/[0.12] p-5 flex flex-col">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] flex items-center gap-1.5 pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                <User className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                <span>Parent & Contact</span>
              </span>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Parent name</span>
                  <span className="font-semibold text-sm text-[#18181B] dark:text-[#EDEDED]">
                    {student.parent_name || "Not specified"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Contact phone</span>
                  <span className="font-mono font-semibold text-sm text-[#18181B] dark:text-[#EDEDED]">
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
                    className="mt-1 h-9 w-full flex items-center justify-center gap-2 rounded-xl bg-[#F4F4F0] dark:bg-[#262626] hover:bg-[#EAEAE6] dark:hover:bg-[#333333] border border-black/[0.08] dark:border-white/[0.12] text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
                    <span>Chat on WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            <div className="h-px bg-black/[0.06] dark:bg-white/[0.08] my-4" />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                  <span>Enrolled Batches</span>
                </span>
                <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  {student.enrollments?.length || 0} active
                </span>
              </div>

              {!student.enrollments || student.enrollments.length === 0 ? (
                <div className="py-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  Not enrolled in any batches.
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-black/[0.04] dark:divide-white/[0.06]">
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
                          <span className="font-mono font-bold text-xs text-[#18181B] dark:text-[#EDEDED]">
                            ₹{fee.toLocaleString("en-IN")}/mo
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          {isOverridden ? (
                            <span className="text-[#71717A] dark:text-[#A1A1AA]">
                              Custom adjusted rate
                            </span>
                          ) : (
                            <span className="text-[#71717A] dark:text-[#A1A1AA]">
                              Standard fee
                            </span>
                          )}

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

            <div className="h-px bg-black/[0.06] dark:bg-white/[0.08] my-4" />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                  <span>Teacher Notes</span>
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
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed italic pt-1">
                  &ldquo;{student.notes}&rdquo;
                </p>
              ) : (
                <span className="text-xs text-[#A1A1AA] dark:text-[#71717A] italic pt-1">
                  No notes added for this student.
                </span>
              )}
            </div>

            <div className="h-px bg-black/[0.06] dark:bg-white/[0.08] my-4" />

            <div className="flex flex-col gap-2 pt-1">
              {deleteError && (
                <div className="p-2.5 rounded-xl bg-[#F4F4F0] dark:bg-[#262626] border border-red-500/30 text-xs text-red-500 mb-2">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA]">
                    Delete record
                  </span>
                  <span className="text-xs text-[#A1A1AA] dark:text-[#71717A]">
                    Permanently remove student
                  </span>
                </div>

                {showDeleteConfirm ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="h-7 px-2.5 rounded-lg border border-black/[0.08] dark:border-white/[0.12] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="h-7 px-3 rounded-lg bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isDeleting ? "..." : "Confirm"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-7 px-2.5 rounded-lg border border-black/[0.08] dark:border-white/[0.12] hover:border-red-500/40 text-[#71717A] dark:text-[#A1A1AA] hover:text-red-500 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
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
