"use client";

import { useState, FormEvent } from "react";
import { StudentFeeEntry, PaymentMethod } from "@/types/fees";
import { recordBulkPayments } from "@/app/actions/fees";
import { Check, X, CreditCard, Banknote, Landmark, HelpCircle, Users } from "lucide-react";
import { useModalClose } from "@/hooks/use-modal-close";

interface BulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEntries: StudentFeeEntry[];
  onSuccess: (count: number, totalCollected: number) => void;
}

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string; icon: any }> = [
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 dark:bg-black/70 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#1C1C1C] rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-black/[0.08] dark:border-white/[0.12] shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex flex-col">
            <h2 className="font-heading text-lg font-bold text-[#18181B] dark:text-[#EDEDED] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#71717A] dark:text-[#A1A1AA]" />
              <span>Bulk Fee Collection</span>
            </h2>
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Collecting pending balance for {selectedEntries.length} student{selectedEntries.length === 1 ? "" : "s"}
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

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="p-4 rounded-2xl bg-[#FBFBF9] dark:bg-[#181818] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Total Collection Amount</span>
              <span className="text-2xl font-bold font-mono text-[#18181B] dark:text-[#EDEDED] tracking-tight">
                ₹{totalOutstanding.toLocaleString("en-IN")}
              </span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-xl bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] font-semibold border border-black/[0.06] dark:border-white/[0.08]">
              {selectedEntries.length} Students
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
              Selected Students ({selectedEntries.length})
            </span>
            <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-xl max-h-36 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.06] bg-[#FFFFFF] dark:bg-[#1C1C1C]">
              {selectedEntries.map((e) => (
                <div key={e.student_id} className="p-2.5 px-3 flex items-center justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#18181B] dark:text-[#EDEDED]">
                      {e.student_name}
                    </span>
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                      {e.grade || "Student"} {e.parent_name ? `• ${e.parent_name}` : ""}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#18181B] dark:text-[#EDEDED]">
                    ₹{e.balance_remaining.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
              Payment Method
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
                    className={`h-11 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] border-transparent shadow-xs"
                        : "bg-[#FFFFFF] dark:bg-[#1C1C1C] border-black/[0.08] dark:border-white/[0.12] text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#262626]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Collection Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-9 px-3 bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12] rounded-xl text-xs text-[#18181B] dark:text-[#EDEDED] outline-none focus:border-black/[0.2] dark:focus:border-white/[0.25]"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDED]">
                Batch Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. November cash collected"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-9 px-3 bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12] rounded-xl text-xs text-[#18181B] dark:text-[#EDEDED] placeholder-[#A1A1AA] dark:placeholder-[#71717A] outline-none focus:border-black/[0.2] dark:focus:border-white/[0.25]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-xl border border-black/[0.08] dark:border-white/[0.12] text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalOutstanding <= 0}
              className="h-9 px-5 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] hover:bg-[#27272A] dark:hover:bg-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                  <span>Recording {selectedEntries.length} payments...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Collect ₹{totalOutstanding.toLocaleString("en-IN")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
