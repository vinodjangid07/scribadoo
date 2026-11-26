import React from "react";

interface StudentAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function getInitials(name: string): string {
  if (!name) return "ST";
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 2) || "ST"
  );
}

export function StudentAvatar({
  name,
  size = "sm",
  className = "",
}: StudentAvatarProps) {
  const sizeClasses = {
    sm: "w-7 h-7 text-xs rounded-lg",
    md: "w-9 h-9 text-xs rounded-xl",
    lg: "w-11 h-11 text-sm rounded-2xl",
  }[size];

  return (
    <div
      className={`${sizeClasses} bg-[#F4F4F0] dark:bg-[#262626] text-[#71717A] dark:text-[#A1A1AA] font-bold flex items-center justify-center shrink-0 border border-black/[0.04] dark:border-white/[0.06] ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
