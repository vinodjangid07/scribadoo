"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type {
  AttendanceStatus,
  BatchAttendanceEntry,
  StudentAttendanceSummary,
} from "@/types/dashboard";

export async function getBatchAttendance(batchId: string, date: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required.", entries: [], isRecorded: false };
  }

  const { data: enrollments, error: enrollError } = await supabase
    .from("batch_students")
    .select(`
      student_id,
      students (
        id,
        full_name,
        grade,
        parent_name,
        parent_phone,
        is_archived
      )
    `)
    .eq("batch_id", batchId);

  if (enrollError) {
    return { error: enrollError.message, entries: [], isRecorded: false };
  }

  const activeStudents = (enrollments || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e: any) => e.students)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((s: any) => s && !s.is_archived)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.full_name.localeCompare(b.full_name));

  const { data: existingRecords, error: recordError } = await supabase
    .from("attendance_records")
    .select("student_id, status, note")
    .eq("batch_id", batchId)
    .eq("date", date)
    .eq("teacher_id", user.id);

  if (recordError) {
    return { error: recordError.message, entries: [], isRecorded: false };
  }

  const recordMap = new Map<string, { status: AttendanceStatus; note: string | null }>();
  (existingRecords || []).forEach((r) => {
    recordMap.set(r.student_id, {
      status: r.status as AttendanceStatus,
      note: r.note || null,
    });
  });

  const isRecorded = (existingRecords && existingRecords.length > 0) || false;

  // Default to present if no record exists yet
  const entries: BatchAttendanceEntry[] = activeStudents.map((s) => {
    const record = recordMap.get(s.id);
    return {
      student_id: s.id,
      student_name: s.full_name,
      grade: s.grade,
      parent_name: s.parent_name,
      parent_phone: s.parent_phone,
      status: record ? record.status : "present",
      note: record ? record.note : null,
    };
  });

  return { entries, isRecorded };
}

export async function saveBatchAttendance({
  batchId,
  date,
  entries,
}: {
  batchId: string;
  date: string;
  entries: Array<{
    studentId: string;
    status: AttendanceStatus;
    note?: string | null;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  if (!batchId || !date) {
    return { error: "Batch and date are required." };
  }

  if (entries.length === 0) {
    return { error: "No students to record." };
  }

  const rowsToUpsert = entries.map((e) => ({
    teacher_id: user.id,
    batch_id: batchId,
    student_id: e.studentId,
    date,
    status: e.status,
    note: e.note?.trim() || null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("attendance_records").upsert(rowsToUpsert, {
    onConflict: "batch_id,student_id,date",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/attendance");
  revalidatePath("/batches");
  revalidatePath("/students");
  entries.forEach((e) => {
    revalidatePath(`/students/${e.studentId}`);
  });
  return { success: true, count: rowsToUpsert.length };
}

export async function getStudentAttendanceHistory(
  studentId: string
): Promise<{ error?: string; summary?: StudentAttendanceSummary }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const { data: records, error } = await supabase
    .from("attendance_records")
    .select(`
      id,
      date,
      status,
      note,
      batches (
        name
      )
    `)
    .eq("student_id", studentId)
    .eq("teacher_id", user.id)
    .order("date", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  const totalDays = records ? records.length : 0;
  const presentDays = (records || []).filter((r) => r.status === "present").length;
  const absentDays = (records || []).filter((r) => r.status === "absent").length;
  const lateDays = (records || []).filter((r) => r.status === "late").length;
  const holidayDays = (records || []).filter((r) => r.status === "holiday").length;

  const attendedDays = presentDays + lateDays;
  const totalCountableDays = totalDays - holidayDays;
  const attendancePercentage =
    totalCountableDays > 0 ? Math.round((attendedDays / totalCountableDays) * 100) : 100;

  const recentRecords = (records || []).slice(0, 30).map((r) => ({
    id: r.id,
    date: r.date,
    status: r.status as AttendanceStatus,
    note: r.note,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    batch_name: (r.batches as any)?.name || "Batch",
  }));

  return {
    summary: {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      holidayDays,
      attendancePercentage,
      recentRecords,
    },
  };
}
