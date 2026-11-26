import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AttendanceView } from "@/components/attendance/attendance-view";
import { getBatchAttendance } from "@/app/actions/attendance";
import type { BatchItem, BatchAttendanceEntry } from "@/types/dashboard";

export const instant = false;

interface AttendancePageProps {
  searchParams: Promise<{
    batchId?: string;
    date?: string;
  }>;
}

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: batchesData } = await supabase
    .from("batches")
    .select("*, batch_students(count)")
    .order("name", { ascending: true });

  const batches: BatchItem[] = (batchesData || []).map((b) => ({
    id: b.id,
    name: b.name,
    subject: b.subject,
    days: b.days,
    start_time: b.start_time,
    end_time: b.end_time,
    default_monthly_fee: Number(b.default_monthly_fee),
    student_count: b.batch_students?.[0]?.count || 0,
  }));

  const initialBatchId = params?.batchId || batches[0]?.id || "";
  const initialDate = params?.date || getTodayString();

  let initialEntries: BatchAttendanceEntry[] = [];
  let initialIsRecorded = false;

  if (initialBatchId) {
    const res = await getBatchAttendance(initialBatchId, initialDate);
    if (res?.entries) {
      initialEntries = res.entries;
      initialIsRecorded = res.isRecorded;
    }
  }

  return (
    <DashboardShell>
      <AttendanceView
        initialBatches={batches}
        initialBatchId={initialBatchId}
        initialDate={initialDate}
        initialEntries={initialEntries}
        initialIsRecorded={initialIsRecorded}
      />
    </DashboardShell>
  );
}
