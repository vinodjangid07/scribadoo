import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`bg-[#FFFFFF] dark:bg-[#191919] border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between ${className}`}
    >
      <span className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
        {label}
      </span>
      <div className="mt-2">
        <div className="text-2xl sm:text-3xl font-bold font-heading text-[#18181B] dark:text-[#EDEDED] tracking-tight tabular-nums">
          {value}
        </div>
        {subtitle && (
          <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1 block">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
