"use client";

import React from "react";
import Link from "next/link";
import { X, CheckSquare, Users, ArrowRight } from "lucide-react";
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-[#1C1C1C] border border-[#E4E4E7] dark:border-[#262626] rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#F4F4F0] dark:border-[#262626]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F4F4F0] dark:bg-[#262626] flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-[#18181B] dark:text-[#EDEDED]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Quick Roll Call
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Select a batch to start roll call in under 10 seconds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {batches.map((batch) => {
            const isToday = todayBatchIds.includes(batch.id);
            return (
              <Link
                key={batch.id}
                href={`/attendance?batchId=${batch.id}`}
                onClick={onClose}
                className="p-3 rounded-xl border border-[#F4F4F0] dark:border-[#262626] bg-[#FAFAF9] dark:bg-[#181818] hover:border-[#18181B] dark:hover:border-[#EDEDED] flex items-center justify-between gap-3 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] group-hover:underline">
                      {batch.name}
                    </span>
                    {isToday && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-semibold">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1 mt-0.5">
                    <Users className="w-3 h-3 text-[#A1A1AA]" />
                    <span>{batch.studentCount} enrolled students</span>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-lg bg-white dark:bg-[#262626] border border-[#E4E4E7] dark:border-[#333333] flex items-center justify-center shrink-0 text-[#71717A] dark:text-[#A1A1AA] group-hover:text-[#18181B] dark:group-hover:text-[#EDEDED]">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
