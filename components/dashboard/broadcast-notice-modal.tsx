"use client";

import React, { useState, useId } from "react";
import { X, Megaphone, Copy, Check, MessageCircle } from "lucide-react";
import { useModalClose } from "@/hooks/use-modal-close";

interface BroadcastNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: Array<{ id: string; name: string; studentCount: number }>;
  teacherName: string;
  initialTemplate?: NoticeTemplateKey;
}

type NoticeTemplateKey = "timing" | "holiday" | "test" | "fees" | "custom";

export function BroadcastNoticeModal({
  isOpen,
  onClose,
  batches,
  teacherName,
  initialTemplate = "timing",
}: BroadcastNoticeModalProps) {
  const modalRef = useModalClose({ isOpen, onClose });
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [templateKey, setTemplateKey] = useState<NoticeTemplateKey>(initialTemplate);
  const [customText, setCustomText] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const batchSelectId = useId();

  React.useEffect(() => {
    if (isOpen) {
      setTemplateKey(initialTemplate);
      setCustomText("");
    }
  }, [isOpen, initialTemplate]);

  if (!isOpen) return null;

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const targetLabel = selectedBatch ? selectedBatch.name : "All Students & Parents";

  const getTemplateText = (key: NoticeTemplateKey): string => {
    switch (key) {
      case "timing":
        return `Dear Parents & Students of ${targetLabel},\n\nPlease note that today's tuition class schedule has been revised. The class will now take place from [Time, e.g. 5:00 PM – 7:00 PM].\n\nKindly ensure punctual attendance.\n\nWarm regards,\n${teacherName}`;
      case "holiday":
        return `Dear Parents & Students of ${targetLabel},\n\nPlease be informed that there will be NO tuition class today due to [e.g. inclement weather / festive holiday]. The syllabus will be covered in the upcoming session.\n\nWarm regards,\n${teacherName}`;
      case "test":
        return `Dear Students & Parents of ${targetLabel},\n\nThis is an announcement regarding an upcoming assessment test on [Date / Day]. Topic: [e.g. Chapter 4 & 5].\n\nPlease ensure thorough revision.\n\nWarm regards,\n${teacherName}`;
      case "fees":
        return `Dear Parents of ${targetLabel},\n\nThis is a polite reminder regarding the monthly tuition fees for the current cycle. If not yet cleared, kindly arrange the payment via UPI or cash at your earliest convenience.\n\nThank you for your continued support.\n\nWarm regards,\n${teacherName}`;
      case "custom":
        return `Dear Parents & Students of ${targetLabel},\n\n[Write your custom message here...]\n\nWarm regards,\n${teacherName}`;
    }
  };

  const currentMessage = customText || getTemplateText(templateKey);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Failed to copy
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(currentMessage);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-[#1C1C1C] border border-[#E4E4E7] dark:border-[#262626] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#F4F4F0] dark:border-[#262626]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F4F4F0] dark:bg-[#262626] flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-[#18181B] dark:text-[#EDEDED]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Broadcast Batch Notice
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Format and share announcements to parent groups via WhatsApp
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

        <div className="p-4 space-y-4">
          <div>
            <label
              htmlFor={batchSelectId}
              className="block text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] mb-1.5"
            >
              Select Target Batch
            </label>
            <select
              id={batchSelectId}
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setCustomText("");
              }}
              className="w-full h-9 px-3 rounded-xl border border-[#E4E4E7] dark:border-[#262626] bg-[#FAFAF9] dark:bg-[#181818] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] focus:outline-none focus:ring-1 focus:ring-[#18181B] dark:focus:ring-[#EDEDED]"
            >
              <option value="all">All Active Batches &amp; Students</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.studentCount} students)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] mb-1.5">
              Notice Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { key: "timing", label: "Timing Change" },
                { key: "holiday", label: "Holiday / Rain" },
                { key: "test", label: "Upcoming Test" },
                { key: "fees", label: "Fee Reminder" },
                { key: "custom", label: "Custom Note" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setTemplateKey(t.key as NoticeTemplateKey);
                    setCustomText("");
                  }}
                  className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-colors border ${
                    templateKey === t.key
                      ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] border-transparent font-semibold"
                      : "bg-[#FAFAF9] dark:bg-[#181818] text-[#71717A] dark:text-[#A1A1AA] border-[#E4E4E7] dark:border-[#262626] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] mb-1.5">
              Message Preview (Editable)
            </label>
            <textarea
              rows={6}
              value={currentMessage}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#E4E4E7] dark:border-[#262626] bg-[#FAFAF9] dark:bg-[#181818] text-xs font-sans leading-relaxed text-[#18181B] dark:text-[#EDEDED] focus:outline-none focus:ring-1 focus:ring-[#18181B] dark:focus:ring-[#EDEDED] resize-none"
            />
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-[#FAFAF9] dark:bg-[#181818] border-t border-[#F4F4F0] dark:border-[#262626] flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="h-9 px-3 sm:px-3.5 rounded-xl border border-[#E4E4E7] dark:border-[#262626] bg-white dark:bg-[#1C1C1C] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] flex items-center gap-1.5 transition-colors active:scale-[0.98] whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="h-9 px-3.5 sm:px-4 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] hover:bg-black dark:hover:bg-white text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-[0.98] whitespace-nowrap shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Share on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
