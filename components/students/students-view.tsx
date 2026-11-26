"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
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

  const [confirmDeleteStudent, setConfirmDeleteStudent] =
    useState<StudentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (initialBatchId) {
      setSelectedBatchId(initialBatchId);
    }
  }, [initialBatchId]);

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

  const handleToggleArchived = useCallback((archived: boolean) => {
    setShowArchived(archived);
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
      { totalMonthlyFee: number; waNumber: string; formattedJoinedDate: string }
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
      const formattedJoinedDate = formatDate(student.joined_date);

      map.set(student.id, { totalMonthlyFee, waNumber, formattedJoinedDate });
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
          className="bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl border border-black/[0.07] dark:border-white/[0.08] hover:border-black/[0.15] dark:hover:border-white/[0.16] transition-colors cursor-pointer group overflow-hidden flex flex-col justify-between"
        >
          <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <StudentAvatar name={student.full_name} size="md" />
              <div className="flex flex-col min-w-0">
                <span className="font-heading text-sm sm:text-base font-bold text-[#18181B] dark:text-[#EDEDED] group-hover:underline truncate capitalize">
                  {student.full_name}
                </span>
                <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">
                  {student.grade || "Student"}
                  {student.parent_name ? ` · ${student.parent_name}` : ""}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <span className="font-heading text-sm sm:text-base font-bold text-[#18181B] dark:text-[#EDEDED] tabular-nums">
                  ₹{totalMonthlyFee.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] block leading-none mt-0.5">
                  /mo
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => handleOpenMenu(e, student)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] transition-colors cursor-pointer shrink-0"
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-5 py-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between gap-2 text-xs">
            <span className="text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
              {formatPhoneNumber(student.parent_phone)}
            </span>

            {waNumber && (
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-[#FBFBF9] dark:bg-[#141414] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] text-[#18181B] dark:text-[#EDEDED] text-xs font-medium transition-colors shrink-0"
                title="Chat on WhatsApp"
              >
                <MessageCircle className="w-3 h-3 text-[#71717A] dark:text-[#A1A1AA]" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>

          <div className="px-4 sm:px-5 py-2.5 border-t border-black/[0.05] dark:border-white/[0.06] bg-[#FBFBF9] dark:bg-[#141414] flex items-center gap-1.5 flex-wrap">
            {student.enrollments && student.enrollments.length > 0 ? (
              student.enrollments.map((enr) => (
                <span
                  key={enr.batch_id}
                  className="inline-block px-2 py-0.5 rounded-md bg-[#FFFFFF] dark:bg-[#191919] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] border border-black/[0.06] dark:border-white/[0.08]"
                >
                  {enr.batch?.name || "Batch"}
                </span>
              ))
            ) : (
              <span className="text-[#71717A] dark:text-[#A1A1AA] text-xs">No batches</span>
            )}
          </div>
        </div>
      );
    },
    [router, studentMetaMap, handleOpenMenu]
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header and new student button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl text-[#18181B] dark:text-[#EDEDED] font-bold tracking-tight">
            Students
          </h1>
          <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs sm:text-sm pt-1 tabular-nums">
            {filteredStudents.length} of {students.length} students across active batches
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewModal}
          className="h-9 flex items-center gap-1.5 px-4 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs font-semibold transition-colors cursor-pointer active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
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

          <div className="flex items-center p-0.5 rounded-xl bg-[#FFFFFF] dark:bg-[#191919] border border-black/[0.08] dark:border-white/[0.1] h-9">
            <button
              type="button"
              onClick={() => handleToggleArchived(false)}
              className={`h-7 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                !showArchived
                  ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-semibold"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => handleToggleArchived(true)}
              className={`h-7 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                showArchived
                  ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-semibold"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
              }`}
            >
              Archived
            </button>
          </div>

          <div className="hidden lg:block">
            <ViewModeToggle view={viewMode} onChange={setViewMode} />
          </div>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-4 bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl border border-black/[0.07] dark:border-white/[0.08]">
          <div className="w-11 h-11 rounded-2xl bg-[#F4F4F0] dark:bg-[#242424] text-[#71717A] dark:text-[#A1A1AA] flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="max-w-md flex flex-col gap-1">
            <h3 className="text-base font-bold text-[#18181B] dark:text-[#EDEDED]">
              {students.length === 0
                ? "No students enrolled yet"
                : "No students matching your filter"}
            </h3>
            <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs sm:text-sm leading-relaxed">
              {students.length === 0
                ? "Add students with parent contact numbers to manage roll call and monthly fees."
                : "Try adjusting your search query or batch filter."}
            </p>
          </div>
          {students.length === 0 && (
            <button
              type="button"
              onClick={handleOpenNewModal}
              className="mt-1 h-9 px-4 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] text-xs font-semibold hover:bg-[#27272A] dark:hover:bg-white transition-colors cursor-pointer"
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
              <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.08] overflow-hidden bg-[#FFFFFF] dark:bg-[#191919]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FBFBF9] dark:bg-[#151515] border-b border-black/[0.06] dark:border-white/[0.07] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
                        <th className="py-3 px-5">Student</th>
                        <th className="py-3 px-4">Grade</th>
                        <th className="py-3 px-4">Parent &amp; Contact</th>
                        <th className="py-3 px-4">Enrolled Batches</th>
                        <th className="py-3 px-4 text-right">Monthly Fee</th>
                        <th className="py-3 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                      {filteredStudents.map((student) => {
                        const meta = studentMetaMap.get(student.id) || {
                          totalMonthlyFee: 0,
                          waNumber: "",
                          formattedJoinedDate: "",
                        };
                        const { totalMonthlyFee, waNumber, formattedJoinedDate } = meta;

                        return (
                          <tr
                            key={student.id}
                            onClick={() => router.push(`/students/${student.id}`)}
                            className="hover:bg-[#F9F9F7] dark:hover:bg-white/[0.025] transition-colors cursor-pointer group"
                          >
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <StudentAvatar name={student.full_name} size="sm" />
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-sm text-[#18181B] dark:text-[#EDEDED] group-hover:underline truncate capitalize">
                                    {student.full_name}
                                  </span>
                                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
                                    Joined {formattedJoinedDate}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                              {student.grade || "—"}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-medium text-[#18181B] dark:text-[#EDEDED] truncate">
                                    {student.parent_name || "Parent"}
                                  </span>
                                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
                                    {formatPhoneNumber(student.parent_phone)}
                                  </span>
                                </div>

                                {waNumber && (
                                  <a
                                    href={`https://wa.me/${waNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] transition-colors shrink-0"
                                    title="Chat on WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
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
                                      className="inline-block px-2 py-0.5 rounded-md bg-[#F4F4F0] dark:bg-[#242424] text-xs font-medium text-[#18181B] dark:text-[#EDEDED]"
                                    >
                                      {enr.batch?.name || "Batch"}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[#71717A] dark:text-[#A1A1AA] text-xs">
                                  No batches
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right font-semibold text-sm text-[#18181B] dark:text-[#EDEDED] tabular-nums">
                              ₹{totalMonthlyFee.toLocaleString("en-IN")}
                              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-normal ml-0.5">
                                /mo
                              </span>
                            </td>

                            <td className="py-3.5 px-5 text-right">
                              <button
                                type="button"
                                onClick={(e) => handleOpenMenu(e, student)}
                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/45 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl overflow-hidden border border-black/[0.08] dark:border-white/[0.1] shadow-2xl">
            <div className="p-6 flex flex-col gap-1.5">
              <h3 className="font-heading text-base font-bold text-[#18181B] dark:text-[#EDEDED]">
                Delete &ldquo;{confirmDeleteStudent.full_name}&rdquo;?
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                This will permanently remove attendance and fee history for this student.
              </p>
            </div>

            <div className="px-6 py-4 bg-[#FAFAF9] dark:bg-[#141414] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteStudent(null)}
                className="h-9 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                disabled={isDeleting}
                className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
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
              className="w-36 bg-[#FFFFFF] dark:bg-[#191919] rounded-xl border border-black/[0.08] dark:border-white/[0.12] p-1 z-50 flex flex-col shadow-xl"
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
