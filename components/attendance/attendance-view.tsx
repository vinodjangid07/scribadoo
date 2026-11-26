"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BatchItem, AttendanceStatus, BatchAttendanceEntry } from "@/types/dashboard";
import { saveBatchAttendance } from "@/app/actions/attendance";
import { ViewModeToggle } from "@/components/shared/view-mode-toggle";
import { SearchBar } from "@/components/shared/search-bar";
import { StudentAvatar } from "@/components/shared/student-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Users,
  FileText,
  MessageCircle,
} from "lucide-react";

interface AttendanceViewProps {
  initialBatches: BatchItem[];
  initialBatchId?: string;
  initialDate?: string;
  initialEntries?: BatchAttendanceEntry[];
  initialIsRecorded?: boolean;
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr: string) {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
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

export function AttendanceView({
  initialBatches = [],
  initialBatchId = "",
  initialDate = "",
  initialEntries = [],
  initialIsRecorded = false,
}: AttendanceViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || getTodayString()
  );
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    initialBatchId || initialBatches[0]?.id || ""
  );

  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");

  const [entries, setEntries] = useState<BatchAttendanceEntry[]>(initialEntries);
  const [originalEntries, setOriginalEntries] = useState<BatchAttendanceEntry[]>(initialEntries);
  const [isRecorded, setIsRecorded] = useState(initialIsRecorded);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingNoteStudentId, setEditingNoteStudentId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDate(initialDate || getTodayString());
    setSelectedBatchId(initialBatchId || initialBatches[0]?.id || "");
    setEntries(initialEntries);
    setOriginalEntries(initialEntries);
    setIsRecorded(initialIsRecorded);
    setHasUnsavedChanges(false);
  }, [initialBatchId, initialDate, initialEntries, initialIsRecorded, initialBatches]);

  const navigateTo = (batchId: string, date: string) => {
    startTransition(() => {
      router.push(`/attendance?batchId=${batchId}&date=${date}`, { scroll: false });
    });
  };

  const handleSelectBatch = (batchId: string) => {
    if (batchId === selectedBatchId) return;
    if (hasUnsavedChanges) {
      const confirmDiscard = window.confirm(
        "You have unsaved changes in roll call. Discard changes and switch batch?"
      );
      if (!confirmDiscard) return;
    }
    setSelectedBatchId(batchId);
    navigateTo(batchId, selectedDate);
  };

  const handleShiftDate = (days: number) => {
    if (hasUnsavedChanges) {
      const confirmDiscard = window.confirm(
        "You have unsaved changes in roll call. Discard changes and switch date?"
      );
      if (!confirmDiscard) return;
    }
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      date.setDate(date.getDate() + days);
      const newYear = date.getFullYear();
      const newMonth = String(date.getMonth() + 1).padStart(2, "0");
      const newDay = String(date.getDate()).padStart(2, "0");
      const nextDate = `${newYear}-${newMonth}-${newDay}`;
      setSelectedDate(nextDate);
      navigateTo(selectedBatchId, nextDate);
    } catch {
      // Date parse error
    }
  };

  const handleSetToday = () => {
    if (hasUnsavedChanges) {
      const confirmDiscard = window.confirm(
        "You have unsaved changes in roll call. Discard changes?"
      );
      if (!confirmDiscard) return;
    }
    const today = getTodayString();
    setSelectedDate(today);
    navigateTo(selectedBatchId, today);
  };

  const selectedDayOfWeek = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      return WEEKDAY_NAMES[date.getDay()];
    } catch {
      return "";
    }
  }, [selectedDate]);

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setEntries((prev) =>
      prev.map((e) => (e.student_id === studentId ? { ...e, status } : e))
    );
    setSaveSuccess(false);
    setHasUnsavedChanges(true);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setEntries((prev) => prev.map((e) => ({ ...e, status })));
    setSaveSuccess(false);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!selectedBatchId || entries.length === 0) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await saveBatchAttendance({
        batchId: selectedBatchId,
        date: selectedDate,
        entries: entries.map((e) => ({
          studentId: e.student_id,
          status: e.status,
          note: e.note,
        })),
      });

      if (res.success) {
        setIsRecorded(true);
        setSaveSuccess(true);
        setHasUnsavedChanges(false);
        setOriginalEntries(entries);
        router.refresh();
        setTimeout(() => setSaveSuccess(false), 3500);
      } else if (res.error) {
        alert(res.error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setEntries(originalEntries);
    setHasUnsavedChanges(false);
  };

  const handleUpdateNote = (studentId: string, noteText: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.student_id === studentId ? { ...e, note: noteText || null } : e
      )
    );
    setSaveSuccess(false);
    setHasUnsavedChanges(true);
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase().trim();
    return entries.filter(
      (e) =>
        e.student_name.toLowerCase().includes(q) ||
        e.parent_name?.toLowerCase().includes(q) ||
        e.parent_phone?.includes(q) ||
        e.grade?.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  // Holidays are excluded from countable sessions
  const stats = useMemo(() => {
    const total = entries.length;
    const present = entries.filter((e) => e.status === "present").length;
    const absent = entries.filter((e) => e.status === "absent").length;
    const late = entries.filter((e) => e.status === "late").length;
    const holiday = entries.filter((e) => e.status === "holiday").length;
    const countable = total - holiday;
    const pct = countable > 0 ? Math.round(((present + late) / countable) * 100) : (holiday > 0 ? 100 : 100);
    const isFullHoliday = total > 0 && holiday === total;
    return { total, present, absent, late, holiday, pct, isFullHoliday };
  }, [entries]);

  const selectedBatch = initialBatches.find((b) => b.id === selectedBatchId);
  const isToday = selectedDate === getTodayString();

  const renderAttendanceCard = (entry: BatchAttendanceEntry) => {
    const isPresent = entry.status === "present";
    const isAbsent = entry.status === "absent";
    const isLate = entry.status === "late";
    const isHoliday = entry.status === "holiday";
    const isEditingThisNote = editingNoteStudentId === entry.student_id;

    const cleanPhone = (entry.parent_phone || "").replace(/\D/g, "");
    const waLink =
      cleanPhone && isAbsent
        ? `https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(
            `Hi ${entry.parent_name || "Parent"}, this is a quick update from tuition that ${entry.student_name} is marked absent for ${selectedBatch?.name || "class"} today (${formatDateDisplay(selectedDate)}).`
          )}`
        : null;

    return (
      <div
        key={entry.student_id}
        className={`group relative p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
          isAbsent
            ? "bg-[#FBFBF9]/80 dark:bg-[#161616] border-black/[0.08] dark:border-white/[0.08] opacity-75"
            : "bg-[#FFFFFF] dark:bg-[#1C1C1C] border-black/[0.08] dark:border-white/[0.12] hover:border-black/[0.18] dark:hover:border-white/[0.22]"
        }`}
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <StudentAvatar name={entry.student_name} size="md" />

            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate text-[#18181B] dark:text-[#EDEDED]">
                {entry.student_name}
              </span>
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">
                {entry.grade || "Student"}
                {entry.parent_name ? ` · ${entry.parent_name}` : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isHoliday && (
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.06] dark:border-white/[0.08]">
                Holiday
              </span>
            )}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F4F4F0] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] shrink-0">
              <button
                type="button"
                onClick={() => handleSetStatus(entry.student_id, "present")}
                className={`h-8 sm:h-7 px-3 sm:px-2.5 min-w-[32px] rounded-md text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  isPresent
                    ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] shadow-xs"
                    : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                }`}
                title="Mark Present"
              >
                P
              </button>
              <button
                type="button"
                onClick={() => handleSetStatus(entry.student_id, "absent")}
                className={`h-8 sm:h-7 px-3 sm:px-2.5 min-w-[32px] rounded-md text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  isAbsent
                    ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] shadow-xs"
                    : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                }`}
                title="Mark Absent"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleSetStatus(entry.student_id, "late")}
                className={`h-8 sm:h-7 px-3 sm:px-2.5 min-w-[32px] rounded-md text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  isLate
                    ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] shadow-xs"
                    : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                }`}
                title="Mark Late"
              >
                L
              </button>
            </div>
          </div>
        </div>

        {isAbsent && waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Notify {entry.parent_name ? entry.parent_name.split(" ")[0] : "Parent"} on WhatsApp</span>
          </a>
        )}

        {isEditingThisNote ? (
          <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center gap-1.5 w-full">
            <input
              type="text"
              placeholder="Note (e.g. Arrived 15m late)"
              value={entry.note || ""}
              onChange={(e) => handleUpdateNote(entry.student_id, e.target.value)}
              className="flex-1 text-xs px-2.5 py-1 rounded-lg bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.1] dark:border-white/[0.15] outline-none text-[#18181B] dark:text-[#EDEDED]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") {
                  setEditingNoteStudentId(null);
                }
              }}
            />
            <button
              type="button"
              onClick={() => setEditingNoteStudentId(null)}
              className="px-2.5 py-1 text-xs rounded-lg bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : entry.note ? (
          <div
            className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2"
            onClick={() => setEditingNoteStudentId(entry.student_id)}
          >
            <span className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] italic truncate">
              &ldquo;{entry.note}&rdquo;
            </span>
            <span className="text-xs text-[#A1A1AA] dark:text-[#71717A] hover:text-[#18181B] dark:hover:text-[#EDEDED] underline shrink-0 cursor-pointer">
              Edit
            </span>
          </div>
        ) : (
          <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-end">
            <button
              type="button"
              onClick={() => setEditingNoteStudentId(entry.student_id)}
              className="text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] flex items-center gap-1.5 cursor-pointer transition-colors py-0.5 px-1.5 rounded-md hover:bg-[#F4F4F0] dark:hover:bg-[#262626]"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Add note</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-24">
      {/* Header and date controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl sm:text-3xl text-[#18181B] dark:text-[#EDEDED] font-bold tracking-tight">
              Attendance
            </h1>
            <div className="hidden sm:inline-flex">
              {isRecorded && !hasUnsavedChanges ? (
                <StatusBadge status="recorded" />
              ) : hasUnsavedChanges ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Unsaved changes</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/[0.04] dark:bg-white/[0.06] text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.06] dark:border-white/[0.08]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A1A1AA] dark:bg-[#71717A]" />
                  <span>Not marked yet</span>
                </span>
              )}
            </div>
          </div>
          <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs sm:text-sm pt-0.5">
            10-second roll call. Mark exceptions, then save.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
          <div className="flex items-center gap-1 bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12] rounded-xl p-1 h-9">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer"
              title="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
              <CalendarIcon className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
              <span>{formatDateDisplay(selectedDate)}</span>
            </div>

            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer"
              title="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                type="button"
                onClick={handleSetToday}
                className="ml-1 px-2.5 h-7 rounded-lg text-xs font-semibold bg-[#18181B] dark:bg-[#262626] text-white dark:text-[#EDEDED] border border-black/10 dark:border-white/10 hover:bg-[#27272A] dark:hover:bg-[#333333] transition-colors cursor-pointer"
              >
                Today
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || entries.length === 0}
            className={`h-9 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0 ${
              hasUnsavedChanges || !isRecorded
                ? "bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] shadow-xs"
                : "bg-[#FFFFFF] dark:bg-[#1C1C1C] text-[#18181B] dark:text-[#EDEDED] border border-black/[0.08] dark:border-white/[0.12] hover:bg-[#F4F4F0] dark:hover:bg-[#262626]"
            }`}
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <Check className="w-4 h-4" />
                <span>Save changes</span>
              </>
            ) : isRecorded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Recorded</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm All Present</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Batch selection tabs */}
      {initialBatches.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {initialBatches.map((batch) => {
            const isSelected = batch.id === selectedBatchId;
            const isScheduledForDate = (batch.days || []).includes(selectedDayOfWeek);

            return (
              <button
                key={batch.id}
                type="button"
                onClick={() => handleSelectBatch(batch.id)}
                className={`h-9 px-3.5 rounded-xl text-xs font-medium flex items-center gap-2 shrink-0 transition-all border cursor-pointer ${
                  isSelected
                    ? "bg-[#18181B] dark:bg-[#27272A] text-white dark:text-[#EDEDED] border-black/20 dark:border-white/20 font-semibold"
                    : "bg-[#FFFFFF] dark:bg-[#1C1C1C] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] border-black/[0.08] dark:border-white/[0.12] hover:bg-[#F4F4F0] dark:hover:bg-[#262626]"
                }`}
              >
                <span>{batch.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {initialBatches.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-4 bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
          <div className="w-12 h-12 rounded-2xl bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div className="max-w-md flex flex-col gap-1">
            <h3 className="text-base font-bold text-[#18181B] dark:text-[#EDEDED]">
              No batches created yet
            </h3>
            <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs sm:text-sm">
              Create your batches first to begin taking daily attendance.
            </p>
          </div>
        </div>
      ) : isPending ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full animate-spin" />
          <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Loading roster...
          </span>
        </div>
      ) : entries.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-4 bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
          <div className="w-12 h-12 rounded-2xl bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div className="max-w-md flex flex-col gap-1">
            <h3 className="text-base font-bold text-[#18181B] dark:text-[#EDEDED]">
              No students enrolled in this batch
            </h3>
            <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs sm:text-sm">
              Enroll students into &ldquo;{selectedBatch?.name}&rdquo; from the Students page to mark attendance.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {!isRecorded && !hasUnsavedChanges && entries.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12]">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  Attendance has <strong className="text-[#18181B] dark:text-[#EDEDED]">not been marked</strong> for {formatDateDisplay(selectedDate)}. All students default to present.
                </span>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 px-3.5 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] text-xs font-semibold hover:bg-[#27272A] dark:hover:bg-white transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Confirm All Present"}
              </button>
            </div>
          )}

          {/* Search and quick actions */}
          <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs flex-wrap">
              {stats.isFullHoliday ? (
                <span className="font-semibold px-2.5 py-1 rounded-lg bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.06] dark:border-white/[0.08]">
                  Batch Holiday declared
                </span>
              ) : (
                <>
                  <span className="font-semibold text-[#18181B] dark:text-[#EDEDED]">
                    {stats.present} <span className="font-normal text-[#71717A] dark:text-[#A1A1AA]">present</span>
                  </span>
                  <span className="text-black/20 dark:text-white/20">•</span>
                  <span className="font-semibold text-[#18181B] dark:text-[#EDEDED]">
                    {stats.absent} <span className="font-normal text-[#71717A] dark:text-[#A1A1AA]">absent</span>
                  </span>
                  {stats.late > 0 && (
                    <>
                      <span className="text-black/20 dark:text-white/20">•</span>
                      <span className="font-semibold text-[#18181B] dark:text-[#EDEDED]">
                        {stats.late} <span className="font-normal text-[#71717A] dark:text-[#A1A1AA]">late</span>
                      </span>
                    </>
                  )}
                  {stats.holiday > 0 && (
                    <>
                      <span className="text-black/20 dark:text-white/20">•</span>
                      <span className="font-semibold text-[#18181B] dark:text-[#EDEDED]">
                        {stats.holiday} <span className="font-normal text-[#71717A] dark:text-[#A1A1AA]">holiday</span>
                      </span>
                    </>
                  )}
                  <span className="text-black/20 dark:text-white/20">•</span>
                  <span className="font-mono text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA]">
                    {stats.pct}% attendance
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Find student..."
                className="w-full sm:w-48"
              />

              <button
                type="button"
                onClick={() => handleMarkAll("present")}
                className="h-9 px-3 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#1C1C1C] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors cursor-pointer"
              >
                Mark all Present
              </button>

              <button
                type="button"
                onClick={() => handleMarkAll("holiday")}
                className="h-9 px-3 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#1C1C1C] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors cursor-pointer"
              >
                Batch Holiday
              </button>

              <div className="hidden sm:block">
                <ViewModeToggle
                  view={viewMode}
                  onChange={setViewMode}
                />
              </div>
            </div>
          </div>

          {/* Attendance cards and table */}
          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredEntries.map(renderAttendanceCard)}
            </div>
          ) : (
            <>
              {/* Attendance cards (mobile) */}
              <div className="sm:hidden grid grid-cols-1 gap-3">
                {filteredEntries.map(renderAttendanceCard)}
              </div>

              {/* Attendance table (desktop) */}
              <div className="hidden sm:block bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-black/[0.06] dark:border-white/[0.08] bg-[#FBFBF9] dark:bg-[#181818] text-[#71717A] dark:text-[#A1A1AA] font-semibold uppercase tracking-wider text-xs">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Grade & Parent</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Note / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {filteredEntries.map((entry) => {
                      const isPresent = entry.status === "present";
                      const isAbsent = entry.status === "absent";
                      const isLate = entry.status === "late";
                      const isHoliday = entry.status === "holiday";
                      const isEditingThisNote = editingNoteStudentId === entry.student_id;

                      const cleanPhone = (entry.parent_phone || "").replace(/\D/g, "");
                      const waLink =
                        cleanPhone && isAbsent
                          ? `https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(
                              `Hi ${entry.parent_name || "Parent"}, this is a quick update from tuition that ${entry.student_name} is marked absent for ${selectedBatch?.name || "class"} today (${formatDateDisplay(selectedDate)}).`
                            )}`
                          : null;

                      return (
                        <tr
                          key={entry.student_id}
                          className={`transition-colors ${
                            isAbsent
                              ? "bg-[#FBFBF9]/60 dark:bg-[#161616]/60 opacity-80"
                              : "hover:bg-[#F4F4F0]/50 dark:hover:bg-[#262626]/30"
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <StudentAvatar name={entry.student_name} size="sm" />
                              <span className="font-semibold text-sm text-[#18181B] dark:text-[#EDEDED]">
                                {entry.student_name}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-[#71717A] dark:text-[#A1A1AA]">
                            <span>{entry.grade || "—"}</span>
                            {entry.parent_name && (
                              <span className="text-xs block text-[#A1A1AA] dark:text-[#71717A]">
                                {entry.parent_name} ({entry.parent_phone})
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-2">
                              {isHoliday && (
                                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.06] dark:border-white/[0.08]">
                                  Holiday
                                </span>
                              )}
                              <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F4F4F0] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08]">
                              <button
                                type="button"
                                onClick={() => handleSetStatus(entry.student_id, "present")}
                                className={`h-8 sm:h-7 px-3 sm:px-2.5 min-w-[32px] rounded-md text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                                  isPresent
                                    ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212]"
                                    : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                                }`}
                                title="Mark Present"
                              >
                                P
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetStatus(entry.student_id, "absent")}
                                className={`h-8 sm:h-7 px-3 sm:px-2.5 min-w-[32px] rounded-md text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                                  isAbsent
                                    ? "bg-red-600 text-white"
                                    : "text-[#71717A] dark:text-[#A1A1AA] hover:text-red-500"
                                }`}
                                title="Mark Absent"
                              >
                                A
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetStatus(entry.student_id, "late")}
                                className={`h-8 sm:h-7 px-3 sm:px-2.5 min-w-[32px] rounded-md text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                                  isLate
                                    ? "bg-amber-600 text-white"
                                    : "text-[#71717A] dark:text-[#A1A1AA] hover:text-amber-500"
                                }`}
                                title="Mark Late"
                              >
                                L
                              </button>
                            </div>
                          </div>
                        </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {isAbsent && waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>
                              )}

                              {isEditingThisNote ? (
                                <div className="flex items-center gap-1.5 max-w-xs">
                                  <input
                                    type="text"
                                    placeholder="Quick note"
                                    value={entry.note || ""}
                                    onChange={(e) => handleUpdateNote(entry.student_id, e.target.value)}
                                    className="w-full text-xs px-2 py-1 rounded-lg bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.1] dark:border-white/[0.15] outline-none text-[#18181B] dark:text-[#EDEDED]"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === "Escape") {
                                        setEditingNoteStudentId(null);
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setEditingNoteStudentId(null)}
                                    className="px-2 py-1 text-xs rounded-lg bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-semibold"
                                  >
                                    OK
                                  </button>
                                </div>
                              ) : entry.note ? (
                                <button
                                  type="button"
                                  onClick={() => setEditingNoteStudentId(entry.student_id)}
                                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] text-xs flex items-center gap-1.5"
                                >
                                  <span className="italic truncate max-w-[180px]">&ldquo;{entry.note}&rdquo;</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingNoteStudentId(entry.student_id)}
                                  className="text-[#A1A1AA] dark:text-[#71717A] hover:text-[#18181B] dark:hover:text-[#EDEDED] text-xs flex items-center gap-1"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Note</span>
                                </button>
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
          </>
        )}

          {/* Floating save action */}
          {hasUnsavedChanges && (
            <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-30 bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Unsaved changes in roll call</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={isSaving}
                  className="h-7 px-3 rounded-xl bg-transparent hover:bg-white/10 dark:hover:bg-black/10 text-white/80 dark:text-[#121212]/80 hover:text-white dark:hover:text-[#121212] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-7 px-3 rounded-xl bg-white dark:bg-[#18181B] text-[#18181B] dark:text-white text-xs font-bold hover:bg-[#F4F4F0] dark:hover:bg-[#27272A] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
