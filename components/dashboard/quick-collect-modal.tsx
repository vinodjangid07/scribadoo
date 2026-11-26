"use client";

import React, { useState, useMemo } from "react";
import { X, Search, ArrowRight } from "lucide-react";
import type { OverdueStudentItem } from "@/types/dashboard";
import { StudentAvatar } from "@/components/shared/student-avatar";
import { useModalClose } from "@/hooks/use-modal-close";

interface QuickCollectModalProps {
  isOpen: boolean;
  onClose: () => void;
  overdueStudents: OverdueStudentItem[];
  onSelectStudent: (student: OverdueStudentItem) => void;
}

export function QuickCollectModal({
  isOpen,
  onClose,
  overdueStudents,
  onSelectStudent,
}: QuickCollectModalProps) {
  const modalRef = useModalClose({ isOpen, onClose });
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return overdueStudents;
    const q = searchQuery.toLowerCase();
    return overdueStudents.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        (s.parentName && s.parentName.toLowerCase().includes(q)) ||
        s.parentPhone.includes(q)
    );
  }, [overdueStudents, searchQuery]);

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
              Quick Fee Collection
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Select a student to record a Cash, UPI, or bank payment.
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

        <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.07] bg-[#FBFBF9] dark:bg-[#141414]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search student or parent name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8.5 pr-3 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] text-xs text-[#18181B] dark:text-[#EDEDED] focus:outline-none focus:border-black/[0.25] dark:focus:border-white/[0.25]"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
              {overdueStudents.length === 0
                ? "All enrolled students have cleared their fees for this month."
                : "No matching students found."}
            </div>
          ) : (
            <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
              {filtered.map((student) => (
                <button
                  key={student.studentId}
                  type="button"
                  onClick={() => {
                    onSelectStudent(student);
                    onClose();
                  }}
                  className="w-full px-6 py-3.5 hover:bg-[#F9F9F7] dark:hover:bg-white/[0.025] flex items-center justify-between gap-3 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StudentAvatar name={student.studentName} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED] group-hover:underline truncate capitalize">
                        {student.studentName}
                      </div>
                      <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">
                        {student.enrolledBatchNames.join(", ") || "Active Student"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED] tabular-nums">
                        ₹{student.balanceRemaining.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                        due
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA] group-hover:text-[#18181B] dark:group-hover:text-[#EDEDED] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
