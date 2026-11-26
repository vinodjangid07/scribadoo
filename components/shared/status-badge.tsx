import React from "react";
import { Check, X, Clock, Calendar } from "lucide-react";

export type StatusType =
  | "paid"
  | "pending"
  | "partially_paid"
  | "overdue"
  | "present"
  | "absent"
  | "late"
  | "holiday"
  | "recorded";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  className = "",
}: StatusBadgeProps) {
  switch (status) {
    case "paid":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] border border-black/[0.08] dark:border-white/[0.12] ${className}`}
        >
          <Check className="w-3 h-3 text-[#18181B] dark:text-[#EDEDED]" />
          <span>{label || "Paid"}</span>
        </span>
      );

    case "partially_paid":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#F4F4F0]/60 dark:bg-[#262626]/60 text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.08] dark:border-white/[0.12] ${className}`}
        >
          <span>{label || "Partial"}</span>
        </span>
      );

    case "pending":
    case "overdue":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-transparent text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.08] dark:border-white/[0.12] ${className}`}
        >
          <span>{label || "Pending"}</span>
        </span>
      );

    case "recorded":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] border border-black/[0.08] dark:border-white/[0.12] ${className}`}
        >
          <Check className="w-3 h-3 text-[#18181B] dark:text-[#EDEDED]" />
          <span>{label || "Recorded"}</span>
        </span>
      );

    case "present":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] border border-black/[0.08] dark:border-white/[0.12] ${className}`}
        >
          <Check className="w-3 h-3 text-[#18181B] dark:text-[#EDEDED]" />
          <span>{label || "Present"}</span>
        </span>
      );

    case "absent":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.08] dark:border-white/[0.12] ${className}`}
        >
          <X className="w-3 h-3 text-red-500" />
          <span>{label || "Absent"}</span>
        </span>
      );

    case "late":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-[#F4F4F0] dark:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] border border-black/[0.08] dark:border-white/[0.12] ${className}`}
        >
          <Clock className="w-3 h-3 text-amber-500" />
          <span>{label || "Late"}</span>
        </span>
      );

    case "holiday":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.08] dark:border-white/[0.12] ${className}`}
        >
          <Calendar className="w-3 h-3 text-[#71717A] dark:text-[#A1A1AA]" />
          <span>{label || "Holiday"}</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-black/[0.04] dark:bg-white/[0.06] text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.06] dark:border-white/[0.08] ${className}`}
        >
          <span>{label || status}</span>
        </span>
      );
  }
}
