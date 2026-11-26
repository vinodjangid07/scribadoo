"use client";

import React, { useState, useEffect, useMemo } from "react";
import { OverdueStudentItem } from "@/types/dashboard";
import { Copy, Check, X, Send } from "lucide-react";
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold tracking-tight text-[#18181B] dark:text-[#EDEDED]">
              WhatsApp Fee Reminder
            </h2>
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
              {student.studentName} · ₹{student.balanceRemaining.toLocaleString("en-IN")} pending
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
              Message template
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "english", label: "English" },
                  { id: "hindi", label: "Hindi" },
                  { id: "short", label: "Brief" },
                ] as const
              ).map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`h-9 px-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    selectedTemplate === tpl.id
                      ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] border-transparent font-semibold"
                      : "bg-[#FBFBF9] dark:bg-[#141414] border-black/[0.08] dark:border-white/[0.08] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Message preview
              </label>
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
                To: {student.parentPhone}
              </span>
            </div>

            <textarea
              rows={4}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full p-3.5 bg-[#FBFBF9] dark:bg-[#141414] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#18181B] dark:text-[#EDEDED] leading-relaxed outline-none focus:border-black/[0.25] dark:focus:border-white/[0.25] transition-colors resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-[#FAFAF9] dark:bg-[#141414] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="h-9 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] transition-colors cursor-pointer flex items-center gap-1.5"
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
              className="h-9 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="h-9 px-4 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] hover:bg-[#27272A] dark:hover:bg-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open in WhatsApp</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="h-9 px-4 rounded-xl bg-black/[0.06] dark:bg-white/[0.08] text-[#71717A] text-xs font-semibold cursor-not-allowed"
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
