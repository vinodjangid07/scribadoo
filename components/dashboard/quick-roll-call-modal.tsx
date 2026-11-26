"use client";

import React from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { useModalClose } from "@/hooks/use-modal-close";

interface QuickRollCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: Array<{ id: string; name: string; studentCount: number }>;
  todayBatchIds: string[];
}

export function QuickRollCallModal({
  isOpen,
  onClose,
  batches,
  todayBatchIds,
}: QuickRollCallModalProps) {
  const modalRef = useModalClose({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        className="bg-[#FFFFFF] dark:bg-[#191919] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold tracking-tight text-[#18181B] dark:text-[#EDEDED]">
              Daily Roll Call
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Choose a batch to mark today&apos;s attendance.
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

        <div className="overflow-y-auto flex-1">
          {batches.length === 0 ? (
            <div className="px-6 py-10 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
              No batches created yet.
            </div>
          ) : (
            <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
              {batches.map((batch) => {
                const isToday = todayBatchIds.includes(batch.id);
                return (
                  <Link
                    key={batch.id}
                    href={`/attendance?batchId=${batch.id}`}
                    onClick={onClose}
                    className="px-6 py-3.5 hover:bg-[#F9F9F7] dark:hover:bg-white/[0.025] flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED] group-hover:underline truncate">
                          {batch.name}
                        </span>
                        {isToday && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#18181B] dark:text-[#EDEDED]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#18181B] dark:bg-[#EDEDED]" />
                            Today
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5 tabular-nums">
                        {batch.studentCount} {batch.studentCount === 1 ? "student" : "students"} enrolled
                      </div>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA] group-hover:text-[#18181B] dark:group-hover:text-[#EDEDED] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
