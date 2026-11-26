import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FeesView } from "@/components/fees/fees-view";
import { getMonthlyFees } from "@/app/actions/fees";

export const instant = false;

interface FeesPageProps {
  searchParams: Promise<{
    month?: string;
  }>;
}

function getCurrentMonthString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default async function FeesPage({ searchParams }: FeesPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const selectedMonth = params?.month || getCurrentMonthString();

  const [feeData, batchesRes] = await Promise.all([
    getMonthlyFees(selectedMonth),
    supabase
      .from("batches")
      .select("id, name, subject, default_monthly_fee")
      .order("name", { ascending: true }),
  ]);

  const batches = (batchesRes.data || []).map((b) => ({
    id: b.id,
    name: b.name,
    subject: b.subject,
    default_monthly_fee: Number(b.default_monthly_fee),
  }));

  return (
    <DashboardShell>
      <FeesView
        initialMonth={selectedMonth}
        initialEntries={feeData.entries || []}
        initialSummary={feeData.summary}
        batches={batches}
      />
    </DashboardShell>
  );
}
