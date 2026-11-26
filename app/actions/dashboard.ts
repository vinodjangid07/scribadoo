"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getMonthlyFees } from "./fees";
import type {
  ExecutiveDashboardData,
  TodayBatchSchedule,
  OverdueStudentItem,
  OverdueSummaryAlert,
  AttendanceRiskStudent,
  AttendanceDayPoint,
  AttendanceAnalyticsData,
  TodayCollectionSummary,
  AttendanceStatus,
} from "@/types/dashboard";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function getExecutiveDashboardData(): Promise<{
  data?: ExecutiveDashboardData;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const todayStr = getTodayString();
  const currentMonth = getCurrentMonthString();
  const todayDayIndex = new Date().getDay();
  const todayWeekday = WEEKDAYS[todayDayIndex];

  const { data: batchesData, error: batchesError } = await supabase
    .from("batches")
    .select("*, batch_students(count)")
    .eq("teacher_id", user.id)
    .order("name", { ascending: true });

  if (batchesError) {
    return { error: batchesError.message };
  }

  const allBatches = batchesData || [];

  const allBatchesList = allBatches.map((b) => ({
    id: b.id,
    name: b.name,
    studentCount: b.batch_students?.[0]?.count || 0,
  }));

  const todayBatchCandidates = allBatches.filter((b) => {
    if (!b.days || !Array.isArray(b.days)) return false;
    return b.days.some((d: string) =>
      d.toLowerCase().startsWith(todayWeekday.toLowerCase())
    );
  });

  const candidateBatchIds = todayBatchCandidates.map((b) => b.id);
  const attendanceMap = new Map<
    string,
    { present: number; absent: number; late: number; holiday: number }
  >();

  if (candidateBatchIds.length > 0) {
    const { data: attendanceData } = await supabase
      .from("attendance_records")
      .select("batch_id, status")
      .in("batch_id", candidateBatchIds)
      .eq("date", todayStr);

    if (attendanceData) {
      attendanceData.forEach((rec) => {
        const stats = attendanceMap.get(rec.batch_id) || {
          present: 0,
          absent: 0,
          late: 0,
          holiday: 0,
        };
        if (rec.status === "present") stats.present++;
        else if (rec.status === "absent") stats.absent++;
        else if (rec.status === "late") stats.late++;
        else if (rec.status === "holiday") stats.holiday++;
        attendanceMap.set(rec.batch_id, stats);
      });
    }
  }

  const todayBatches: TodayBatchSchedule[] = todayBatchCandidates.map((b) => {
    const studentCount = b.batch_students?.[0]?.count || 0;
    const stats = attendanceMap.get(b.id);
    const isRecordedToday = Boolean(
      stats && stats.present + stats.absent + stats.late + stats.holiday > 0
    );

    return {
      id: b.id,
      name: b.name,
      subject: b.subject,
      startTime: b.start_time,
      endTime: b.end_time,
      studentCount,
      isRecordedToday,
      attendanceStats: stats,
    };
  });

  const { data: todayPayments } = await supabase
    .from("payment_transactions")
    .select("amount, payment_method")
    .eq("teacher_id", user.id)
    .eq("payment_date", todayStr);

  const todayCollections: TodayCollectionSummary = {
    totalToday: 0,
    cashToday: 0,
    upiToday: 0,
    transactionsCount: 0,
  };

  if (todayPayments && todayPayments.length > 0) {
    todayCollections.transactionsCount = todayPayments.length;
    todayPayments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      todayCollections.totalToday += amt;
      if (p.payment_method === "cash") {
        todayCollections.cashToday += amt;
      } else if (p.payment_method === "upi") {
        todayCollections.upiToday += amt;
      }
    });
  }

  const feeRes = await getMonthlyFees(currentMonth);
  const feeEntries = feeRes.entries || [];
  const feeSummary = feeRes.summary || {
    totalBilled: 0,
    totalCollected: 0,
    totalPending: 0,
    totalStudents: 0,
    paidCount: 0,
    pendingCount: 0,
    partiallyPaidCount: 0,
  };

  const clearanceRate =
    feeSummary.totalBilled > 0
      ? Math.round((feeSummary.totalCollected / feeSummary.totalBilled) * 100)
      : 0;

  const overdueStudents: OverdueStudentItem[] = feeEntries
    .filter((e) => e.balance_remaining > 0)
    .sort((a, b) => b.balance_remaining - a.balance_remaining)
    .map((e) => ({
      studentId: e.student_id,
      studentName: e.student_name,
      grade: e.grade,
      parentName: e.parent_name,
      parentPhone: e.parent_phone,
      enrolledBatchNames: e.enrolled_batches.map((b) => b.batch_name),
      month: e.month,
      balanceRemaining: e.balance_remaining,
      amountDue: e.amount_due,
      feeRecordId: e.fee_record_id,
    }));

  // Detect students with 2 or more consecutive absences
  const consecutiveAbsences: AttendanceRiskStudent[] = [];
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const { data: recentAttendance } = await supabase
      .from("attendance_records")
      .select(`
        student_id,
        date,
        status,
        batches (name),
        students (id, full_name, grade, parent_name, parent_phone, is_archived)
      `)
      .eq("teacher_id", user.id)
      .gte("date", thirtyDaysAgoStr)
      .order("date", { ascending: false });

    if (recentAttendance && recentAttendance.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const studentHistory = new Map<string, any[]>();
      recentAttendance.forEach((rec) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const student = (rec as any).students;
        if (!student || student.is_archived) return;

        const list = studentHistory.get(rec.student_id) || [];
        list.push(rec);
        studentHistory.set(rec.student_id, list);
      });

      studentHistory.forEach((records, studentId) => {
        const recentSubset = records.slice(0, 3);
        if (recentSubset.length >= 2) {
          let consecutiveCount = 0;
          for (const r of recentSubset) {
            if (r.status === "absent") {
              consecutiveCount++;
            } else {
              break;
            }
          }

          if (consecutiveCount >= 2) {
            const first = recentSubset[0];
            const student = first.students;
            const batchName = first.batches?.name || "Batch";

            consecutiveAbsences.push({
              studentId,
              studentName: student.full_name,
              grade: student.grade,
              parentName: student.parent_name,
              parentPhone: student.parent_phone,
              batchName,
              consecutiveAbsences: consecutiveCount,
              lastAbsentDate: first.date,
            });
          }
        }
      });
    }
  } catch (err) {
    console.error("Error detecting attendance risk:", err);
  }

  const unrecordedTodayBatches = todayBatches.filter((b) => !b.isRecordedToday);

  // Overdue alert triggers after the 10th of the month
  const todayDay = new Date().getDate();
  const isPastDueGracePeriod = todayDay > 10;
  let overdueSummary: OverdueSummaryAlert | null = null;

  if (isPastDueGracePeriod && overdueStudents.length > 0) {
    const dueDate = new Date();
    dueDate.setDate(5);
    const daysOverdue = Math.max(
      1,
      Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const totalPendingAmount = overdueStudents.reduce(
      (sum, s) => sum + s.balanceRemaining,
      0
    );

    overdueSummary = {
      overdueCount: overdueStudents.length,
      totalPendingAmount,
      month: currentMonth,
      daysOverdue,
    };
  }

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split("T")[0];

  const { data: attendanceHistory } = await supabase
    .from("attendance_records")
    .select(`
      date,
      batch_id,
      status,
      batches (name)
    `)
    .eq("teacher_id", user.id)
    .gte("date", sixtyDaysAgoStr)
    .order("date", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dayBatchMap = new Map<string, any>();
  let totalAllPresent = 0;
  let totalAllStudents = 0;

  if (attendanceHistory) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attendanceHistory.forEach((rec: any) => {
      const key = `${rec.date}__${rec.batch_id}`;
      const entry = dayBatchMap.get(key) || {
        date: rec.date,
        batchId: rec.batch_id,
        batchName: rec.batches?.name || "Batch",
        present: 0,
        absent: 0,
        late: 0,
        holiday: 0,
      };

      if (rec.status === "present") entry.present++;
      else if (rec.status === "absent") entry.absent++;
      else if (rec.status === "late") entry.late++;
      else if (rec.status === "holiday") entry.holiday++;

      dayBatchMap.set(key, entry);
    });
  }

  const attendancePoints: AttendanceDayPoint[] = Array.from(dayBatchMap.values()).map(
    (e) => {
      const activeTotal = e.present + e.absent + e.late;
      const rate =
        activeTotal > 0
          ? Math.round(((e.present + e.late) / activeTotal) * 100)
          : e.holiday > 0
          ? 100
          : 0;

      totalAllPresent += e.present + e.late;
      totalAllStudents += activeTotal;

      return {
        date: e.date,
        batchId: e.batchId,
        batchName: e.batchName,
        present: e.present,
        absent: e.absent,
        late: e.late,
        holiday: e.holiday,
        total: activeTotal,
        rate,
      };
    }
  );

  const overallRate =
    totalAllStudents > 0
      ? Math.round((totalAllPresent / totalAllStudents) * 100)
      : 100;

  const attendanceAnalytics: AttendanceAnalyticsData = {
    points: attendancePoints,
    overallRate,
    totalSessions: attendancePoints.length,
  };

  const batchSummaries = allBatches.map((b) => {
    const studentCount = b.batch_students?.[0]?.count || 0;
    const monthlyFee = Number(b.default_monthly_fee || 0);
    return {
      id: b.id,
      name: b.name,
      subject: b.subject,
      studentCount,
      monthlyPotential: studentCount * monthlyFee,
    };
  });

  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return {
    data: {
      todayFormatted,
      todayBatches,
      allBatchesList,
      actionQueue: {
        consecutiveAbsences,
        unrecordedTodayBatches,
        overdueSummary,
      },
      todayCollections,
      financials: {
        month: currentMonth,
        totalBilled: feeSummary.totalBilled,
        totalCollected: feeSummary.totalCollected,
        totalPending: feeSummary.totalPending,
        clearanceRate,
        totalStudents: feeSummary.totalStudents,
        paidStudentsCount: feeSummary.paidCount,
        pendingStudentsCount:
          feeSummary.pendingCount + feeSummary.partiallyPaidCount,
      },
      overdueStudents,
      attendanceAnalytics,
      batchSummaries,
    },
  };
}

export async function markBatchAllPresentToday(batchId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const todayStr = getTodayString();

  const { data: enrollments, error: enrollError } = await supabase
    .from("batch_students")
    .select(`
      student_id,
      students (id, is_archived)
    `)
    .eq("batch_id", batchId);

  if (enrollError) {
    return { error: enrollError.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeStudentIds = (enrollments || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e: any) => e.students)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((s: any) => s && !s.is_archived)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => s.id);

  if (activeStudentIds.length === 0) {
    return { error: "No active students enrolled in this batch." };
  }

  const rowsToUpsert = activeStudentIds.map((studentId: string) => ({
    teacher_id: user.id,
    batch_id: batchId,
    student_id: studentId,
    date: todayStr,
    status: "present" as AttendanceStatus,
    updated_at: new Date().toISOString(),
  }));

  const { error: upsertError } = await supabase
    .from("attendance_records")
    .upsert(rowsToUpsert, { onConflict: "batch_id,student_id,date" });

  if (upsertError) {
    return { error: upsertError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  return { success: true };
}
