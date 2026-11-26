import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { BatchesView } from "@/components/batches/batches-view";
import { BatchItem } from "@/types/dashboard";

export const instant = false;

export default async function BatchesPage() {
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
    .order("created_at", { ascending: false });

  const initialBatches: BatchItem[] = (batchesData || []).map((b) => ({
    id: b.id,
    name: b.name,
    subject: b.subject,
    days: b.days,
    start_time: b.start_time,
    end_time: b.end_time,
    default_monthly_fee: Number(b.default_monthly_fee),
    student_count: b.batch_students?.[0]?.count || 0,
  }));

  return (
    <DashboardShell>
      <BatchesView initialBatches={initialBatches} />
    </DashboardShell>
  );
}
