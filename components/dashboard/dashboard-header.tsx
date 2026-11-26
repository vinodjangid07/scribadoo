"use client";

import React, { useState, useEffect } from "react";
import { Plus, Megaphone, CheckSquare } from "lucide-react";

interface DashboardHeaderProps {
  teacherName: string;
  todayFormatted: string;
  onOpenQuickRollCall: () => void;
  onOpenBroadcastNotice: () => void;
  onOpenQuickCollect: () => void;
}

export function DashboardHeader({
  teacherName,
  todayFormatted,
  onOpenQuickRollCall,
  onOpenBroadcastNotice,
  onOpenQuickCollect,
}: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState("Good day");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const firstName = teacherName.split(" ")[0] || "Teacher";

  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-2">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B] dark:text-[#EDEDED]">
          {greeting}, {firstName}!
        </h1>
        <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA]">
          {todayFormatted}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <button
          onClick={onOpenQuickCollect}
          className="h-9 px-3.5 rounded-xl bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] hover:bg-[#27272A] dark:hover:bg-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Quick Collect</span>
        </button>

        <button
          onClick={onOpenQuickRollCall}
          className="h-9 px-3.5 rounded-xl bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] cursor-pointer"
        >
          <CheckSquare className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
          <span>Roll Call</span>
        </button>

        <button
          onClick={onOpenBroadcastNotice}
          className="h-9 px-3.5 rounded-xl bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12] hover:bg-[#F4F4F0] dark:hover:bg-[#262626] text-[#18181B] dark:text-[#EDEDED] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] cursor-pointer"
        >
          <Megaphone className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
          <span>Broadcast</span>
        </button>
      </div>
    </div>
  );
}
