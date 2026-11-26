import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StudentsView } from "@/components/students/students-view";
import { BatchItem, StudentItem } from "@/types/dashboard";

export const instant = false;

interface StudentsPageProps {
  searchParams: Promise<{
    batchId?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;
  const initialBatchId = params.batchId;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: batchesData } = await supabase
    .from("batches")
    .select("*")
    .order("name", { ascending: true });

  const initialBatches: BatchItem[] = (batchesData || []).map((b) => ({
    id: b.id,
    name: b.name,
    subject: b.subject,
    days: b.days,
    start_time: b.start_time,
    end_time: b.end_time,
    default_monthly_fee: Number(b.default_monthly_fee),
  }));

  const { data: studentsData } = await supabase
    .from("students")
    .select(`
      id,
      full_name,
      grade,
      parent_name,
      parent_phone,
      joined_date,
      notes,
      is_archived,
      batch_students (
        batch_id,
        custom_fee,
        batches (
          id,
          name,
          default_monthly_fee
        )
      )
    `)
    .order("full_name", { ascending: true });

  const initialStudents: StudentItem[] = (studentsData || []).map((s) => ({
    id: s.id,
    full_name: s.full_name,
    grade: s.grade,
    parent_name: s.parent_name,
    parent_phone: s.parent_phone,
    joined_date: s.joined_date,
    notes: s.notes,
    is_archived: s.is_archived,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    enrollments: (s.batch_students || []).map((bs: any) => ({
      batch_id: bs.batch_id,
      custom_fee: bs.custom_fee !== null ? Number(bs.custom_fee) : null,
      batch: bs.batches
        ? {
            id: bs.batches.id,
            name: bs.batches.name,
            default_monthly_fee: Number(bs.batches.default_monthly_fee),
          }
        : undefined,
    })),
  }));

  return (
    <DashboardShell>
      <StudentsView
        initialStudents={initialStudents}
        initialBatches={initialBatches}
        initialBatchId={initialBatchId}
      />
    </DashboardShell>
  );
}
