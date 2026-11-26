import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getExecutiveDashboardData } from "@/app/actions/dashboard";

export const instant = false;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const res = await getExecutiveDashboardData();

  if (res.error || !res.data) {
    return (
      <DashboardShell>
        <div className="p-8 text-center text-xs text-red-500">
          Failed to load dashboard: {res.error || "Unknown error."}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardView initialData={res.data} />
    </DashboardShell>
  );
}
