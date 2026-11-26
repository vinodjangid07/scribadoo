"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { BatchItem, BatchModal } from "./batch-modal";
import { useDashboard } from "@/context/dashboard-context";
import { useUser } from "@/context/user-context";
import { formatTime12 } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { Plus, Users, Calendar, Clock, BookOpen, MoreVertical, Trash2, Edit, CheckSquare } from "lucide-react";
import { deleteBatch } from "@/app/actions/batches";

interface BatchesViewProps {
  initialBatches?: BatchItem[];
}

export function BatchesView({ initialBatches = [] }: BatchesViewProps) {
  const { batches: contextBatches, isLoaded, removeBatchLocal, refreshData } = useDashboard();
  const { profile, user } = useUser();
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
    <div className="w-full flex flex-col gap-5 sm:gap-6">
      {/* Header and add batch button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl sm:text-2xl text-[#18181B] dark:text-[#EDEDED] font-bold tracking-tight">
              Batches
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] font-mono font-medium">
              {stats.totalBatches} {stats.totalBatches === 1 ? "batch" : "batches"}
            </span>
          </div>
          <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs sm:text-sm pt-0.5">
            {stats.totalStudents} enrolled students • ₹{stats.estimatedMonthly.toLocaleString("en-IN")} projected monthly
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="h-9 flex items-center gap-1.5 px-3 sm:px-4 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-[#FAFAFA] dark:text-[#121212] text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add batch</span>
        </button>
      </div>

      {/* Summary metrics */}
      <div className="sm:hidden bg-white dark:bg-[#1C1C1C] border border-[#E4E4E7] dark:border-[#262626] rounded-2xl p-3 grid grid-cols-3 divide-x divide-[#E4E4E7] dark:divide-[#262626]">
        <div className="pr-2">
          <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Active
          </div>
          <div className="text-base font-bold font-mono text-[#18181B] dark:text-[#EDEDED] mt-0.5 truncate">
            {stats.totalBatches}
          </div>
        </div>

        <div className="px-2">
          <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Enrolled
          </div>
          <div className="text-base font-bold font-mono text-[#18181B] dark:text-[#EDEDED] mt-0.5 truncate">
            {stats.totalStudents}
          </div>
        </div>

        <div className="pl-2">
          <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Monthly
          </div>
          <div className="text-base font-bold font-mono text-[#18181B] dark:text-[#EDEDED] mt-0.5 truncate">
            ₹{stats.estimatedMonthly.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <div className="hidden sm:grid sm:grid-cols-3 gap-4">
        <StatCard
          label="Active batches"
          value={stats.totalBatches}
          subtitle="Scheduled tuition groups"
        />
        <StatCard
          label="Total enrolled"
          value={stats.totalStudents}
          subtitle="Student seats assigned"
        />
        <StatCard
          label="Monthly potential"
          value={`₹${stats.estimatedMonthly.toLocaleString("en-IN")}`}
          subtitle="Projected batch billings"
        />
      </div>

      {/* Batches grid */}
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base sm:text-lg font-bold text-[#18181B] dark:text-[#EDEDED]">
            Your Batches
          </h2>
          <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">
            {batches.length} {batches.length === 1 ? "group" : "groups"}
          </span>
        </div>

        {batches.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-4 bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
            <div className="w-12 h-12 rounded-2xl bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="max-w-md flex flex-col gap-1">
              <h3 className="text-base font-bold text-[#18181B] dark:text-[#EDEDED]">Organize your classes</h3>
              <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs sm:text-sm leading-relaxed">
                Create batches for each class with schedules and default monthly fees.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenNew}
              className="mt-2 px-4 py-2 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] text-[#FAFAFA] dark:text-[#121212] text-xs sm:text-sm font-medium hover:bg-[#27272A] dark:hover:bg-white transition-colors cursor-pointer"
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
                  : "No schedule";

              const timeText =
                batch.start_time && batch.end_time
                  ? `${formatTime12(batch.start_time)} – ${formatTime12(batch.end_time)}`
                  : batch.start_time
                  ? `From ${formatTime12(batch.start_time)}`
                  : "Flexible timing";

              return (
                <div
                  key={batch.id}
                  className="p-4 sm:p-5 flex flex-col justify-between gap-4 sm:gap-5 bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.14] transition-colors"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col min-w-0">
                        <h3 className="text-base font-bold text-[#18181B] dark:text-[#EDEDED] truncate">
                          {batch.name}
                        </h3>
                        {batch.subject && (
                          <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium pt-0.5">
                            {batch.subject}
                          </span>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-bold font-mono text-[#18181B] dark:text-[#EDEDED]">
                          ₹{Number(batch.default_monthly_fee).toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-[#A1A1AA] dark:text-[#71717A] block font-normal">
                          /student/mo
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-xs text-[#71717A] dark:text-[#A1A1AA] pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#A1A1AA] dark:text-[#71717A] font-medium flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Schedule
                        </span>
                        <span className="font-medium text-[#18181B] dark:text-[#EDEDED]">{daysText}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#A1A1AA] dark:text-[#71717A] font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Timing
                        </span>
                        <span className="font-medium text-[#18181B] dark:text-[#EDEDED]">{timeText}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-black/[0.04] dark:border-white/[0.06] text-xs">
                    <Link
                      href={`/students?batchId=${batch.id}`}
                      className="px-2.5 py-1.5 rounded-lg bg-[#F4F4F0] dark:bg-[#262626] hover:bg-[#EAEAE6] dark:hover:bg-[#323232] text-[#18181B] dark:text-[#EDEDED] font-medium text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                      <span>
                        {batch.student_count || 0}{" "}
                        {batch.student_count === 1 ? "student" : "students"}
                      </span>
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/attendance?batchId=${batch.id}`}
                        className="h-8 px-2.5 rounded-lg bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Mark daily attendance"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Roll call</span>
                      </Link>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuBatchId(menuBatchId === batch.id ? null : batch.id);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] border border-transparent hover:border-black/[0.06] dark:hover:border-white/[0.08] transition-colors cursor-pointer"
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
                            <div className="absolute right-0 bottom-full mb-1 w-36 bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-xl border border-black/[0.08] dark:border-white/[0.12] p-1 z-40 flex flex-col shadow-lg">
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {confirmDeleteBatch && (
        <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl p-6 flex flex-col gap-4 border border-black/[0.08] dark:border-white/[0.12]">
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-base font-bold text-[#18181B] dark:text-[#EDEDED]">
                Delete batch &ldquo;{confirmDeleteBatch.name}&rdquo;?
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                This will permanently delete this batch. Enrolled students will be unassigned from this batch but their records will remain intact.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setConfirmDeleteBatch(null)}
                className="h-9 px-3 rounded-xl border border-black/[0.08] dark:border-white/[0.12] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBatch}
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
        <BatchModal
          isOpen={true}
          batch={activeModal === "new" ? null : activeModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
