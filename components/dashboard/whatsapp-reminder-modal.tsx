"use client";

import React, { useState, useEffect, useMemo } from "react";
import { OverdueStudentItem } from "@/types/dashboard";
import { MessageCircle, Copy, Check, X, Send } from "lucide-react";
import { useModalClose } from "@/hooks/use-modal-close";

interface WhatsappReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: OverdueStudentItem | null;
  teacherName: string;
}

function formatMonthDisplay(monthStr: string) {
  try {
    const [y, m] = monthStr.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return monthStr;
  }
}

function cleanWhatsappPhone(phone?: string | null) {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length === 10 ? `91${cleaned}` : cleaned;
}

type TemplateType = "english" | "hindi" | "short";

export function WhatsappReminderModal({
  isOpen,
  onClose,
  student,
  teacherName,
}: WhatsappReminderModalProps) {
  const modalRef = useModalClose({ isOpen, onClose });
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("english");
  const [customText, setCustomText] = useState("");
  const [copied, setCopied] = useState(false);

  const monthName = useMemo(() => {
    return student ? formatMonthDisplay(student.month) : "";
  }, [student]);

  const defaultMessages = useMemo(() => {
    if (!student) return { english: "", hindi: "", short: "" };
    const pName = student.parentName || "Parent";
    const sName = student.studentName;
    const balance = student.balanceRemaining.toLocaleString("en-IN");

    return {
      english: `Hi ${pName}, this is a polite reminder regarding ${sName}'s tuition fee for ${monthName}. The outstanding balance is ₹${balance}. Thank you! - ${teacherName}`,
      hindi: `नमस्ते ${pName} जी, ${sName} की ${monthName} की ट्यूशन फीस ₹${balance} शेष है। कृपया समय पर भुगतान करें। धन्यवाद! - ${teacherName}`,
      short: `Tuition fee reminder: ₹${balance} due for ${sName} (${monthName}). Payment via UPI/Cash. - ${teacherName}`,
    };
  }, [student, monthName, teacherName]);

  useEffect(() => {
    if (student) {
      setCustomText(defaultMessages[selectedTemplate]);
    }
  }, [student, selectedTemplate, defaultMessages]);

  if (!isOpen || !student) return null;

  const phone = cleanWhatsappPhone(student.parentPhone);
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(customText)}`
    : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 dark:bg-black/70 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-black/[0.08] dark:border-white/[0.12] shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex flex-col">
            <h2 className="font-heading text-lg font-bold text-[#18181B] dark:text-[#EDEDED] flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#71717A] dark:text-[#A1A1AA]" />
              <span>WhatsApp Fee Reminder</span>
            </h2>
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              {student.studentName} • Pending: ₹{student.balanceRemaining.toLocaleString("en-IN")}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
            Select Message Template
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedTemplate("english")}
              className={`h-9 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                selectedTemplate === "english"
                  ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] border-transparent"
                  : "bg-[#FFFFFF] dark:bg-[#1C1C1C] border-black/[0.08] dark:border-white/[0.12] text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#262626]"
              }`}
            >
              English Polite
            </button>
            <button
              type="button"
              onClick={() => setSelectedTemplate("hindi")}
              className={`h-9 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                selectedTemplate === "hindi"
                  ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] border-transparent"
                  : "bg-[#FFFFFF] dark:bg-[#1C1C1C] border-black/[0.08] dark:border-white/[0.12] text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#262626]"
              }`}
            >
              Hindi Friendly
            </button>
            <button
              type="button"
              onClick={() => setSelectedTemplate("short")}
              className={`h-9 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                selectedTemplate === "short"
                  ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] border-transparent"
                  : "bg-[#FFFFFF] dark:bg-[#1C1C1C] border-black/[0.08] dark:border-white/[0.12] text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#262626]"
              }`}
            >
              Short & Direct
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
              Message Preview (Editable)
            </label>
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              To: {student.parentPhone}
            </span>
          </div>

          <textarea
            rows={4}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full p-3 bg-[#FBFBF9] dark:bg-[#181818] border border-black/[0.08] dark:border-white/[0.12] rounded-2xl text-xs text-[#18181B] dark:text-[#EDEDED] leading-relaxed outline-none focus:border-black/[0.25] dark:focus:border-white/[0.3] transition-colors resize-none"
          />
        </div>

        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
          <button
            type="button"
            onClick={handleCopy}
            className="h-9 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#1C1C1C] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                <span>Copy text</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="h-9 px-4 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] hover:bg-[#27272A] dark:hover:bg-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open in WhatsApp</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="h-9 px-4 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-400 text-xs font-bold cursor-not-allowed"
              >
                Invalid phone
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
