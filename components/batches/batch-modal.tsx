"use client";

import { useState, useCallback, FormEvent } from "react";
import { X } from "lucide-react";
import { BatchPayload, createBatch, updateBatch, deleteBatch } from "@/app/actions/batches";
import { useDashboard } from "@/context/dashboard-context";
import { useModalClose } from "@/hooks/use-modal-close";
import type { BatchItem } from "@/types/dashboard";

export type { BatchItem };

const WEEKDAYS = [
  { id: "Mon", label: "Mon" },
  { id: "Tue", label: "Tue" },
  { id: "Wed", label: "Wed" },
  { id: "Thu", label: "Thu" },
  { id: "Fri", label: "Fri" },
  { id: "Sat", label: "Sat" },
  { id: "Sun", label: "Sun" },
];

interface BatchModalProps {
  batch?: BatchItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BatchModal({ batch, isOpen, onClose }: BatchModalProps) {
  const modalRef = useModalClose({ isOpen, onClose });
  const isEditing = Boolean(batch);
  const { updateBatchLocal, removeBatchLocal } = useDashboard();

  const [name, setName] = useState(batch?.name || "");
  const [subject, setSubject] = useState(batch?.subject || "");
  const [selectedDays, setSelectedDays] = useState<string[]>(batch?.days || []);
  const [startTime, setStartTime] = useState(batch?.start_time || "");
  const [endTime, setEndTime] = useState(batch?.end_time || "");
  const [fee, setFee] = useState(batch ? String(batch.default_monthly_fee) : "1500");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleDay = useCallback((dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  }, []);

  const handleSave = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);

      if (!name.trim()) {
        setErrorMessage("Please enter a batch name.");
        return;
      }

      const feeNum = parseFloat(fee);
      if (isNaN(feeNum) || feeNum < 0) {
        setErrorMessage("Please enter a valid monthly fee.");
        return;
      }

      setIsSaving(true);

      const payload: BatchPayload = {
        name: name.trim(),
        subject: subject.trim() || undefined,
        days: selectedDays,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        defaultMonthlyFee: feeNum,
      };

      if (isEditing && batch) {
        const res = await updateBatch(batch.id, payload);
        setIsSaving(false);
        if (res.error) {
          setErrorMessage(res.error);
        } else if (res.data) {
          updateBatchLocal(res.data);
          onClose();
        }
      } else {
        const res = await createBatch(payload);
        setIsSaving(false);
        if (res.error) {
          setErrorMessage(res.error);
        } else if (res.data) {
          updateBatchLocal(res.data);
          onClose();
        }
      }
    },
    [name, subject, selectedDays, startTime, endTime, fee, isEditing, batch, updateBatchLocal, onClose]
  );

  const handleDelete = useCallback(async () => {
    if (!batch) return;
    setIsDeleting(true);
    const res = await deleteBatch(batch.id);
    setIsDeleting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      removeBatchLocal(batch.id);
      onClose();
    }
  }, [batch, removeBatchLocal, onClose]);

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
              {isEditing ? "Edit batch" : "New batch"}
            </h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Set the schedule, timing, and default monthly tuition fee.
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
              <label htmlFor="batchName" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Batch name
              </label>
              <input
                id="batchName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Class 10 Mathematics"
                className="w-full h-10 bg-[#FBFBF9] dark:bg-[#141414] text-[#18181B] dark:text-[#EDEDED] text-sm px-3.5 rounded-xl placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none border border-black/[0.08] dark:border-white/[0.1] focus:border-black/[0.25] dark:focus:border-white/[0.25] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="batchSubject" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Subject or focus <span className="font-normal text-[#71717A] dark:text-[#A1A1AA]">(optional)</span>
              </label>
              <input
                id="batchSubject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Algebra & Geometry"
                className="w-full h-10 bg-[#FBFBF9] dark:bg-[#141414] text-[#18181B] dark:text-[#EDEDED] text-sm px-3.5 rounded-xl placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none border border-black/[0.08] dark:border-white/[0.1] focus:border-black/[0.25] dark:focus:border-white/[0.25] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">Schedule days</span>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS.map((day) => {
                  const isSelected = selectedDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`h-9 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] border-transparent"
                          : "bg-[#FBFBF9] dark:bg-[#141414] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] border-black/[0.08] dark:border-white/[0.08]"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="startTime" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                  Start time
                </label>
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-10 bg-[#FBFBF9] dark:bg-[#141414] text-[#18181B] dark:text-[#EDEDED] text-sm px-3.5 rounded-xl focus:outline-none border border-black/[0.08] dark:border-white/[0.1] focus:border-black/[0.25] dark:focus:border-white/[0.25] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="endTime" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                  End time
                </label>
                <input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full h-10 bg-[#FBFBF9] dark:bg-[#141414] text-[#18181B] dark:text-[#EDEDED] text-sm px-3.5 rounded-xl focus:outline-none border border-black/[0.08] dark:border-white/[0.1] focus:border-black/[0.25] dark:focus:border-white/[0.25] transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="batchFee" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Default monthly fee
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#71717A] dark:text-[#A1A1AA]">
                  ₹
                </span>
                <input
                  id="batchFee"
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="1500"
                  className="w-full h-10 bg-[#FBFBF9] dark:bg-[#141414] text-[#18181B] dark:text-[#EDEDED] text-sm font-semibold tabular-nums pl-8 pr-4 rounded-xl focus:outline-none border border-black/[0.08] dark:border-white/[0.1] focus:border-black/[0.25] dark:focus:border-white/[0.25] transition-colors"
                />
              </div>
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Sibling or scholarship discounts can be customized per student.
              </span>
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
                  Delete batch
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
                {isSaving ? "Saving..." : isEditing ? "Save changes" : "Create batch"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
