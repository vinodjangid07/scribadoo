"use client";

import { useState } from "react";
import { PaymentMethod } from "@/types/fees";
import { Check, Copy, MessageCircle, X, ShieldCheck } from "lucide-react";
import { useModalClose } from "@/hooks/use-modal-close";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: {
    receiptNumber: string;
    studentName: string;
    parentName?: string | null;
    parentPhone?: string | null;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate?: string;
    month: string;
    teacherName?: string;
  } | null;
}

function formatMonthName(monthStr: string) {
  try {
    const [y, m] = monthStr.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  } catch {
    return monthStr;
  }
}

export function ReceiptModal({ isOpen, onClose, receiptData }: ReceiptModalProps) {
  const modalRef = useModalClose({ isOpen, onClose });
  const [copied, setCopied] = useState(false);

  if (!isOpen || !receiptData) return null;
  const formattedMonth = formatMonthName(receiptData.month);

  const cleanPhone = (receiptData.parentPhone || "").replace(/\D/g, "");
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const receiptText = `*FEE PAYMENT RECEIPT - SCRIBADOO*
Receipt No: ${receiptData.receiptNumber}
Date: ${receiptData.paymentDate || new Date().toISOString().split("T")[0]}
Student: ${receiptData.studentName}
Parent: ${receiptData.parentName || "Parent"}
Billing Month: ${formattedMonth}
Amount Received: ₹${Number(receiptData.amount).toLocaleString("en-IN")}
Payment Mode: ${receiptData.paymentMethod.toUpperCase()}
Status: RECEIVED WITH THANKS

Teacher: ${receiptData.teacherName || "Tuition Teacher"}`;

  const waLink = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(receiptText)}`
    : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Failed to copy to clipboard
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 dark:bg-black/70 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-black/[0.08] dark:border-white/[0.12] shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-heading text-lg font-bold text-[#18181B] dark:text-[#EDEDED]">
              Payment Receipt
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] rounded-lg hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl p-5 bg-[#FBFBF9] dark:bg-[#161616] border border-black/[0.08] dark:border-white/[0.1] flex flex-col gap-4 font-sans text-[#18181B] dark:text-[#EDEDED]">
          <div className="flex items-start justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
            <div>
              <span className="text-xs uppercase font-semibold text-[#71717A] dark:text-[#A1A1AA] tracking-wider block">
                Official Tuition Receipt
              </span>
              <span className="text-base font-bold font-heading">
                {receiptData.teacherName || "Tuition Center"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] block">
                Receipt #
              </span>
              <span className="text-xs font-bold font-mono">
                {receiptData.receiptNumber}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] block">Student</span>
              <span className="font-semibold text-sm">{receiptData.studentName}</span>
              {receiptData.parentName && (
                <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] block mt-0.5">
                  Parent: {receiptData.parentName}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] block">Billing Month</span>
              <span className="font-semibold text-sm">{formattedMonth}</span>
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] block mt-0.5">
                Paid: {receiptData.paymentDate || "Today"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FFFFFF] dark:bg-[#202020] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Amount Received</span>
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Via {receiptData.paymentMethod.toUpperCase()}
              </span>
            </div>
            <span className="text-2xl font-bold font-heading tabular-nums font-mono text-[#18181B] dark:text-[#EDEDED]">
              ₹{Number(receiptData.amount).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs text-[#71717A] dark:text-[#A1A1AA]">
            <span>Status: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">Payment Confirmed</strong></span>
            <span>Recorded in Scribadoo</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:flex-1 h-9 px-3 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#262626] hover:bg-[#F4F4F0] dark:hover:bg-[#323232] text-xs font-semibold text-[#18181B] dark:text-[#EDEDED] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Copied to clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                <span>Copy receipt text</span>
              </>
            )}
          </button>

          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 h-9 px-4 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] text-xs font-bold hover:bg-[#27272A] dark:hover:bg-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
