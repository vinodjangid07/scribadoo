"use client";

import React, { useState, useMemo, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StudentFeeEntry, MonthlyFeeSummary, PaymentMethod } from "@/types/fees";
import { RecordPaymentModal } from "./record-payment-modal";
import { BulkPaymentModal } from "./bulk-payment-modal";
import { ReceiptModal } from "./receipt-modal";
import { useUser } from "@/context/user-context";
import { ViewModeToggle } from "@/components/shared/view-mode-toggle";
import { SearchBar } from "@/components/shared/search-bar";
import { BatchFilterDropdown } from "@/components/shared/batch-filter-dropdown";
import { StatCard } from "@/components/shared/stat-card";
import { StudentAvatar } from "@/components/shared/student-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Check,
  CreditCard,
  MessageCircle,
  Receipt,
  CheckSquare,
  Square,
  Users,
  X,
} from "lucide-react";

interface FeesViewProps {
  initialMonth: string; // 'YYYY-MM'
  initialEntries: StudentFeeEntry[];
  initialSummary: MonthlyFeeSummary;
  batches?: Array<{
    id: string;
    name: string;
    subject?: string | null;
    default_monthly_fee: number;
  }>;
}

function getCurrentMonthString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthDisplay(monthStr: string) {
  try {
    const [y, m] = monthStr.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return monthStr;
  }
}

function shiftMonth(monthStr: string, delta: number) {
  try {
    const [y, m] = monthStr.split("-").map(Number);
    const date = new Date(y, m - 1 + delta, 1);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, "0");
    return `${nextY}-${nextM}`;
  } catch {
    return monthStr;
  }
}

