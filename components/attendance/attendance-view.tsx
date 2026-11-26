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

  const stats = useMemo(() => {
    const total = entries.length;
    const present = entries.filter((e) => e.status === "present").length;
    const absent = entries.filter((e) => e.status === "absent").length;
    const late = entries.filter((e) => e.status === "late").length;
    const holiday = entries.filter((e) => e.status === "holiday").length;
    const countable = total - holiday;
    const pct = countable > 0 ? Math.round(((present + late) / countable) * 100) : 100;
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
        className={`p-4 rounded-2xl border transition-colors flex flex-col justify-between gap-3 ${
          isAbsent
            ? "bg-[#FBFBF9] dark:bg-[#151515] border-black/[0.06] dark:border-white/[0.07]"
            : "bg-[#FFFFFF] dark:bg-[#191919] border-black/[0.07] dark:border-white/[0.08]"
        }`}
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <StudentAvatar name={entry.student_name} size="md" />

            <div className="flex flex-col min-w-0">
              <span className={`text-sm font-semibold truncate ${isAbsent ? "text-[#71717A] dark:text-[#A1A1AA]" : "text-[#18181B] dark:text-[#EDEDED]"}`}>
                {entry.student_name}
              </span>
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">
                {entry.grade || "Student"}
                {entry.parent_name ? ` · ${entry.parent_name}` : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isHoliday && <StatusBadge status="holiday" />}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F4F4F0] dark:bg-[#242424] border border-black/[0.06] dark:border-white/[0.08] shrink-0">
              <button
                type="button"
                onClick={() => handleSetStatus(entry.student_id, "present")}
                className={`h-8 sm:h-7 px-3 sm:px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
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
                className={`h-8 sm:h-7 px-3 sm:px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  isAbsent
                    ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212]"
                    : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                }`}
                title="Mark Absent"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleSetStatus(entry.student_id, "late")}
                className={`h-8 sm:h-7 px-3 sm:px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  isLate
                    ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212]"
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
            className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] text-[#18181B] dark:text-[#EDEDED] text-xs font-medium transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
            <span>Notify {entry.parent_name ? entry.parent_name.split(" ")[0] : "Parent"} on WhatsApp</span>
          </a>
        )}

        {isEditingThisNote ? (
          <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center gap-1.5 w-full">
            <input
              type="text"
              placeholder="Note (e.g. Arrived 15m late)"
              value={entry.note || ""}
              onChange={(e) => handleUpdateNote(entry.student_id, e.target.value)}
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-[#FBFBF9] dark:bg-[#141414] border border-black/[0.1] dark:border-white/[0.15] outline-none text-[#18181B] dark:text-[#EDEDED]"
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
              className="px-2.5 py-1.5 text-xs rounded-lg bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : entry.note ? (
          <div
            className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between gap-2 cursor-pointer"
            onClick={() => setEditingNoteStudentId(entry.student_id)}
          >
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] italic truncate">
              &ldquo;{entry.note}&rdquo;
            </span>
            <span className="text-xs text-[#71717A] hover:text-[#18181B] dark:hover:text-[#EDEDED] underline shrink-0">
              Edit
            </span>
          </div>
        ) : (
          <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-end">
            <button
              type="button"
              onClick={() => setEditingNoteStudentId(entry.student_id)}
              className="text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <FileText className="w-3 h-3" />
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
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl sm:text-3xl text-[#18181B] dark:text-[#EDEDED] font-bold tracking-tight">
              Attendance
            </h1>
            <div className="hidden sm:inline-flex">
              {isRecorded && !hasUnsavedChanges ? (
                <StatusBadge status="recorded" />
              ) : hasUnsavedChanges ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border border-black/[0.12] dark:border-white/[0.15] text-[#18181B] dark:text-[#EDEDED]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Unsaved</span>
                </span>
              ) : (
                <StatusBadge status="pending" label="Not marked" />
              )}
            </div>
          </div>
          <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs sm:text-sm pt-1">
            Students default to present. Mark only absences or late arrivals, then save.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
          <div className="flex items-center gap-1 bg-[#FFFFFF] dark:bg-[#191919] border border-black/[0.08] dark:border-white/[0.1] rounded-xl p-1 h-9">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] transition-colors cursor-pointer"
              title="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2 text-xs font-medium text-[#18181B] dark:text-[#EDEDED] tabular-nums">
              <CalendarIcon className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
              <span>{formatDateDisplay(selectedDate)}</span>
            </div>

            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] transition-colors cursor-pointer"
              title="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                type="button"
                onClick={handleSetToday}
                className="ml-1 px-2.5 h-7 rounded-lg text-xs font-semibold bg-[#F4F4F0] dark:bg-[#242424] text-[#18181B] dark:text-[#EDEDED] hover:bg-[#EAEAE6] dark:hover:bg-[#303030] transition-colors cursor-pointer"
              >
                Today
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || entries.length === 0}
            className={`h-9 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0 ${
              hasUnsavedChanges || !isRecorded
                ? "bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212]"
                : "bg-[#FFFFFF] dark:bg-[#191919] text-[#18181B] dark:text-[#EDEDED] border border-black/[0.08] dark:border-white/[0.1] hover:bg-[#F4F4F0] dark:hover:bg-[#242424]"
            }`}
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save changes</span>
              </>
            ) : isRecorded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Recorded</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Confirm all present</span>
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
            const isScheduledToday = (batch.days || []).includes(selectedDayOfWeek);

            return (
              <button
                key={batch.id}
                type="button"
                onClick={() => handleSelectBatch(batch.id)}
                className={`h-9 px-3.5 rounded-xl text-xs flex items-center gap-2 shrink-0 transition-colors border cursor-pointer ${
                  isSelected
                    ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] border-transparent font-semibold"
                    : "bg-[#FFFFFF] dark:bg-[#191919] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] border-black/[0.08] dark:border-white/[0.1]"
                }`}
              >
                {isScheduledToday && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isSelected
                        ? "bg-white dark:bg-[#121212]"
                        : "bg-[#18181B] dark:bg-[#EDEDED]"
                    }`}
                  />
                )}
                <span>{batch.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {initialBatches.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-4 bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl border border-black/[0.07] dark:border-white/[0.08]">
          <div className="w-11 h-11 rounded-2xl bg-[#F4F4F0] dark:bg-[#242424] text-[#71717A] dark:text-[#A1A1AA] flex items-center justify-center">
            <Users className="w-5 h-5" />
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
        <div className="p-12 text-center flex flex-col items-center justify-center gap-4 bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl border border-black/[0.07] dark:border-white/[0.08]">
          <div className="w-11 h-11 rounded-2xl bg-[#F4F4F0] dark:bg-[#242424] text-[#71717A] dark:text-[#A1A1AA] flex items-center justify-center">
            <Users className="w-5 h-5" />
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
        <div className="flex flex-col gap-5">
          {/* Unified attendance summary strip */}
          <section className="bg-[#FFFFFF] dark:bg-[#191919] border border-black/[0.07] dark:border-white/[0.08] rounded-2xl grid grid-cols-4 divide-x divide-black/[0.06] dark:divide-white/[0.07]">
            <div className="px-4 sm:px-5 py-3.5">
              <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
                Present
              </div>
              <div className="font-heading text-lg sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDED] mt-0.5 tabular-nums">
                {stats.present}
              </div>
            </div>
            <div className="px-4 sm:px-5 py-3.5">
              <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
                Absent
              </div>
              <div className="font-heading text-lg sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDED] mt-0.5 tabular-nums">
                {stats.absent}
              </div>
            </div>
            <div className="px-4 sm:px-5 py-3.5">
              <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
                Late
              </div>
              <div className="font-heading text-lg sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDED] mt-0.5 tabular-nums">
                {stats.late}
              </div>
            </div>
            <div className="px-4 sm:px-5 py-3.5">
              <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
                {stats.isFullHoliday ? "Status" : "Turnout"}
              </div>
              <div className="font-heading text-lg sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDED] mt-0.5 tabular-nums truncate">
                {stats.isFullHoliday ? "Holiday" : `${stats.pct}%`}
              </div>
            </div>
          </section>

          {/* Search and quick actions */}
          <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search student in batch..."
              className="w-full sm:max-w-xs"
            />

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleMarkAll("present")}
                className="h-9 px-3 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] transition-colors cursor-pointer"
              >
                All present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll("holiday")}
                className="h-9 px-3 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors cursor-pointer"
              >
                Mark holiday
              </button>

              <div className="hidden sm:block">
                <ViewModeToggle view={viewMode} onChange={setViewMode} />
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
              <div className="hidden sm:block bg-[#FFFFFF] dark:bg-[#191919] border border-black/[0.07] dark:border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-black/[0.06] dark:border-white/[0.07] bg-[#FBFBF9] dark:bg-[#151515] text-[#71717A] dark:text-[#A1A1AA] font-medium">
                        <th className="py-3 px-5">Student</th>
                        <th className="py-3 px-4">Grade &amp; Parent</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-5 text-right">Note / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
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
                                ? "bg-[#FBFBF9]/80 dark:bg-white/[0.015]"
                                : "hover:bg-[#F9F9F7] dark:hover:bg-white/[0.025]"
                            }`}
                          >
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <StudentAvatar name={entry.student_name} size="sm" />
                                <span
                                  className={`font-semibold text-sm capitalize ${
                                    isAbsent
                                      ? "text-[#71717A] dark:text-[#A1A1AA]"
                                      : "text-[#18181B] dark:text-[#EDEDED]"
                                  }`}
                                >
                                  {entry.student_name}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-[#71717A] dark:text-[#A1A1AA]">
                              <span className="text-xs font-medium text-[#18181B] dark:text-[#EDEDED]">
                                {entry.grade || "—"}
                              </span>
                              {entry.parent_name && (
                                <span className="text-xs block text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
                                  {entry.parent_name} · {entry.parent_phone}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center gap-2">
                                {isHoliday && <StatusBadge status="holiday" />}
                                <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F4F4F0] dark:bg-[#242424] border border-black/[0.06] dark:border-white/[0.08]">
                                  <button
                                    type="button"
                                    onClick={() => handleSetStatus(entry.student_id, "present")}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                      isPresent
                                        ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-semibold"
                                        : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                                    }`}
                                  >
                                    Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetStatus(entry.student_id, "absent")}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                      isAbsent
                                        ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-semibold"
                                        : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                                    }`}
                                  >
                                    Absent
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetStatus(entry.student_id, "late")}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                      isLate
                                        ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-semibold"
                                        : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                                    }`}
                                  >
                                    Late
                                  </button>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isAbsent && waLink && (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] text-[#18181B] dark:text-[#EDEDED] text-xs font-medium transition-colors"
                                    title="Send WhatsApp notice to parent"
                                  >
                                    <MessageCircle className="w-3 h-3 text-[#71717A] dark:text-[#A1A1AA]" />
                                    <span>Notify parent</span>
                                  </a>
                                )}

                                {isEditingThisNote ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      placeholder="Add note..."
                                      value={entry.note || ""}
                                      onChange={(e) => handleUpdateNote(entry.student_id, e.target.value)}
                                      className="w-36 px-2.5 py-1 text-xs rounded-lg bg-[#FBFBF9] dark:bg-[#141414] border border-black/[0.12] dark:border-white/[0.15] outline-none text-[#18181B] dark:text-[#EDEDED]"
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
                                      OK
                                    </button>
                                  </div>
                                ) : entry.note ? (
                                  <button
                                    type="button"
                                    onClick={() => setEditingNoteStudentId(entry.student_id)}
                                    className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] text-xs flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span className="italic truncate max-w-[180px]">&ldquo;{entry.note}&rdquo;</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setEditingNoteStudentId(entry.student_id)}
                                    className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] text-xs flex items-center gap-1 cursor-pointer"
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
                <span>Unsaved changes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={isSaving}
                  className="h-7 px-3 rounded-xl bg-transparent hover:bg-white/10 dark:hover:bg-black/10 text-white/80 dark:text-[#121212]/80 hover:text-white dark:hover:text-[#121212] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-7 px-3 rounded-xl bg-white dark:bg-[#18181B] text-[#18181B] dark:text-white text-xs font-semibold hover:bg-[#F4F4F0] dark:hover:bg-[#27272A] transition-colors cursor-pointer disabled:opacity-50"
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
