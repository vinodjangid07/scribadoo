"use client";

import React, { useState, useEffect, useMemo, useCallback, ChangeEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudentItem, StudentModal } from "./student-modal";
import { BatchItem } from "@/types/dashboard";
import { useDashboard } from "@/context/dashboard-context";
import { formatPhoneNumber, formatDate } from "@/lib/utils";
import { deleteStudent } from "@/app/actions/students";
import { ViewModeToggle } from "@/components/shared/view-mode-toggle";
import { SearchBar } from "@/components/shared/search-bar";
import { BatchFilterDropdown } from "@/components/shared/batch-filter-dropdown";
import { StudentAvatar } from "@/components/shared/student-avatar";
import {
  Plus,
  UserPlus,
  ArrowRight,
  MoreVertical,
  Trash2,
  Edit,
  MessageCircle,
} from "lucide-react";

interface StudentsViewProps {
  initialStudents?: StudentItem[];
  initialBatches?: BatchItem[];
  initialBatchId?: string;
}

function cleanWhatsappPhone(phone?: string | null) {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length === 10 ? `91${cleaned}` : cleaned;
}

export function StudentsView({
  initialStudents = [],
  initialBatches = [],
  initialBatchId,
}: StudentsViewProps) {
  const router = useRouter();
  const {
    students: contextStudents,
    batches: contextBatches,
    isLoaded,
    removeStudentLocal,
    refreshData,
  } = useDashboard();
  const students = isLoaded ? contextStudents : initialStudents;
  const batches = isLoaded ? contextBatches : initialBatches;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    initialBatchId || "all"
  );
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [activeModal, setActiveModal] = useState<"new" | StudentItem | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [menuAnchor, setMenuAnchor] = useState<{
    student: StudentItem;
    top: number;
    left: number;
    openUpwards: boolean;
  } | null>(null);

  const handleOpenMenu = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, student: StudentItem) => {
      e.stopPropagation();
      if (menuAnchor?.student.id === student.id) {
        setMenuAnchor(null);
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const openUpwards = window.innerHeight - rect.bottom < 130;
      setMenuAnchor({
        student,
        top: openUpwards ? rect.top - 6 : rect.bottom + 6,
        left: rect.right - 144,
        openUpwards,
      });
    },
    [menuAnchor]
  );

  useEffect(() => {
    if (!menuAnchor) return;
    const handleClose = () => setMenuAnchor(null);
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [menuAnchor]);
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState<StudentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteStudent = useCallback(async () => {
    if (!confirmDeleteStudent) return;
    setIsDeleting(true);
    try {
      const res = await deleteStudent(confirmDeleteStudent.id);
      if (res.success) {
        removeStudentLocal(confirmDeleteStudent.id);
        await refreshData();
        setConfirmDeleteStudent(null);
      } else if (res.error) {
        alert(res.error);
      }
    } finally {
      setIsDeleting(false);
    }
  }, [confirmDeleteStudent, removeStudentLocal, refreshData]);

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleBatchSelect = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedBatchId(e.target.value);
  }, []);

  const handleToggleArchived = useCallback(() => {
    setShowArchived((prev) => !prev);
  }, []);

  const handleOpenNewModal = useCallback(() => {
    setActiveModal("new");
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const handleOpenEditModal = useCallback((student: StudentItem) => {
    setActiveModal(student);
  }, []);

  const studentMetaMap = useMemo(() => {
    const map = new Map<
      string,
      { totalMonthlyFee: number; waNumber: string; initials: string; formattedJoinedDate: string }
    >();
    for (const student of students) {
      const totalMonthlyFee = (student.enrollments || []).reduce((sum, enr) => {
        if (enr.custom_fee !== null && enr.custom_fee !== undefined) {
          return sum + Number(enr.custom_fee);
        }
        return sum + Number(enr.batch?.default_monthly_fee || 0);
      }, 0);

      const cleaned = (student.parent_phone || "").replace(/\D/g, "");
      const waNumber = cleaned.length === 10 ? `91${cleaned}` : cleaned;

      const initials = student.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

      const formattedJoinedDate = formatDate(student.joined_date);

      map.set(student.id, { totalMonthlyFee, waNumber, initials, formattedJoinedDate });
    }
    return map;
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return students.filter((student) => {
      if (!showArchived && student.is_archived) return false;
      if (showArchived && !student.is_archived) return false;

      if (selectedBatchId !== "all") {
        const isInBatch = (student.enrollments || []).some(
          (enr) => enr.batch_id === selectedBatchId
        );
        if (!isInBatch) return false;
      }

      if (!query) return true;

      const nameMatch = student.full_name.toLowerCase().includes(query);
      const gradeMatch = student.grade?.toLowerCase().includes(query);
      const parentMatch = student.parent_name?.toLowerCase().includes(query);
      const phoneMatch = student.parent_phone?.includes(query);

      return nameMatch || gradeMatch || parentMatch || phoneMatch;
    });
  }, [students, searchQuery, selectedBatchId, showArchived]);

  const renderStudentCard = useCallback(
    (student: StudentItem) => {
      const meta = studentMetaMap.get(student.id);
      const totalMonthlyFee = meta?.totalMonthlyFee || 0;
      const waNumber = meta?.waNumber || "";

      return (
        <div
          key={student.id}
          onClick={() => router.push(`/students/${student.id}`)}
          className="p-4 sm:p-5 flex flex-col justify-between gap-3.5 bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.14] dark:hover:border-white/[0.16] transition-colors cursor-pointer group"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <StudentAvatar name={student.full_name} size="md" />
                <div className="flex flex-col min-w-0">
                  <span className="font-heading text-sm sm:text-base font-bold text-[#18181B] dark:text-[#EDEDED] group-hover:underline truncate capitalize">
                    {student.full_name}
                  </span>
                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium truncate">
                    {student.grade || "Student"}
                    {student.parent_name ? ` · ${student.parent_name}` : ""}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-sm sm:text-base font-bold font-mono text-[#18181B] dark:text-[#EDEDED]">
                    ₹{totalMonthlyFee.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[11px] text-[#A1A1AA] dark:text-[#71717A] block font-normal leading-none mt-0.5">
                    /mo
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleOpenMenu(e, student)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] border border-transparent hover:border-black/[0.06] dark:border-white/[0.08] transition-colors cursor-pointer shrink-0"
                  title="Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA] pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-[#A1A1AA] dark:text-[#71717A] font-medium">Contact</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#18181B] dark:text-[#EDEDED]">
                    {formatPhoneNumber(student.parent_phone)}
                  </span>
                  {waNumber && (
                    <a
                      href={`https://wa.me/${waNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold transition-colors shrink-0"
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {student.enrollments && student.enrollments.length > 0 ? (
                student.enrollments.map((enr) => (
                  <span
                    key={enr.batch_id}
                    className="inline-block px-2.5 py-0.5 rounded-lg bg-[#F4F4F0] dark:bg-[#262626] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] border border-black/[0.04] dark:border-white/[0.06]"
                  >
                    {enr.batch?.name || "Batch"}
                  </span>
                ))
              ) : (
                <span className="text-[#A1A1AA] dark:text-[#71717A] text-xs">No batches</span>
              )}
            </div>
          </div>
        </div>
      );
    },
    [router, studentMetaMap, handleOpenMenu]
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header and new student button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl text-[#18181B] dark:text-[#EDEDED] font-bold tracking-tight">
            Students
          </h1>
          <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs sm:text-sm pt-0.5">
            {filteredStudents.length} of {students.length} students enrolled across all batches
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewModal}
          className="h-9 flex items-center gap-2 px-4 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs sm:text-sm font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add student</span>
        </button>
      </div>

      {/* Search and batch filter bar */}
      <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search students, parents, phones..."
          className="w-full lg:max-w-xs"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <BatchFilterDropdown
            batches={batches}
            selectedBatchId={selectedBatchId}
            onChange={setSelectedBatchId}
            allLabel="All batches"
          />

          <button
            type="button"
            onClick={handleToggleArchived}
            className={`h-9 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
              showArchived
                ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] border-transparent"
                : "bg-[#FFFFFF] dark:bg-[#1C1C1C] text-[#71717A] dark:text-[#A1A1AA] border-black/[0.08] dark:border-white/[0.12] hover:bg-[#F4F4F0] dark:hover:bg-[#262626]"
            }`}
          >
            {showArchived ? "Viewing archived" : "Active only"}
          </button>

          <div className="hidden lg:block">
            <ViewModeToggle
              view={viewMode}
              onChange={setViewMode}
            />
          </div>
        </div>
      </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-4 bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
            <div className="w-12 h-12 rounded-2xl bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>
            <div className="max-w-md flex flex-col gap-1">
              <h3 className="text-base font-bold text-[#18181B] dark:text-[#EDEDED]">
                {students.length === 0
                  ? "No students enrolled yet"
                  : "No students matching your filter"}
              </h3>
              <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs sm:text-sm leading-relaxed">
                {students.length === 0
                  ? "Add students with parent phone numbers so you can mark roll call in under 10 seconds."
                  : "Try adjusting your search query or batch filter."}
              </p>
            </div>
            {students.length === 0 && (
              <button
                type="button"
                onClick={handleOpenNewModal}
                className="mt-2 px-4 py-2 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] text-xs sm:text-sm font-medium hover:bg-[#27272A] dark:hover:bg-white transition-colors cursor-pointer"
              >
                Add your first student
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Student cards (mobile) */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredStudents.map(renderStudentCard)}
            </div>

            {/* Student roster table (desktop) */}
            <div className="hidden lg:block">
              {viewMode === "table" ? (
                <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden bg-[#FFFFFF] dark:bg-[#1C1C1C]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F4F0]/60 dark:bg-[#262626]/60 border-b border-black/[0.06] dark:border-white/[0.08]">
                    <th className="py-3 px-4 text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA]">Student</th>
                    <th className="py-3 px-4 text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA]">Grade</th>
                    <th className="py-3 px-4 text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA]">Parent & Contact</th>
                    <th className="py-3 px-4 text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA]">Enrolled Batches</th>
                    <th className="py-3 px-4 text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA]">Monthly Fee</th>
                    <th className="py-3 px-4 text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  {filteredStudents.map((student, index) => {
                    const meta = studentMetaMap.get(student.id) || {
                      totalMonthlyFee: 0,
                      waNumber: "",
                      initials: "ST",
                      formattedJoinedDate: "",
                    };
                    const { totalMonthlyFee, waNumber, initials, formattedJoinedDate } = meta;
                    

                    return (
                      <tr
                        key={student.id}
                        onClick={() => router.push(`/students/${student.id}`)}
                        className="hover:bg-[#F4F4F0]/60 dark:hover:bg-[#262626]/60 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <StudentAvatar name={student.full_name} size="sm" />
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-sm text-[#18181B] dark:text-[#EDEDED] group-hover:underline truncate capitalize">
                                {student.full_name}
                              </span>
                              <span className="text-xs text-[#A1A1AA] dark:text-[#71717A]">
                                Joined {formattedJoinedDate}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {student.grade ? (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-[#F4F4F0] dark:bg-[#262626] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
                              {student.grade}
                            </span>
                          ) : (
                            <span className="text-[#A1A1AA] dark:text-[#71717A] text-xs">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-medium text-[#18181B] dark:text-[#EDEDED] truncate">
                                {student.parent_name || "Parent"}
                              </span>
                              <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                                {formatPhoneNumber(student.parent_phone)}
                              </span>
                            </div>

                            {waNumber && (
                              <a
                                href={`https://wa.me/${waNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded-md text-[#25D366] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors shrink-0"
                                title="Chat on WhatsApp"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                </svg>
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {student.enrollments && student.enrollments.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {student.enrollments.map((enr) => (
                                <span
                                  key={enr.batch_id}
                                  className="inline-block px-2.5 py-1 rounded-lg bg-[#F4F4F0] dark:bg-[#262626] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] border border-black/[0.04] dark:border-white/[0.06]"
                                >
                                  {enr.batch?.name || "Batch"}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#A1A1AA] dark:text-[#71717A] text-xs">No batches</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-sm text-[#18181B] dark:text-[#EDEDED] font-mono">
                          ₹{totalMonthlyFee.toLocaleString("en-IN")}
                          <span className="text-xs text-[#A1A1AA] dark:text-[#71717A] font-normal font-sans ml-0.5">
                            /mo
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => handleOpenMenu(e, student)}
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] border border-transparent hover:border-black/[0.06] dark:border-white/[0.08] transition-colors cursor-pointer"
                            title="Options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
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
            {filteredStudents.map(renderStudentCard)}
          </div>
        )}
      </div>
          </>
        )}

      {confirmDeleteStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl p-6 flex flex-col gap-4 border border-black/[0.08] dark:border-white/[0.12]">
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-base font-bold text-[#18181B] dark:text-[#EDEDED]">
                Delete student &ldquo;{confirmDeleteStudent.full_name}&rdquo;?
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                Permanently remove attendance and fee history for this student.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setConfirmDeleteStudent(null)}
                className="h-9 px-3 rounded-xl border border-black/[0.08] dark:border-white/[0.12] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                disabled={isDeleting}
                className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal && (
        <StudentModal
          isOpen={true}
          student={activeModal === "new" ? null : activeModal}
          availableBatches={batches}
          onClose={handleCloseModal}
        />
      )}
      {mounted &&
        menuAnchor &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-50 bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                setMenuAnchor(null);
              }}
            />
            <div
              style={{
                position: "fixed",
                top: menuAnchor.openUpwards ? undefined : `${menuAnchor.top}px`,
                bottom: menuAnchor.openUpwards
                  ? `${window.innerHeight - menuAnchor.top}px`
                  : undefined,
                left: `${Math.max(12, menuAnchor.left)}px`,
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-36 bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-xl border border-black/[0.08] dark:border-white/[0.12] p-1 z-50 flex flex-col"
            >
              <button
                type="button"
                onClick={() => {
                  const s = menuAnchor.student;
                  setMenuAnchor(null);
                  handleOpenEditModal(s);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#18181B] dark:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer text-left"
              >
                <Edit className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                <span>Edit student</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = menuAnchor.student;
                  setMenuAnchor(null);
                  setConfirmDeleteStudent(s);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete student</span>
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
