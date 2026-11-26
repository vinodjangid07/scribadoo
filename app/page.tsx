import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { SmoothScrollProvider } from "@/components/landing/smooth-scroll-provider";
import { LandingMotionSections } from "@/components/landing/landing-motion-sections";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export const instant = false;

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const teacherName = user
    ? user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Teacher"
    : null;

  const initials = teacherName
    ? teacherName
        .split(" ")
        .map((w: string) => w[0])
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "TT";

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen flex flex-col bg-[#FBFBF9] dark:bg-[#121212] text-[#18181B] dark:text-[#EDEDED] selection:bg-black/10 dark:selection:bg-white/10 transition-colors duration-150">
        {/* Navigation */}
        <header className="w-full sticky top-0 z-40 bg-[#FBFBF9] dark:bg-[#121212] border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 py-3.5 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center hover:opacity-85 transition-opacity py-0.5"
            >
              <Image
                src="/dark-logo.webp"
                alt="Scribadoo"
                width={130}
                height={28}
                priority
                className="block dark:hidden h-7 w-auto object-contain"
              />
              <Image
                src="/light-logo.webp"
                alt="Scribadoo"
                width={130}
                height={28}
                priority
                className="hidden dark:block h-7 w-auto object-contain"
              />
            </Link>

            {/* Auth actions and theme toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="h-9 pl-1 pr-3 rounded-xl bg-[#F4F4F0] dark:bg-[#1C1C1C] hover:bg-[#EDEDEA] dark:hover:bg-[#262626] border border-black/[0.08] dark:border-white/[0.12] flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
                    title="Go to command center"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#18181B] dark:bg-[#EDEDED] text-[#FBFBF9] dark:text-[#121212] flex items-center justify-center text-sm font-bold shrink-0">
                      {initials}
                    </div>
                    <span className="text-sm font-semibold text-[#18181B] dark:text-[#EDEDED] max-w-[120px] sm:max-w-[160px] truncate">
                      {teacherName}
                    </span>
                  </Link>

                  <Link
                    href="/dashboard"
                    className="h-9 flex items-center bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-[#FAFAFA] text-[#FBFBF9] dark:text-[#121212] text-sm font-semibold px-3.5 sm:px-4 rounded-xl transition-colors"
                  >
                    <span className="roll">
                      <span>Open dashboard</span>
                      <span aria-hidden="true">Open dashboard</span>
                    </span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="h-9 flex items-center text-sm text-[#52525B] dark:text-[#A3A3A3] hover:text-[#18181B] dark:hover:text-[#EDEDED] font-medium px-2.5 sm:px-3 rounded-xl hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors"
                  >
                    <span className="roll">
                      <span>Sign in</span>
                      <span aria-hidden="true">Sign in</span>
                    </span>
                  </Link>
                  <Link
                    href="/login"
                    className="h-9 flex items-center bg-[#18181B] dark:bg-[#EDEDED] hover:bg-[#27272A] dark:hover:bg-[#FAFAFA] text-[#FBFBF9] dark:text-[#121212] text-sm font-semibold px-3.5 sm:px-4 rounded-xl transition-colors"
                  >
                    <span className="roll">
                      <span>Create teacher account</span>
                      <span aria-hidden="true">Create teacher account</span>
                    </span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero and feature sections */}
        <main className="flex-1 w-full px-6 sm:px-10 lg:px-14 xl:px-16 py-6 sm:py-10">
          <LandingMotionSections isAuthenticated={Boolean(user)} />
        </main>

        {/* Footer */}
        <footer className="w-full bg-[#F4F4F0] dark:bg-[#1C1C1C] mt-16 py-10 px-6 sm:px-10 lg:px-14 xl:px-16 border-t border-black/[0.06] dark:border-white/[0.08] text-sm text-[#52525B] dark:text-[#A3A3A3]">
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <Image
                src="/dark-logo.webp"
                alt="Scribadoo"
                width={105}
                height={22}
                className="block dark:hidden h-5 w-auto object-contain opacity-85"
              />
              <Image
                src="/light-logo.webp"
                alt="Scribadoo"
                width={105}
                height={22}
                className="hidden dark:block h-5 w-auto object-contain opacity-85"
              />
            </div>
            <span className="text-sm">A faster register for tuition teachers.</span>
            <span className="text-sm">&copy; {new Date().getFullYear()} Scribadoo</span>
          </div>
        </footer>
      </div>
    </SmoothScrollProvider>
  );
}
