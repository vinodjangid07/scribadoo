"use client";

import { useState, FormEvent } from "react";
import { StudentFeeEntry, PaymentMethod } from "@/types/fees";
import { recordBulkPayments } from "@/app/actions/fees";
import { Check, X, CreditCard, Banknote, Landmark, HelpCircle } from "lucide-react";
import { useModalClose } from "@/hooks/use-modal-close";

interface BulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEntries: StudentFeeEntry[];
  onSuccess: (count: number, totalCollected: number) => void;
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

export function BulkPaymentModal({
  isOpen,
  onClose,
  selectedEntries,
  onSuccess,
}: BulkPaymentModalProps) {
  const modalRef = useModalClose({ isOpen, onClose });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [paymentDate, setPaymentDate] = useState<string>(getTodayString());
  const [notes, setNotes] = useState<string>("Bulk fee collection");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || selectedEntries.length === 0) return null;

  const totalOutstanding = selectedEntries.reduce(
    (sum, e) => sum + (e.balance_remaining > 0 ? e.balance_remaining : 0),
    0
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const paymentsToProcess = selectedEntries
      .filter((e) => e.balance_remaining > 0)
      .map((e) => ({
        feeRecordId: e.fee_record_id,
        studentId: e.student_id,
        amount: e.balance_remaining,
      }));

    if (paymentsToProcess.length === 0) {
      setErrorMessage("None of the selected students have pending dues.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordBulkPayments({
        payments: paymentsToProcess,
        paymentMethod,
        paymentDate,
        notes,
      });

      if (res.success) {
        onSuccess(res.count || paymentsToProcess.length, res.totalCollected || totalOutstanding);
        onClose();
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } finally {
      setIsSubmitting(false);
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
        className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#191919] rounded-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold tracking-tight text-[#18181B] dark:text-[#EDEDED]">
              Bulk Fee Collection
            </h2>
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
              Recording payments for {selectedEntries.length} student{selectedEntries.length === 1 ? "" : "s"}
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

        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.07] bg-[#FBFBF9] dark:bg-[#141414] flex items-baseline justify-between">
          <div>
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] block">
              Total collection amount
            </span>
            <span className="font-heading text-2xl font-bold text-[#18181B] dark:text-[#EDEDED] tracking-tight tabular-nums mt-0.5 block">
              ₹{totalOutstanding.toLocaleString("en-IN")}
            </span>
          </div>
          <span className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
            {selectedEntries.length} selected
          </span>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex flex-col">
          <div className="p-6 flex flex-col gap-5">
            {errorMessage && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 font-medium">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Students included
              </span>
              <div className="border border-black/[0.08] dark:border-white/[0.08] rounded-xl max-h-36 overflow-y-auto divide-y divide-black/[0.05] dark:divide-white/[0.06] bg-[#FBFBF9] dark:bg-[#141414]">
                {selectedEntries.map((e) => (
                  <div key={e.student_id} className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                    <div className="flex flex-col min-w-0 pr-3">
                      <span className="font-medium text-[#18181B] dark:text-[#EDEDED] truncate">
                        {e.student_name}
                      </span>
                      <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">
                        {e.grade || "Student"} {e.parent_name ? `· ${e.parent_name}` : ""}
                      </span>
                    </div>
                    <span className="font-semibold text-xs text-[#18181B] dark:text-[#EDEDED] tabular-nums shrink-0">
                      ₹{e.balance_remaining.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Payment method
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`h-10 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] border-transparent font-semibold"
                          : "bg-[#FBFBF9] dark:bg-[#141414] border-black/[0.08] dark:border-white/[0.08] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                  Collection date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full h-10 px-3 bg-[#FBFBF9] dark:bg-[#141414] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#18181B] dark:text-[#EDEDED] outline-none focus:border-black/[0.25] dark:focus:border-white/[0.25]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                  Note <span className="font-normal text-[#71717A] dark:text-[#A1A1AA]">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. November cash collected"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-10 px-3 bg-[#FBFBF9] dark:bg-[#141414] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#18181B] dark:text-[#EDEDED] placeholder-[#A1A1AA] dark:placeholder-[#71717A] outline-none focus:border-black/[0.25] dark:focus:border-white/[0.25]"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-[#FAFAF9] dark:bg-[#141414] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#FFFFFF] dark:bg-[#191919] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F0] dark:hover:bg-[#242424] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalOutstanding <= 0}
              className="h-9 px-5 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] hover:bg-[#27272A] dark:hover:bg-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 tabular-nums"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? `Recording ${selectedEntries.length}...`
                  : `Collect ₹${totalOutstanding.toLocaleString("en-IN")}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
