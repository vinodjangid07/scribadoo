"use client";

import React, { useState, useMemo } from "react";
import { X, Search, CreditCard, ArrowRight } from "lucide-react";
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-[#1C1C1C] border border-[#E4E4E7] dark:border-[#262626] rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#F4F4F0] dark:border-[#262626]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F4F4F0] dark:bg-[#262626] flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-[#18181B] dark:text-[#EDEDED]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Quick Fee Collection
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Select a student to log offline cash or UPI receipt
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

        <div className="p-3 border-b border-[#F4F4F0] dark:border-[#262626]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search student or parent name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-[#E4E4E7] dark:border-[#262626] bg-[#FAFAF9] dark:bg-[#181818] text-xs text-[#18181B] dark:text-[#EDEDED] focus:outline-none focus:ring-1 focus:ring-[#18181B] dark:focus:ring-[#EDEDED]"
            />
          </div>
        </div>

        <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
              {overdueStudents.length === 0
                ? "All enrolled students have fully cleared their fees for this month!"
                : "No matching students found."}
            </div>
          ) : (
            filtered.map((student) => (
              <button
                key={student.studentId}
                onClick={() => {
                  onSelectStudent(student);
                  onClose();
                }}
                className="w-full p-3 rounded-xl border border-[#F4F4F0] dark:border-[#262626] bg-[#FAFAF9] dark:bg-[#181818] hover:border-[#18181B] dark:hover:border-[#EDEDED] flex items-center justify-between gap-3 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <StudentAvatar name={student.studentName} size="sm" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED] group-hover:underline truncate">
                      {student.studentName}
                    </div>
                    <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">
                      {student.enrolledBatchNames.join(", ") || "Active Student"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-[#18181B] dark:text-[#EDEDED]">
                      ₹{student.balanceRemaining.toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                      Pending
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-md bg-white dark:bg-[#262626] border border-[#E4E4E7] dark:border-[#333333] flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] group-hover:text-[#18181B] dark:group-hover:text-[#EDEDED]">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
