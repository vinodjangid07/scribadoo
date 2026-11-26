"use client";

import React from "react";
import { List, LayoutGrid } from "lucide-react";

interface ViewModeToggleProps {
  view: "table" | "cards";
  onChange: (view: "table" | "cards") => void;
  className?: string;
}

export function ViewModeToggle({
  view,
  onChange,
  className = "",
}: ViewModeToggleProps) {
  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12] h-9 shrink-0 ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange("table")}
        title="List view"
        className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
          view === "table"
            ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-semibold shadow-2xs"
            : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
        }`}
      >
        <List className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">List</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("cards")}
        title="Grid cards view"
        className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
          view === "cards"
            ? "bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] font-semibold shadow-2xs"
            : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Grid</span>
      </button>
    </div>
  );
}
