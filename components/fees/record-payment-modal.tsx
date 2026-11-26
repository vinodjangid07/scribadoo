"use client";

import { useState, useEffect, FormEvent } from "react";
import { StudentFeeEntry, PaymentMethod } from "@/types/fees";
import { recordPayment } from "@/app/actions/fees";
import { Check, X, CreditCard, Banknote, Landmark, HelpCircle } from "lucide-react";
import { useModalClose } from "@/hooks/use-modal-close";

interface RecordPaymentModalProps {
  entry: StudentFeeEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (receiptNumber: string, studentName: string, amount: number, method: PaymentMethod, month: string) => void;
}

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "upi", label: "UPI", icon: CreditCard },
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "bank_transfer", label: "Bank Transfer", icon: Landmark },
  { id: "other", label: "Other", icon: HelpCircle },
];

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function RecordPaymentModal({
  entry,
  isOpen,
  onClose,
  onSuccess,
}: RecordPaymentModalProps) {
  const modalRef = useModalClose({ isOpen, onClose });

  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [paymentDate, setPaymentDate] = useState<string>(getTodayString());
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (entry && isOpen) {
      setAmount(
        entry.balance_remaining > 0 ? String(entry.balance_remaining) : String(entry.amount_due)
      );
      setPaymentMethod("upi");
      setPaymentDate(getTodayString());
      setNotes("");
      setErrorMessage(null);
    }
  }, [entry, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    setErrorMessage(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordPayment({
        feeRecordId: entry.fee_record_id,
        studentId: entry.student_id,
        amount: amountNum,
        paymentMethod,
        paymentDate,
        notes,
      });

      if (res.success && res.receiptNumber) {
        onSuccess(res.receiptNumber, entry.student_name, amountNum, paymentMethod, entry.month);
        onClose();
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !entry) return null;

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
          <div className="flex flex-col min-w-0">
            <h2 className="font-heading text-lg font-bold tracking-tight text-[#18181B] dark:text-[#EDEDED]">
              Record Payment
            </h2>
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">
              {entry.student_name} · {entry.month}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hairline billing breakdown */}
        <div className="grid grid-cols-2 divide-x divide-black/[0.06] dark:divide-white/[0.07] border-b border-black/[0.06] dark:border-white/[0.07] bg-[#FBFBF9] dark:bg-[#141414]">
          <div className="px-6 py-3.5">
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] block">Total Net Due</span>
            <span className="font-heading text-base font-bold text-[#18181B] dark:text-[#EDEDED] tabular-nums mt-0.5 block">
              ₹{Number(entry.amount_due - entry.discount).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="px-6 py-3.5 text-right">
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] block">Pending Balance</span>
            <span className="font-heading text-base font-bold text-[#18181B] dark:text-[#EDEDED] tabular-nums mt-0.5 block">
              ₹{Number(entry.balance_remaining).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex flex-col">
          <div className="p-6 flex flex-col gap-4">
            {errorMessage && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="payAmount" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Amount received
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-semibold text-[#71717A] dark:text-[#A1A1AA]">
                  ₹
                </span>
                <input
                  id="payAmount"
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="2500"
                  className="w-full pl-8 pr-4 h-11 bg-[#FBFBF9] dark:bg-[#141414] text-[#18181B] dark:text-[#EDEDED] font-heading text-lg font-bold tabular-nums rounded-xl outline-none border border-black/[0.08] dark:border-white/[0.1] focus:border-black/[0.25] dark:focus:border-white/[0.25] transition-colors"
                />
              </div>
              {entry.balance_remaining > 0 && Number(amount) !== entry.balance_remaining && (
                <button
                  type="button"
                  onClick={() => setAmount(String(entry.balance_remaining))}
                  className="text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] text-left underline underline-offset-2 cursor-pointer"
                >
                  Use full remaining balance (₹{entry.balance_remaining.toLocaleString("en-IN")})
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Payment method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = paymentMethod === method.id;
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`h-10 px-3 rounded-xl text-xs font-medium flex items-center gap-2 border transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] border-transparent font-semibold"
                          : "bg-[#FBFBF9] dark:bg-[#141414] text-[#71717A] dark:text-[#A1A1AA] border-black/[0.08] dark:border-white/[0.08] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="paymentDate" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Payment date
              </label>
              <input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 h-10 bg-[#FBFBF9] dark:bg-[#141414] text-[#18181B] dark:text-[#EDEDED] text-xs font-medium rounded-xl outline-none border border-black/[0.08] dark:border-white/[0.1] focus:border-black/[0.25] dark:focus:border-white/[0.25] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="payNotes" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Reference or note <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal">(optional)</span>
              </label>
              <input
                id="payNotes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. GPay ref #8492 or Received in cash"
                className="w-full px-3.5 h-10 bg-[#FBFBF9] dark:bg-[#141414] text-[#18181B] dark:text-[#EDEDED] text-xs rounded-xl outline-none border border-black/[0.08] dark:border-white/[0.1] focus:border-black/[0.25] dark:focus:border-white/[0.25] transition-colors"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-[#FAFAF9] dark:bg-[#141414] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-5 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-white text-white dark:text-[#121212] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Recording..." : "Save payment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
