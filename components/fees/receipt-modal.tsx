"use client";

import { useState } from "react";
import { PaymentMethod } from "@/types/fees";
import { Check, Copy, MessageCircle, X } from "lucide-react";
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold tracking-tight text-[#18181B] dark:text-[#EDEDED]">
              Payment Receipt
            </h2>
            <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
              {receiptData.receiptNumber}
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

        {/* Clean editorial voucher surface */}
        <div className="px-6 py-6 bg-[#FBFBF9] dark:bg-[#141414] flex flex-col">
          <div className="pb-5 border-b border-black/[0.08] dark:border-white/[0.08] flex items-baseline justify-between gap-4">
            <div>
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] block">
                Amount Received
              </span>
              <span className="font-heading text-3xl font-extrabold tracking-tight text-[#18181B] dark:text-[#EDEDED] tabular-nums mt-1 block">
                ₹{Number(receiptData.amount).toLocaleString("en-IN")}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] text-xs font-semibold shrink-0">
              <Check className="w-3 h-3" />
              <span>Confirmed</span>
            </span>
          </div>

          <dl className="divide-y divide-black/[0.05] dark:divide-white/[0.06] text-xs">
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-[#71717A] dark:text-[#A1A1AA]">Student</dt>
              <dd className="font-semibold text-[#18181B] dark:text-[#EDEDED] text-right">
                {receiptData.studentName}
              </dd>
            </div>
            {receiptData.parentName && (
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-[#71717A] dark:text-[#A1A1AA]">Parent</dt>
                <dd className="font-medium text-[#18181B] dark:text-[#EDEDED] text-right">
                  {receiptData.parentName}
                </dd>
              </div>
            )}
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-[#71717A] dark:text-[#A1A1AA]">Billing month</dt>
              <dd className="font-medium text-[#18181B] dark:text-[#EDEDED] text-right">
                {formattedMonth}
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-[#71717A] dark:text-[#A1A1AA]">Payment date</dt>
              <dd className="font-medium text-[#18181B] dark:text-[#EDEDED] text-right tabular-nums">
                {receiptData.paymentDate || "Today"}
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-[#71717A] dark:text-[#A1A1AA]">Payment mode</dt>
              <dd className="font-semibold uppercase text-[#18181B] dark:text-[#EDEDED] text-right">
                {receiptData.paymentMethod.replace("_", " ")}
              </dd>
            </div>
            <div className="py-3 pb-0 flex items-center justify-between gap-4">
              <dt className="text-[#71717A] dark:text-[#A1A1AA]">Issued by</dt>
              <dd className="font-medium text-[#18181B] dark:text-[#EDEDED] text-right">
                {receiptData.teacherName || "Tuition Teacher"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="px-6 py-4 bg-[#FFFFFF] dark:bg-[#191919] border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:flex-1 h-9 px-3 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                <span>Copy receipt</span>
              </>
            )}
          </button>

          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 h-9 px-4 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] text-xs font-semibold hover:bg-[#27272A] dark:hover:bg-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
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
