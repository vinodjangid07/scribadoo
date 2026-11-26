"use client";

import React from "react";
import { Filter, ChevronDown } from "lucide-react";

interface BatchOption {
  id: string;
  name: string;
}

interface BatchFilterDropdownProps {
  batches: BatchOption[];
  selectedBatchId: string;
  onChange: (batchId: string) => void;
  allLabel?: string;
  className?: string;
}

export function BatchFilterDropdown({
  batches,
  selectedBatchId,
  onChange,
  allLabel = "All batches",
  className = "",
}: BatchFilterDropdownProps) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA] pointer-events-none" />
      <select
        value={selectedBatchId}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Filter by Batch"
        className="h-9 w-full max-w-full pl-8 pr-8 bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12] rounded-xl text-xs font-medium text-[#18181B] dark:text-[#EDEDED] appearance-none cursor-pointer outline-none focus:border-black/[0.25] dark:focus:border-white/[0.3] transition-colors truncate"
      >
        <option value="all">{allLabel}</option>
        {batches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA] pointer-events-none" />
    </div>
  );
}
