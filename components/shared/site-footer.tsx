import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="w-full bg-[#F4F4F0] dark:bg-[#1C1C1C] mt-16 py-10 px-6 sm:px-10 lg:px-14 xl:px-16 border-t border-black/[0.06] dark:border-white/[0.08] text-sm text-[#52525B] dark:text-[#A3A3A3]">
      <div className="w-full flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Link href="/" className="flex items-center hover:opacity-85 transition-opacity">
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
            </Link>
            <span className="text-sm">Attendance and fee management for tuition teachers.</span>
          </div>

          <nav aria-label="Legal" className="flex items-center gap-5 text-sm">
            <Link
              href="/privacy"
              className="hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-[#18181B] dark:hover:text-[#EDEDED] transition-colors"
            >
              Terms of Service
            </Link>
          </nav>
        </div>

        <div className="pt-5 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm">
          <span>
            Built &amp; designed by{" "}
            <a
              href="https://vinodjangid.site"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 text-[#18181B] dark:text-[#EDEDED] hover:opacity-75 transition-opacity font-medium"
            >
              Vinod Jangid
            </a>
          </span>
          <span>&copy; 2026 Scribadoo</span>
        </div>
      </div>
    </footer>
  );
}
