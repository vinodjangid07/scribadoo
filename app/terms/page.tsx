import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SiteFooter } from "@/components/shared/site-footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions for using Scribadoo to manage tuition batches, attendance, and monthly fee records.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] dark:bg-[#121212] text-[#18181B] dark:text-[#EDEDED]">
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

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="h-9 flex items-center gap-1.5 text-sm text-[#52525B] dark:text-[#A3A3A3] hover:text-[#18181B] dark:hover:text-[#EDEDED] font-medium px-3 rounded-xl hover:bg-[#F4F4F0] dark:hover:bg-[#262626] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to home</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
        <article className="flex flex-col gap-8">
          <header className="flex flex-col gap-3 pb-6 border-b border-black/[0.08] dark:border-white/[0.08]">
            <span className="text-xs font-mono uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
              Last updated: November 26, 2026
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">
              Terms of Service
            </h1>
            <p className="text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              By accessing or using Scribadoo, you agree to these Terms of Service. Please read them carefully before creating a teacher workspace.
            </p>
          </header>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold tracking-tight">
              1. Use of the Service
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              Scribadoo provides a digital register for tuition teachers, tutors, and coaching classes to organize batches, record daily attendance, track monthly fee payments, and prepare parent reminders. You may use the service only for lawful educational and administrative purposes.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold tracking-tight">
              2. Account &amp; Workspace Responsibility
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              You are responsible for maintaining the security of the Google account used to sign in to Scribadoo and for all records created inside your workspace. Please notify us promptly if you suspect any unauthorized access to your account.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold tracking-tight">
              3. Student &amp; Parent Data
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              When you add student profiles or parent phone numbers to Scribadoo, you confirm that you have the necessary permission from the parent, guardian, or institution to maintain those records and contact them regarding attendance and tuition fees.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold tracking-tight">
              4. Acceptable Use
            </h2>
            <ul className="list-disc pl-5 flex flex-col gap-2 text-sm sm:text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              <li>Do not attempt to access, probe, or disrupt workspaces belonging to other teachers.</li>
              <li>Do not use automated bots, scrapers, or abusive traffic against the application or database.</li>
              <li>Do not use WhatsApp reminder links to send spam or unsolicited commercial messages unrelated to your classes.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold tracking-tight">
              5. Financial Records &amp; Disclaimers
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              Scribadoo is a record-keeping and fee-tracking tool—it does not process payments, hold funds, or act as a payment gateway. You are responsible for verifying actual Cash, UPI, or bank transfers received and for any tax or accounting obligations applicable to your teaching practice.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold tracking-tight">
              6. Availability &amp; Updates
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              Scribadoo is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; We continuously improve the platform and may update features or these Terms from time to time. Continued use after an update constitutes acceptance of the revised Terms. For questions, contact us via{" "}
              <a
                href="https://vinodjangid.site"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 text-[#18181B] dark:text-[#EDEDED]"
              >
                vinodjangid.site
              </a>
              .
            </p>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
