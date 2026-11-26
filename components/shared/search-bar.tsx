"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  autoFocus = false,
}: SearchBarProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-3.5 h-3.5 text-[#A1A1AA] dark:text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full h-9 pl-8 pr-8 bg-[#FFFFFF] dark:bg-[#1C1C1C] text-xs text-[#18181B] dark:text-[#EDEDED] placeholder-[#A1A1AA] dark:placeholder-[#71717A] rounded-xl outline-none border border-black/[0.08] dark:border-white/[0.12] focus:border-black/[0.25] dark:focus:border-white/[0.3] transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED] p-0.5 rounded cursor-pointer"
          title="Clear search"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
