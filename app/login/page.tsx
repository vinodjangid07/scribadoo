import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { LoginForm } from "./login-form";
import { PageLoadingFallback } from "@/components/shared/loading-spinner";

async function LoginContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/batches");
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#FBFBF9] dark:bg-[#121212] transition-colors">
      <LoginForm />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <LoginContent />
    </Suspense>
  );
}
