"use client";

import { useState, useCallback, FormEvent } from "react";
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
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col gap-5 sm:gap-6 max-h-[92vh] overflow-y-auto border border-black/[0.06] dark:border-white/[0.08]"
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
          <h2 className="font-heading text-xl text-[#18181B] dark:text-[#EDEDED] font-bold">
            {isEditing ? "Edit student" : "Add new student"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] text-sm font-semibold p-1.5 rounded-lg hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 p-4 rounded-xl text-sm font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-5">
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
              className="w-full bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] text-sm py-3 px-4 rounded-xl placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none focus:bg-white dark:focus:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.08]"
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
                className="w-full bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] text-sm py-2.5 px-3.5 rounded-xl placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none focus:bg-white dark:focus:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.08]"
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
                className="w-full bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] text-sm py-2.5 px-3.5 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.08]"
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
                className="w-full bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] text-sm py-2.5 px-3.5 rounded-xl placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none focus:bg-white dark:focus:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.08]"
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
                className="w-full bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] text-sm py-2.5 px-3.5 rounded-xl placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none focus:bg-white dark:focus:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.08]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
              Assign to batches
            </span>
            {availableBatches.length === 0 ? (
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                No batches created yet. You can create batches from the Batches page.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {availableBatches.map((batch) => {
                  const state = enrollmentsState[batch.id] || {
                    selected: false,
                    customFee: "",
                  };
                  return (
                    <div
                      key={batch.id}
                      className={`p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-colors ${
                        state.selected
                          ? "bg-[#F4F4F0] dark:bg-[#262626] border-black/[0.12] dark:border-white/[0.14]"
                          : "bg-white dark:bg-[#1C1C1C] border-black/[0.06] dark:border-white/[0.08]"
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={state.selected}
                          onChange={() => toggleBatch(batch.id)}
                          className="w-4 h-4 rounded text-slate-900 focus:ring-0 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED]">
                            {batch.name}
                          </span>
                          <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                            Default fee: ₹{batch.default_monthly_fee}/mo
                          </span>
                        </div>
                      </label>

                      {state.selected && (
                        <div className="flex items-center gap-2 pl-7 sm:pl-0">
                          <label className="text-xs text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap">
                            Custom fee:
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            placeholder={String(batch.default_monthly_fee)}
                            value={state.customFee}
                            onChange={(e) =>
                              handleCustomFeeChange(batch.id, e.target.value)
                            }
                            className="w-24 bg-white dark:bg-[#1C1C1C] text-[#18181B] dark:text-[#EDEDED] text-xs py-1.5 px-2.5 rounded-lg border border-black/[0.08] dark:border-white/[0.12] focus:outline-none"
                          />
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
              Teacher private notes (optional)
            </label>
            <textarea
              id="studentNotes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sibling scholarship, weak in geometry, prefers evening slots"
              className="w-full bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] text-sm py-2.5 px-3.5 rounded-xl placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none focus:bg-white dark:focus:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.08]"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
            {isEditing ? (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 px-3.5 rounded-xl transition-colors cursor-pointer"
                  >
                    {isDeleting ? "Deleting..." : "Confirm delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 sm:flex-initial text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] py-2 px-3 rounded-xl border border-black/[0.08] dark:border-white/[0.12] transition-colors cursor-pointer"
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
            ) : <div />}

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] py-2.5 px-4 rounded-xl border border-black/[0.08] dark:border-white/[0.12] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-initial bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs font-semibold py-2.5 px-5 rounded-xl transition-all cursor-pointer"
              >
                {isSaving ? "Saving..." : isEditing ? "Save changes" : "Create student"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
