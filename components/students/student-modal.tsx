"use client";

import { useState, useCallback, FormEvent } from "react";
import { X } from "lucide-react";
import {
  BatchEnrollmentInput,
  StudentPayload,
  createStudent,
  updateStudent,
  deleteStudent,
} from "@/app/actions/students";
import { useDashboard } from "@/context/dashboard-context";
import { useModalClose } from "@/hooks/use-modal-close";
import type { BatchItem, StudentItem } from "@/types/dashboard";

export type { StudentItem };

interface StudentModalProps {
  student?: StudentItem | null;
  availableBatches: BatchItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function StudentModal({
  student,
  availableBatches,
  isOpen,
  onClose,
}: StudentModalProps) {
  const modalRef = useModalClose({ isOpen, onClose });
  const isEditing = Boolean(student);
  const { removeStudentLocal, refreshData } = useDashboard();

  const [fullName, setFullName] = useState(student?.full_name || "");
  const [grade, setGrade] = useState(student?.grade || "");
  const [parentName, setParentName] = useState(student?.parent_name || "");
  const [parentPhone, setParentPhone] = useState(student?.parent_phone || "");
  const [joinedDate, setJoinedDate] = useState(
    student?.joined_date || new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(student?.notes || "");

  const [enrollmentsState, setEnrollmentsState] = useState<
    Record<string, { selected: boolean; customFee: string }>
  >(() => {
    const state: Record<string, { selected: boolean; customFee: string }> = {};
    availableBatches.forEach((batch) => {
      const existing = student?.enrollments?.find(
        (e) => e.batch_id === batch.id
      );
      state[batch.id] = {
        selected: Boolean(existing),
        customFee:
          existing?.custom_fee !== null && existing?.custom_fee !== undefined
            ? String(existing.custom_fee)
            : "",
      };
    });
    return state;
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleBatch = useCallback((batchId: string) => {
    setEnrollmentsState((prev) => ({
      ...prev,
      [batchId]: {
        ...prev[batchId],
        selected: !prev[batchId]?.selected,
      },
    }));
  }, []);

  const handleCustomFeeChange = useCallback((batchId: string, val: string) => {
    setEnrollmentsState((prev) => ({
      ...prev,
      [batchId]: {
        ...prev[batchId],
        customFee: val,
      },
    }));
  }, []);

  const handleSave = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);

      if (!fullName.trim()) {
        setErrorMessage("Please enter the student's name.");
        return;
      }

      if (!parentPhone.trim()) {
        setErrorMessage("Please enter a parent phone number for attendance and fee reminders.");
        return;
      }

      setIsSaving(true);

      const enrollments: BatchEnrollmentInput[] = [];
      for (const [batchId, state] of Object.entries(enrollmentsState)) {
        if (state.selected) {
          const customFeeNum = state.customFee.trim()
            ? parseFloat(state.customFee)
            : null;
          enrollments.push({
            batchId,
            customFee: customFeeNum !== null && !isNaN(customFeeNum) ? customFeeNum : null,
          });
        }
      }

      const payload: StudentPayload = {
        fullName: fullName.trim(),
        grade: grade.trim() || undefined,
        parentName: parentName.trim() || undefined,
        parentPhone: parentPhone.trim(),
        joinedDate: joinedDate || undefined,
        notes: notes.trim() || undefined,
        enrollments,
      };

      if (isEditing && student) {
        const res = await updateStudent(student.id, payload);
        setIsSaving(false);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          await refreshData();
          onClose();
        }
      } else {
        const res = await createStudent(payload);
        setIsSaving(false);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          await refreshData();
          onClose();
        }
      }
    },
    [
      fullName,
      parentPhone,
      enrollmentsState,
      grade,
      parentName,
      joinedDate,
      notes,
      isEditing,
      student,
      refreshData,
      onClose,
    ]
  );

  const handleDelete = useCallback(async () => {
    if (!student) return;
    setIsDeleting(true);
    const res = await deleteStudent(student.id);
    setIsDeleting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      removeStudentLocal(student.id);
      await refreshData();
      onClose();
    }
  }, [student, removeStudentLocal, refreshData, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/45 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg text-[#18181B] dark:text-[#EDEDED] font-bold tracking-tight">
              {isEditing ? "Edit student" : "Add student"}
            </h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Manage contact details, batch enrollments, and custom rates.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="overflow-y-auto flex flex-col">
          <div className="p-6 flex flex-col gap-5">
            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 px-3.5 py-2.5 rounded-xl text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="studentName" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Student full name
              </label>
              <input
                id="studentName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aryan Patel"
                className="w-full h-10 bg-[#FBFBF9] dark:bg-[#141414] text-[#18181B] dark:text-[#EDEDED] text-sm px-3.5 rounded-xl placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none border border-black/[0.08] dark:border-white/[0.1] focus:border-black/[0.25] dark:focus:border-white/[0.25] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="studentGrade" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                  Class / Grade
                </label>
                <input
                  id="studentGrade"
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g. Class 10"
                  className="w-full h-10 bg-[#FBFBF9] dark:bg-[#141414] text-[#18181B] dark:text-[#EDEDED] text-sm px-3.5 rounded-xl placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none border border-black/[0.08] dark:border-white/[0.1] focus:border-black/[0.25] dark:focus:border-white/[0.25] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="joinedDate" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                  Enrollment date
                </label>
                <input
                  id="joinedDate"
                  type="date"
                  required
                  value={joinedDate}
                  onChange={(e) => setJoinedDate(e.target.value)}
                  className="w-full h-10 bg-[#FBFBF9] dark:bg-[#141414] text-[#18181B] dark:text-[#EDEDED] text-sm px-3.5 rounded-xl focus:outline-none border border-black/[0.08] dark:border-white/[0.1] focus:border-black/[0.25] dark:focus:border-white/[0.25] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="parentName" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                  Parent name
                </label>
                <input
                  id="parentName"
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g. Sanjay Patel"
                  className="w-full h-10 bg-[#FBFBF9] dark:bg-[#141414] text-[#18181B] dark:text-[#EDEDED] text-sm px-3.5 rounded-xl placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none border border-black/[0.08] dark:border-white/[0.1] focus:border-black/[0.25] dark:focus:border-white/[0.25] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="parentPhone" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                  Parent WhatsApp number
                </label>
                <input
                  id="parentPhone"
                  type="tel"
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full h-10 bg-[#FBFBF9] dark:bg-[#141414] text-[#18181B] dark:text-[#EDEDED] text-sm px-3.5 rounded-xl placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none border border-black/[0.08] dark:border-white/[0.1] focus:border-black/[0.25] dark:focus:border-white/[0.25] transition-colors tabular-nums"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Batch enrollments
              </span>
              {availableBatches.length === 0 ? (
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  No batches created yet. Create a batch first from the Batches page.
                </p>
              ) : (
                <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] divide-y divide-black/[0.06] dark:divide-white/[0.07] overflow-hidden bg-[#FBFBF9] dark:bg-[#141414]">
                  {availableBatches.map((batch) => {
                    const state = enrollmentsState[batch.id] || {
                      selected: false,
                      customFee: "",
                    };
                    return (
                      <div
                        key={batch.id}
                        className={`px-3.5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                          state.selected ? "bg-[#FFFFFF] dark:bg-[#191919]" : ""
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer select-none min-w-0">
                          <input
                            type="checkbox"
                            checked={state.selected}
                            onChange={() => toggleBatch(batch.id)}
                            className="w-4 h-4 rounded accent-[#18181B] dark:accent-[#EDEDED] cursor-pointer shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-[#18181B] dark:text-[#EDEDED] truncate">
                              {batch.name}
                            </span>
                            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
                              Standard ₹{batch.default_monthly_fee}/mo
                            </span>
                          </div>
                        </label>

                        {state.selected && (
                          <div className="flex items-center gap-2 pl-7 sm:pl-0 shrink-0">
                            <label className="text-xs text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap">
                              Custom fee
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#71717A]">
                                ₹
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="50"
                                placeholder={String(batch.default_monthly_fee)}
                                value={state.customFee}
                                onChange={(e) =>
                                  handleCustomFeeChange(batch.id, e.target.value)
                                }
                                className="w-24 h-8 bg-[#FBFBF9] dark:bg-[#141414] text-[#18181B] dark:text-[#EDEDED] text-xs font-medium tabular-nums pl-6 pr-2.5 rounded-lg border border-black/[0.08] dark:border-white/[0.12] focus:outline-none focus:border-black/[0.25] dark:focus:border-white/[0.25]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="studentNotes" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Teacher notes <span className="font-normal text-[#71717A] dark:text-[#A1A1AA]">(optional)</span>
              </label>
              <textarea
                id="studentNotes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Sibling discount applied, prefers evening slot"
                className="w-full bg-[#FBFBF9] dark:bg-[#141414] text-[#18181B] dark:text-[#EDEDED] text-sm py-2.5 px-3.5 rounded-xl placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none border border-black/[0.08] dark:border-white/[0.1] focus:border-black/[0.25] dark:focus:border-white/[0.25] resize-none transition-colors"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-[#FAFAF9] dark:bg-[#141414] border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
            {isEditing ? (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 sm:flex-initial h-9 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 rounded-xl transition-colors cursor-pointer"
                  >
                    {isDeleting ? "Deleting..." : "Confirm delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 sm:flex-initial h-9 text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] px-3 rounded-xl border border-black/[0.08] dark:border-white/[0.12] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  Delete student
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial h-9 text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] px-4 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-initial h-9 bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs font-semibold px-5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving..." : isEditing ? "Save changes" : "Add student"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