export function FeesView({
  initialMonth,
  initialEntries = [],
  initialSummary,
  batches = [],
}: FeesViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { profile, user } = useUser();
  const teacherName = profile?.fullName || user?.email?.split("@")[0] || "Teacher";

  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth || getCurrentMonthString());
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid" | "partially_paid">("all");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkSuccessBanner, setBulkSuccessBanner] = useState<{
    count: number;
    total: number;
  } | null>(null);

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

  const isCurrentMonth = selectedMonth === getCurrentMonthString();

  const navigateToMonth = (month: string) => {
    setSelectedMonth(month);
    setSelectedStudentIds(new Set());
    startTransition(() => {
      router.push(`/fees?month=${month}`, { scroll: false });
    });
  };

  const handleShiftMonth = (delta: number) => {
    const next = shiftMonth(selectedMonth, delta);
    navigateToMonth(next);
  };

  const handleSetCurrentMonth = () => {
    const curr = getCurrentMonthString();
    navigateToMonth(curr);
  };

  const filteredEntries = useMemo(() => {
    let result = initialEntries;

    if (filterStatus === "pending") {
      result = result.filter((e) => e.status === "pending" || e.status === "overdue");
    } else if (filterStatus === "paid") {
      result = result.filter((e) => e.status === "paid");
    } else if (filterStatus === "partially_paid") {
      result = result.filter((e) => e.status === "partially_paid");
    }

    if (selectedBatchId !== "all") {
      result = result.filter((e) =>
        e.enrolled_batches.some((b) => b.batch_id === selectedBatchId)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.student_name.toLowerCase().includes(q) ||
          e.parent_name?.toLowerCase().includes(q) ||
          e.parent_phone?.includes(q) ||
          e.grade?.toLowerCase().includes(q) ||
          e.enrolled_batches.some((b) => b.batch_name.toLowerCase().includes(q))
      );
    }

    // Sort: paid students at the bottom, then sort by highest dues
    return [...result].sort((a, b) => {
      const aPaid = a.status === "paid" || a.balance_remaining <= 0;
      const bPaid = b.status === "paid" || b.balance_remaining <= 0;
      if (aPaid !== bPaid) {
        return aPaid ? 1 : -1;
      }
      if (b.balance_remaining !== a.balance_remaining) {
        return b.balance_remaining - a.balance_remaining;
      }
      return a.student_name.localeCompare(b.student_name);
    });
  }, [initialEntries, filterStatus, selectedBatchId, searchQuery]);

  const pendingFilteredEntries = useMemo(() => {
    return filteredEntries.filter((e) => e.balance_remaining > 0);
  }, [filteredEntries]);

  const allPendingSelected = useMemo(() => {
    if (pendingFilteredEntries.length === 0) return false;
    return pendingFilteredEntries.every((e) => selectedStudentIds.has(e.student_id));
  }, [pendingFilteredEntries, selectedStudentIds]);

  const isIndeterminate = useMemo(() => {
    if (allPendingSelected || pendingFilteredEntries.length === 0) return false;
    return pendingFilteredEntries.some((e) => selectedStudentIds.has(e.student_id));
  }, [allPendingSelected, pendingFilteredEntries, selectedStudentIds]);

  const toggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const toggleSelectAllPending = () => {
    if (allPendingSelected) {
      setSelectedStudentIds((prev) => {
        const next = new Set(prev);
        pendingFilteredEntries.forEach((e) => next.delete(e.student_id));
        return next;
      });
    } else {
      setSelectedStudentIds((prev) => {
        const next = new Set(prev);
        pendingFilteredEntries.forEach((e) => next.add(e.student_id));
        return next;
      });
    }
  };

  const clearSelection = () => {
    setSelectedStudentIds(new Set());
  };

  const selectedEntriesList = useMemo(() => {
    return initialEntries.filter((e) => selectedStudentIds.has(e.student_id));
  }, [initialEntries, selectedStudentIds]);

  const totalSelectedDue = useMemo(() => {
    return selectedEntriesList.reduce(
      (sum, e) => sum + (e.balance_remaining > 0 ? e.balance_remaining : 0),
      0
    );
  }, [selectedEntriesList]);

  const handleSinglePaymentSuccess = (
    receiptNumber: string,
    studentName: string,
    amount: number,
    method: PaymentMethod,
    month: string
  ) => {
    const entry = initialEntries.find((e) => e.student_name === studentName);
    setReceiptModalData({
      receiptNumber,
      studentName,
      parentName: entry?.parent_name,
      parentPhone: entry?.parent_phone,
      amount,
      paymentMethod: method,
      month,
      teacherName,
    });
    router.refresh();
  };

  const handleBulkPaymentSuccess = (count: number, total: number) => {
    setSelectedStudentIds(new Set());
    setBulkSuccessBanner({ count, total });
    setTimeout(() => {
      setBulkSuccessBanner(null);
    }, 6000);
    router.refresh();
  };

  const renderFeeCard = useCallback(
    (entry: StudentFeeEntry) => {
      const isSelected = selectedStudentIds.has(entry.student_id);

      const cleanPhone = (entry.parent_phone || "").replace(/\D/g, "");
      const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const monthName = formatMonthDisplay(entry.month);

      const waReminderLink = waPhone
        ? `https://wa.me/${waPhone}?text=${encodeURIComponent(
            `Hi ${entry.parent_name || "Parent"}, this is a gentle tuition fee reminder for ${entry.student_name} for ${monthName}. Balance pending: ₹${entry.balance_remaining}. Thank you! - ${teacherName}`
          )}`
        : null;

      return (
        <div
          key={entry.student_id}
          className={`bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-3.5 sm:gap-4 transition-all ${
            isSelected
              ? "border-black dark:border-white shadow-sm ring-1 ring-black dark:ring-white"
              : "border-black/[0.08] dark:border-white/[0.12] hover:border-black/[0.16] dark:hover:border-white/[0.2]"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <button
                type="button"
                onClick={() => toggleSelectStudent(entry.student_id)}
                disabled={entry.balance_remaining <= 0}
                title={entry.balance_remaining > 0 ? "Select student for collection" : "Fee fully paid"}
                className="mt-0.5 cursor-pointer disabled:opacity-30 shrink-0"
              >
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-[#18181B] dark:text-[#EDEDED]" />
                ) : (
                  <Square className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
                )}
              </button>

              <StudentAvatar name={entry.student_name} size="md" />

              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm text-[#18181B] dark:text-[#EDEDED] truncate">
                  {entry.student_name}
                </span>
                <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">
                  {entry.grade || "Student"} {entry.parent_name ? `• ${entry.parent_name}` : ""}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <StatusBadge status={entry.status} />
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {entry.enrolled_batches.length > 0 ? (
              entry.enrolled_batches.map((b) => (
                <span
                  key={b.batch_id}
                  className="px-2 py-0.5 rounded-md bg-[#F4F4F0] dark:bg-[#262626] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]"
                >
                  {b.batch_name}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#A1A1AA]">No batches</span>
            )}
          </div>

          <div className="grid grid-cols-3 divide-x divide-black/[0.06] dark:divide-white/[0.08] py-2 border-y border-black/[0.06] dark:border-white/[0.08] text-xs">
            <div className="flex flex-col pr-2">
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Fee Due</span>
              <span className="font-mono font-medium text-sm text-[#18181B] dark:text-[#EDEDED]">
                ₹{Number(entry.amount_due - entry.discount).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex flex-col px-2">
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Paid</span>
              <span className="font-mono text-sm text-[#71717A] dark:text-[#A1A1AA]">
                ₹{Number(entry.amount_paid).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex flex-col pl-2">
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Balance</span>
              <span className="font-mono font-bold text-sm text-[#18181B] dark:text-[#EDEDED]">
                ₹{Number(entry.balance_remaining).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {entry.balance_remaining > 0 ? (
              <button
                type="button"
                onClick={() => setPaymentModalEntry(entry)}
                className="flex-1 h-8 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] hover:bg-[#27272A] dark:hover:bg-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Collect Fee</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setReceiptModalData({
                    receiptNumber: entry.latest_receipt_number || `REC-${entry.month.replace("-", "")}-001`,
                    studentName: entry.student_name,
                    parentName: entry.parent_name,
                    parentPhone: entry.parent_phone,
                    amount: entry.amount_paid,
                    paymentMethod: entry.last_payment_method || "upi",
                    paymentDate: entry.last_payment_date || undefined,
                    month: entry.month,
                    teacherName,
                  });
                }}
                className="flex-1 h-8 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#262626] hover:bg-[#F4F4F0] dark:hover:bg-[#323232] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                <span>View Receipt</span>
              </button>
            )}

            {entry.balance_remaining > 0 && waReminderLink && (
              <a
                href={waReminderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-3 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#262626] hover:bg-[#F4F4F0] dark:hover:bg-[#323232] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                title="Send reminder on WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                <span>Remind</span>
              </a>
            )}
          </div>
        </div>
      );
    },
    [selectedStudentIds, teacherName, toggleSelectStudent]
  );

  return (
    <div className="w-full flex flex-col gap-6 pb-28">
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl text-[#18181B] dark:text-[#EDEDED] font-bold tracking-tight">
            Fee Cycles & Payments
          </h1>
          <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs sm:text-sm pt-0.5">
            1-tap monthly collection, bulk fee ledger, WhatsApp reminders, and digital receipts.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12] rounded-xl p-1 h-9">
          <button
            type="button"
            onClick={() => handleShiftMonth(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
            <Calendar className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
            <span>{formatMonthDisplay(selectedMonth)}</span>
          </div>

          <button
            type="button"
            onClick={() => handleShiftMonth(1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isCurrentMonth && (
            <button
              type="button"
              onClick={handleSetCurrentMonth}
              className="ml-1 px-2.5 h-7 rounded-lg text-xs font-semibold bg-[#18181B] dark:bg-[#262626] text-white dark:text-[#EDEDED] border border-black/10 dark:border-white/10 hover:bg-[#27272A] dark:hover:bg-[#333333] transition-colors cursor-pointer"
            >
              Current
            </button>
          )}
        </div>
      </div>

      {bulkSuccessBanner && (
        <div className="p-4 rounded-2xl bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 dark:bg-black/10 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold">Bulk Payment Successful</span>
              <span className="text-xs text-white/80 dark:text-black/80">
                Collected ₹{bulkSuccessBanner.total.toLocaleString("en-IN")} across {bulkSuccessBanner.count} students. Receipts and ledgers have been recorded.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBulkSuccessBanner(null)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 dark:hover:bg-black/10 text-white/70 dark:text-black/70 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Financial metrics */}
      <div className="sm:hidden grid grid-cols-3 divide-x divide-black/[0.06] dark:divide-white/[0.08] bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12] rounded-2xl p-3 shadow-2xs">
        <div className="pr-2">
          <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Collected
          </div>
          <div className="text-sm font-bold font-mono text-[#18181B] dark:text-[#EDEDED] mt-0.5 truncate">
            ₹{Number(initialSummary.totalCollected || 0).toLocaleString("en-IN")}
          </div>
        </div>

        <div className="px-2">
          <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Pending
          </div>
          <div className="text-sm font-bold font-mono text-[#18181B] dark:text-[#EDEDED] mt-0.5 truncate">
            ₹{Number(initialSummary.totalPending || 0).toLocaleString("en-IN")}
          </div>
        </div>

        <div className="pl-2">
          <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Billed
          </div>
          <div className="text-sm font-bold font-mono text-[#18181B] dark:text-[#EDEDED] mt-0.5 truncate">
            ₹{Number(initialSummary.totalBilled || 0).toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <div className="hidden sm:grid sm:grid-cols-3 gap-4">
        <StatCard
          label={`Collected (${formatMonthDisplay(selectedMonth)})`}
          value={`₹${Number(initialSummary.totalCollected || 0).toLocaleString("en-IN")}`}
          subtitle={`${initialSummary.paidCount} of ${initialSummary.totalStudents} students fully cleared`}
        />
        <StatCard
          label="Pending collections"
          value={`₹${Number(initialSummary.totalPending || 0).toLocaleString("en-IN")}`}
          subtitle={`${initialSummary.pendingCount + initialSummary.partiallyPaidCount} students with dues`}
        />
        <StatCard
          label="Total billed cycle"
          value={`₹${Number(initialSummary.totalBilled || 0).toLocaleString("en-IN")}`}
          subtitle="Across active batch enrollments"
        />
      </div>

      {/* Search and filter controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search student, parent, phone..."
          className="w-full lg:max-w-xs"
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12] h-9 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`flex-1 sm:flex-initial h-7 px-2.5 sm:px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer text-center ${
                filterStatus === "all"
                  ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-semibold"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
              }`}
            >
              All ({initialEntries.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("pending")}
              className={`flex-1 sm:flex-initial h-7 px-2.5 sm:px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer text-center ${
                filterStatus === "pending"
                  ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-semibold"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
              }`}
            >
              Pending ({initialSummary.pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("paid")}
              className={`flex-1 sm:flex-initial h-7 px-2.5 sm:px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer text-center ${
                filterStatus === "paid"
                  ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-semibold"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
              }`}
            >
              Paid ({initialSummary.paidCount})
            </button>
            {initialSummary.partiallyPaidCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterStatus("partially_paid")}
                className={`flex-1 sm:flex-initial h-7 px-2.5 sm:px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer text-center ${
                  filterStatus === "partially_paid"
                    ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-semibold"
                    : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                }`}
              >
                Partial ({initialSummary.partiallyPaidCount})
              </button>
            )}
          </div>

          <BatchFilterDropdown
            batches={batches}
            selectedBatchId={selectedBatchId}
            onChange={setSelectedBatchId}
            allLabel="All batches"
            className="w-full sm:w-auto shrink-0"
          />

          <div className="hidden lg:block shrink-0">
            <ViewModeToggle
              view={viewMode}
              onChange={setViewMode}
            />
          </div>
        </div>
      </div>

      {pendingFilteredEntries.length > 0 && (
        <div className="flex items-center justify-between text-xs text-[#71717A] dark:text-[#A1A1AA] px-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAllPending}
              className="inline-flex items-center gap-1.5 hover:text-[#18181B] dark:hover:text-[#EDEDED] font-medium cursor-pointer"
            >
              {allPendingSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-[#18181B] dark:text-[#EDEDED]" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>
                {allPendingSelected
                  ? "Deselect All Pending"
                  : `Select All Pending (${pendingFilteredEntries.length})`}
              </span>
            </button>
            {/* Bulk action bar */}
      {selectedStudentIds.size > 0 && (
              <span>• {selectedStudentIds.size} selected</span>
            )}
          </div>

          {/* Bulk action bar */}
      {selectedStudentIds.size > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="underline hover:text-[#18181B] dark:hover:text-[#EDEDED] cursor-pointer"
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      {isPending ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full animate-spin" />
          <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Loading fee cycle...</span>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
          <CreditCard className="w-8 h-8 text-[#A1A1AA] dark:text-[#71717A]" />
          <h3 className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED]">
            No student fee records found
          </h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-sm">
            {searchQuery || selectedBatchId !== "all" || filterStatus !== "all"
              ? "No students match your active filters or search term."
              : "No active students are currently enrolled in batches for this billing cycle."}
          </p>
        </div>
      ) : (
        <>
          {/* Fee cards (mobile) */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredEntries.map(renderFeeCard)}
          </div>

          {/* Fee table (desktop) */}
          <div className="hidden lg:block">
            {viewMode === "table" ? (
              <div className="bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-black/[0.06] dark:border-white/[0.08] bg-[#FBFBF9] dark:bg-[#181818] text-[#71717A] dark:text-[#A1A1AA] font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAllPending}
                      disabled={pendingFilteredEntries.length === 0}
                      title="Select all pending students"
                      className="inline-flex items-center justify-center cursor-pointer disabled:opacity-40"
                    >
                      {allPendingSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#18181B] dark:text-[#EDEDED]" />
                      ) : isIndeterminate ? (
                        <div className="w-4 h-4 rounded border border-black/40 dark:border-white/40 flex items-center justify-center">
                          <div className="w-2 h-0.5 bg-[#18181B] dark:bg-[#EDEDED]" />
                        </div>
                      ) : (
                        <Square className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Enrolled Batches</th>
                  <th className="py-3 px-4">Total Fee</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {filteredEntries.map((entry) => {
                  const isSelected = selectedStudentIds.has(entry.student_id);

                  const cleanPhone = (entry.parent_phone || "").replace(/\D/g, "");
                  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                  const monthName = formatMonthDisplay(entry.month);

                  const waReminderLink = waPhone
                    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(
                        `Hi ${entry.parent_name || "Parent"}, this is a gentle tuition fee reminder for ${entry.student_name} for ${monthName}. Balance pending: ₹${entry.balance_remaining}. Thank you! - ${teacherName}`
                      )}`
                    : null;

                  return (
                    <tr
                      key={entry.student_id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-[#F4F4F0] dark:bg-[#262626]"
                          : "hover:bg-[#F4F4F0]/40 dark:hover:bg-[#262626]/30"
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectStudent(entry.student_id)}
                          disabled={entry.balance_remaining <= 0}
                          title={entry.balance_remaining > 0 ? "Select student for collection" : "Fee fully paid"}
                          className="inline-flex items-center justify-center cursor-pointer disabled:opacity-30"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#18181B] dark:text-[#EDEDED]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <StudentAvatar name={entry.student_name} size="sm" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-[#18181B] dark:text-[#EDEDED]">
                              {entry.student_name}
                            </span>
                            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                              {entry.grade || "Student"}
                              {entry.parent_name ? ` • ${entry.parent_name}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA]">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {entry.enrolled_batches.length > 0 ? (
                            entry.enrolled_batches.map((b) => (
                              <span
                                key={b.batch_id}
                                className="px-2 py-0.5 rounded-md bg-[#F4F4F0] dark:bg-[#262626] text-xs font-medium text-[#18181B] dark:text-[#EDEDED]"
                              >
                                {b.batch_name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs">—</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-sm text-[#18181B] dark:text-[#EDEDED]">
                        ₹{Number(entry.amount_due - entry.discount).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-sm text-[#71717A] dark:text-[#A1A1AA]">
                        ₹{Number(entry.amount_paid).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-sm">
                        {entry.balance_remaining > 0 ? (
                          <span className="text-[#18181B] dark:text-[#EDEDED]">
                            ₹{Number(entry.balance_remaining).toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-[#A1A1AA] dark:text-[#71717A]">₹0</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={entry.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {entry.balance_remaining > 0 ? (
                            <button
                              type="button"
                              onClick={() => setPaymentModalEntry(entry)}
                              className="h-7 px-2.5 rounded-lg bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] hover:bg-[#27272A] dark:hover:bg-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Collect</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setReceiptModalData({
                                  receiptNumber: entry.latest_receipt_number || `REC-${entry.month.replace("-", "")}-001`,
                                  studentName: entry.student_name,
                                  parentName: entry.parent_name,
                                  parentPhone: entry.parent_phone,
                                  amount: entry.amount_paid,
                                  paymentMethod: entry.last_payment_method || "upi",
                                  paymentDate: entry.last_payment_date || undefined,
                                  month: entry.month,
                                  teacherName,
                                });
                              }}
                              className="h-7 px-2.5 rounded-lg border border-black/[0.08] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#262626] hover:bg-[#F4F4F0] dark:hover:bg-[#323232] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <Receipt className="w-3 h-3 text-[#71717A] dark:text-[#A1A1AA]" />
                              <span>Receipt</span>
                            </button>
                          )}

                          {entry.balance_remaining > 0 && waReminderLink && (
                            <a
                              href={waReminderLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-7 px-2 rounded-lg border border-black/[0.08] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#262626] hover:bg-[#F4F4F0] dark:hover:bg-[#323232] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                              title="Send reminder on WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3 text-[#71717A] dark:text-[#A1A1AA]" />
                              <span className="hidden md:inline">Remind</span>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredEntries.map(renderFeeCard)}
              </div>
            )}
          </div>
        </>
      )}

      {/* Bulk action bar */}
      {selectedStudentIds.size > 0 && (
        <div className="fixed bottom-20 md:bottom-6 inset-x-0 mx-auto max-w-xl z-40 px-3 sm:px-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] rounded-2xl shadow-2xl p-2.5 px-3.5 sm:p-3 sm:px-5 flex items-center justify-between gap-3 border border-white/10 dark:border-black/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/15 dark:bg-black/10 hidden sm:flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold leading-tight truncate">
                  {selectedStudentIds.size} student{selectedStudentIds.size === 1 ? "" : "s"} selected
                </span>
                <span className="text-[11px] text-white/80 dark:text-black/80 font-mono leading-tight truncate">
                  Pending: ₹{totalSelectedDue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={clearSelection}
                className="h-8 px-2.5 sm:px-3 rounded-xl text-xs font-medium text-white/70 dark:text-black/70 hover:text-white dark:hover:text-black hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                disabled={totalSelectedDue <= 0}
                className="h-8 px-3.5 sm:px-4 rounded-xl bg-white dark:bg-[#18181B] text-[#18181B] dark:text-white text-xs font-bold hover:bg-white/90 dark:hover:bg-[#27272A] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden">Collect All</span>
                <span className="hidden sm:inline">Collect All (₹{totalSelectedDue.toLocaleString("en-IN")})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <RecordPaymentModal
        entry={paymentModalEntry}
        isOpen={Boolean(paymentModalEntry)}
        onClose={() => setPaymentModalEntry(null)}
        onSuccess={handleSinglePaymentSuccess}
      />

      <BulkPaymentModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedEntries={selectedEntriesList}
        onSuccess={handleBulkPaymentSuccess}
      />

      <ReceiptModal
        isOpen={Boolean(receiptModalData)}
        onClose={() => setReceiptModalData(null)}
        receiptData={receiptModalData}
      />
    </div>
  );
}
