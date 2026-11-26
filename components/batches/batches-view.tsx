"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { BatchItem, BatchModal } from "./batch-modal";
import { useDashboard } from "@/context/dashboard-context";
import { formatTime12 } from "@/lib/utils";
import { Plus, BookOpen, MoreVertical, Trash2, Edit, ArrowRight } from "lucide-react";
import { deleteBatch } from "@/app/actions/batches";

interface BatchesViewProps {
  initialBatches?: BatchItem[];
}

export function BatchesView({ initialBatches = [] }: BatchesViewProps) {
  const { batches: contextBatches, isLoaded, removeBatchLocal, refreshData } = useDashboard();
  const batches = isLoaded ? contextBatches : initialBatches;

  const [activeModal, setActiveModal] = useState<"new" | BatchItem | null>(null);
  const [menuBatchId, setMenuBatchId] = useState<string | null>(null);
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState<BatchItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenNew = useCallback(() => {
    setActiveModal("new");
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const handleOpenEdit = useCallback((batch: BatchItem) => {
    setActiveModal(batch);
  }, []);

  const handleDeleteBatch = useCallback(async () => {
    if (!confirmDeleteBatch) return;
    setIsDeleting(true);
    try {
      const res = await deleteBatch(confirmDeleteBatch.id);
      if (res.success) {
        removeBatchLocal(confirmDeleteBatch.id);
        await refreshData();
        setConfirmDeleteBatch(null);
      } else if (res.error) {
        alert(res.error);
      }
    } finally {
      setIsDeleting(false);
    }
  }, [confirmDeleteBatch, removeBatchLocal, refreshData]);

  const stats = useMemo(() => {
    const totalBatches = batches.length;
    const totalStudents = batches.reduce(
      (sum, b) => sum + (b.student_count || 0),
      0
    );
    const estimatedMonthly = batches.reduce(
      (sum, b) => sum + (b.student_count || 0) * (b.default_monthly_fee || 0),
      0
    );
    return { totalBatches, totalStudents, estimatedMonthly };
  }, [batches]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header and add batch button */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl text-[#18181B] dark:text-[#EDEDED] font-bold tracking-tight">
            Batches
          </h1>
          <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs sm:text-sm pt-1">
            Organize class timings, weekly schedules, and default monthly fees.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="h-9 flex items-center gap-1.5 px-3.5 sm:px-4 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs font-semibold transition-colors cursor-pointer shrink-0 active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add batch</span>
        </button>
      </div>

      {/* Unified hairline summary strip */}
      <section className="bg-[#FFFFFF] dark:bg-[#191919] border border-black/[0.07] dark:border-white/[0.08] rounded-2xl grid grid-cols-3 divide-x divide-black/[0.06] dark:divide-white/[0.07]">
        <div className="px-4 sm:px-5 py-4">
          <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Active Batches
          </div>
          <div className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] dark:text-[#EDEDED] mt-1 tabular-nums">
            {stats.totalBatches}
          </div>
          <div className="hidden sm:block text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Scheduled tuition groups
          </div>
        </div>

        <div className="px-4 sm:px-5 py-4">
          <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Total Enrolled
          </div>
          <div className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] dark:text-[#EDEDED] mt-1 tabular-nums">
            {stats.totalStudents}
          </div>
          <div className="hidden sm:block text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Student seats assigned
          </div>
        </div>

        <div className="px-4 sm:px-5 py-4">
          <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Monthly Potential
          </div>
          <div className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] dark:text-[#EDEDED] mt-1 tabular-nums truncate">
            ₹{stats.estimatedMonthly.toLocaleString("en-IN")}
          </div>
          <div className="hidden sm:block text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Projected monthly billing
          </div>
        </div>
      </section>

      {/* Batches grid */}
      <div className="w-full flex flex-col gap-4">
        {batches.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-4 bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl border border-black/[0.07] dark:border-white/[0.08]">
            <div className="w-11 h-11 rounded-2xl bg-[#F4F4F0] dark:bg-[#242424] text-[#71717A] dark:text-[#A1A1AA] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="max-w-md flex flex-col gap-1">
              <h3 className="text-base font-bold text-[#18181B] dark:text-[#EDEDED]">
                Organize your classes
              </h3>
              <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs sm:text-sm leading-relaxed">
                Create batches for each class with weekly schedules and default monthly fees.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenNew}
              className="mt-1 h-9 px-4 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] text-xs font-semibold hover:bg-[#27272A] dark:hover:bg-white transition-colors cursor-pointer"
            >
              Create your first batch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {batches.map((batch) => {
              const daysText =
                batch.days && batch.days.length > 0
                  ? batch.days.join(", ")
                  : "Flexible days";

              const timeText =
                batch.start_time && batch.end_time
                  ? `${formatTime12(batch.start_time)} – ${formatTime12(batch.end_time)}`
                  : batch.start_time
                  ? `Starts ${formatTime12(batch.start_time)}`
                  : "Flexible timing";

              return (
                <article
                  key={batch.id}
                  className="flex flex-col justify-between bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl border border-black/[0.07] dark:border-white/[0.08] hover:border-black/[0.14] dark:hover:border-white/[0.15] transition-colors"
                >
                  <div className="p-5 flex items-start justify-between gap-3">
                    <div className="flex flex-col min-w-0">
                      <h2 className="font-heading text-base font-bold text-[#18181B] dark:text-[#EDEDED] truncate">
                        {batch.name}
                      </h2>
                      <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] pt-0.5 truncate">
                        {batch.subject || "General batch"}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-heading text-base font-bold text-[#18181B] dark:text-[#EDEDED] tabular-nums">
                        ₹{Number(batch.default_monthly_fee).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] block">
                        /month
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06] border-t border-black/[0.06] dark:border-white/[0.07] text-xs">
                    <div className="px-5 py-2.5 flex items-center justify-between gap-4">
                      <span className="text-[#71717A] dark:text-[#A1A1AA]">Schedule</span>
                      <span className="font-medium text-[#18181B] dark:text-[#EDEDED] text-right truncate">
                        {daysText}
                      </span>
                    </div>
                    <div className="px-5 py-2.5 flex items-center justify-between gap-4">
                      <span className="text-[#71717A] dark:text-[#A1A1AA]">Timing</span>
                      <span className="font-medium text-[#18181B] dark:text-[#EDEDED] tabular-nums text-right">
                        {timeText}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 py-3.5 border-t border-black/[0.06] dark:border-white/[0.07] bg-[#FBFBF9] dark:bg-[#151515] rounded-b-2xl flex items-center justify-between gap-2 text-xs">
                    <Link
                      href={`/students?batchId=${batch.id}`}
                      className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors tabular-nums"
                    >
                      {batch.student_count || 0}{" "}
                      {batch.student_count === 1 ? "student" : "students"}
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/attendance?batchId=${batch.id}`}
                        className="h-8 px-3 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] hover:bg-[#18181B] hover:text-white dark:hover:bg-[#EDEDED] dark:hover:text-[#121212] text-[#18181B] dark:text-[#EDEDED] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Roll call</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuBatchId(menuBatchId === batch.id ? null : batch.id);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] transition-colors cursor-pointer"
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {menuBatchId === batch.id && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setMenuBatchId(null)}
                            />
                            <div className="absolute right-0 bottom-full mb-1.5 w-36 bg-[#FFFFFF] dark:bg-[#191919] rounded-xl border border-black/[0.08] dark:border-white/[0.12] p-1 z-40 flex flex-col shadow-xl">
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuBatchId(null);
                                  handleOpenEdit(batch);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#18181B] dark:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer text-left"
                              >
                                <Edit className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                                <span>Edit batch</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuBatchId(null);
                                  setConfirmDeleteBatch(batch);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer text-left"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete batch</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {confirmDeleteBatch && (
        <div className="fixed inset-0 z-50 bg-black/45 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl overflow-hidden border border-black/[0.08] dark:border-white/[0.1] shadow-2xl">
            <div className="p-6 flex flex-col gap-1.5">
              <h3 className="font-heading text-base font-bold text-[#18181B] dark:text-[#EDEDED]">
                Delete &ldquo;{confirmDeleteBatch.name}&rdquo;?
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                This will remove the batch schedule. Enrolled students remain in your roster and can be reassigned anytime.
              </p>
            </div>

            <div className="px-6 py-4 bg-[#FAFAF9] dark:bg-[#141414] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteBatch(null)}
                className="h-9 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBatch}
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
        <BatchModal
          isOpen={true}
          batch={activeModal === "new" ? null : activeModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
