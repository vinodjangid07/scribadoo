"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTheme } from "next-themes";
import { BarChart2, LineChart as LineChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import type { AttendanceDayPoint } from "@/types/dashboard";

interface AttendanceAnalyticsCardProps {
  points: AttendanceDayPoint[];
  allBatches: Array<{ id: string; name: string }>;
}

type TimeRangeOption = "7d" | "14d" | "30d";
type ChartTypeOption = "bar" | "area";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomChartTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  if (!data.hasSession) {
    return (
      <div className="p-2.5 rounded-xl border border-[#E4E4E7] dark:border-[#333333] bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] text-xs pointer-events-none">
        <div className="font-semibold">{data.fullDate}</div>
        <div className="text-xs opacity-75 mt-0.5">No class conducted / recorded</div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl border border-[#E4E4E7] dark:border-[#333333] bg-[#18181B] dark:bg-[#EDEDED] text-white dark:text-[#121212] text-xs pointer-events-none space-y-1">
      <div className="flex items-center justify-between gap-4 font-semibold">
        <span>{data.fullDate}</span>
        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/10 dark:bg-black/10">
          {data.rate}% Turnout
        </span>
      </div>
      <div className="text-xs opacity-80">{data.batchName}</div>
      <div className="text-xs opacity-90 font-mono pt-1 border-t border-white/10 dark:border-black/10 flex items-center gap-2">
        <span>{data.present} Present</span>
        <span>•</span>
        <span>{data.absent} Absent</span>
        {data.late > 0 && (
          <>
            <span>•</span>
            <span>{data.late} Late</span>
          </>
        )}
      </div>
    </div>
  );
}

export function AttendanceAnalyticsCard({
  points,
  allBatches,
}: AttendanceAnalyticsCardProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState<TimeRangeOption>("14d");
  const [chartType, setChartType] = useState<ChartTypeOption>("area");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  const batchFilteredPoints = useMemo(() => {
    if (selectedBatchId === "all") return points;
    return points.filter((p) => p.batchId === selectedBatchId);
  }, [points, selectedBatchId]);

  const chartData = useMemo(() => {
    const dayCount = range === "7d" ? 7 : range === "14d" ? 14 : 30;
    const now = new Date();
    const result = [];

    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString("en-IN", { month: "short" });
      const formattedDate = i === 0 ? "Today" : `${dayNum} ${monthShort}`;
      const fullDate = d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

      const matching = batchFilteredPoints.filter((p) => p.date === dateStr);

      if (matching.length > 0) {
        const totalPresent = matching.reduce((sum, p) => sum + p.present, 0);
        const totalAbsent = matching.reduce((sum, p) => sum + p.absent, 0);
        const totalLate = matching.reduce((sum, p) => sum + p.late, 0);
        const totalHoliday = matching.reduce((sum, p) => sum + p.holiday, 0);
        const totalActive = totalPresent + totalAbsent + totalLate;
        const rate =
          totalActive > 0
            ? Math.round(((totalPresent + totalLate) / totalActive) * 100)
            : totalHoliday > 0
            ? 100
            : 0;

        const batchNames = Array.from(new Set(matching.map((p) => p.batchName))).join(
          ", "
        );

        result.push({
          date: dateStr,
          formattedDate,
          fullDate,
          hasSession: true,
          present: totalPresent,
          absent: totalAbsent,
          late: totalLate,
          holiday: totalHoliday,
          total: totalActive,
          rate,
          batchName: batchNames,
          isToday: i === 0,
        });
      } else {
        result.push({
          date: dateStr,
          formattedDate,
          fullDate,
          hasSession: false,
          present: 0,
          absent: 0,
          late: 0,
          holiday: 0,
          total: 0,
          rate: 0,
          batchName: "",
          isToday: i === 0,
        });
      }
    }

    return result;
  }, [batchFilteredPoints, range]);

  const summary = useMemo(() => {
    const activeSessions = chartData.filter((d) => d.hasSession && d.total > 0);
    if (activeSessions.length === 0) {
      return { avgRate: 100, sessionCount: 0, peakPresent: 0 };
    }

    const totalRate = activeSessions.reduce((sum, d) => sum + d.rate, 0);
    const peak = Math.max(...activeSessions.map((d) => d.present + d.late));

    return {
      avgRate: Math.round(totalRate / activeSessions.length),
      sessionCount: activeSessions.length,
      peakPresent: peak,
    };
  }, [chartData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomTick = (props: any) => {
    const { x, y, payload } = props;
    const item = chartData[payload.index];
    if (!item) return null;
    const isToday = item.isToday;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={12}
          textAnchor="middle"
          fontSize={10}
          fontFamily="monospace"
          fontWeight={isToday ? 700 : 500}
          fill={
            isToday
              ? isDark
                ? "#EDEDED"
                : "#18181B"
              : isDark
              ? "#A1A1AA"
              : "#71717A"
          }
        >
          {isToday ? "Today" : item.formattedDate.split(" ")[0]}
        </text>
      </g>
    );
  };

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED]">
            Attendance Trends &amp; Turnout
          </h2>
          <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
            {range === "7d" ? "7d" : range === "14d" ? "14d" : "30d"}
          </span>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-2 w-full lg:w-auto overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 lg:flex-initial">
            <div className="flex items-center p-0.5 rounded-lg bg-[#F4F4F0] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] shrink-0">
              <button
                onClick={() => setChartType("bar")}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  chartType === "bar"
                    ? "bg-[#FFFFFF] dark:bg-[#1C1C1C] text-[#18181B] dark:text-[#EDEDED] font-semibold"
                    : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                }`}
                title="Bar Chart"
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setChartType("area")}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  chartType === "area"
                    ? "bg-[#FFFFFF] dark:bg-[#1C1C1C] text-[#18181B] dark:text-[#EDEDED] font-semibold"
                    : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                }`}
                title="Area Curve Chart"
              >
                <LineChartIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.12] text-xs font-medium text-[#18181B] dark:text-[#EDEDED] focus:outline-none min-w-0 flex-1 lg:w-auto truncate cursor-pointer"
            >
              <option value="all">All Batches</option>
              {allBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center p-0.5 rounded-lg bg-[#F4F4F0] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] shrink-0">
            {(
              [
                { id: "7d", label: "7D" },
                { id: "14d", label: "14D" },
                { id: "30d", label: "30D" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setRange(opt.id)}
                className={`h-7 px-2 sm:px-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  range === opt.id
                    ? "bg-[#FFFFFF] dark:bg-[#1C1C1C] text-[#18181B] dark:text-[#EDEDED] font-semibold"
                    : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDED]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="p-3 rounded-xl bg-[#FAFAF9] dark:bg-[#181818] border border-black/[0.04] dark:border-white/[0.06]">
          <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Avg Attendance
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-[#18181B] dark:text-[#EDEDED] mt-0.5 truncate">
            {summary.avgRate}%
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#FAFAF9] dark:bg-[#181818] border border-black/[0.04] dark:border-white/[0.06]">
          <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Classes Conducted
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-[#18181B] dark:text-[#EDEDED] mt-0.5 truncate">
            {summary.sessionCount}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#FAFAF9] dark:bg-[#181818] border border-black/[0.04] dark:border-white/[0.06]">
          <div className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Peak Turnout
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-[#18181B] dark:text-[#EDEDED] mt-0.5 truncate">
            {summary.peakPresent}{" "}
            <span className="text-xs font-normal font-sans text-[#71717A] dark:text-[#A1A1AA]">
              students
            </span>
          </div>
        </div>
      </div>

      <div className="h-44 w-full pt-2">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart
                data={chartData}
                barCategoryGap="20%"
                margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? "#2A2A2A" : "#E5E5E0"}
                />
                <XAxis
                  dataKey="formattedDate"
                  tickLine={false}
                  axisLine={false}
                  tick={renderCustomTick}
                  interval={range === "30d" ? 3 : range === "14d" ? 1 : 0}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 10,
                    fill: isDark ? "#A3A3A3" : "#52525B",
                    fontFamily: "monospace",
                  }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={<CustomChartTooltip />}
                  cursor={{ fill: isDark ? "#26262650" : "#EDEDEA80" }}
                />
                <Bar
                  dataKey="rate"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={700}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => {
                    const fillColor = !entry.hasSession
                      ? isDark
                        ? "#2A2A2A"
                        : "#E5E5E0"
                      : isDark
                      ? "#EDEDED"
                      : "#18181B";

                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? "#2A2A2A" : "#E5E5E0"}
                />
                <XAxis
                  dataKey="formattedDate"
                  tickLine={false}
                  axisLine={false}
                  tick={renderCustomTick}
                  interval={range === "30d" ? 3 : range === "14d" ? 1 : 0}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 10,
                    fill: isDark ? "#A3A3A3" : "#52525B",
                    fontFamily: "monospace",
                  }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke={isDark ? "#EDEDED" : "#18181B"}
                  strokeWidth={2}
                  fillOpacity={0.08}
                  fill={isDark ? "#EDEDED" : "#18181B"}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[#52525B] dark:text-[#A3A3A3]">
            Loading chart...
          </div>
        )}
      </div>
    </div>
  );
}
