import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SiteFooter } from "@/components/shared/site-footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Scribadoo collects, stores, and protects teacher, student, attendance, and fee records.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              Scribadoo is built for independent tuition teachers and coaching classes. This policy explains what data we collect, how it is stored, and how your class records remain private to your workspace.
            </p>
          </header>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold tracking-tight">
              1. Information We Collect
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              We collect only the information needed to run your digital tuition register:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-2 text-sm sm:text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              <li>
                <strong className="text-[#18181B] dark:text-[#EDEDED]">Account details:</strong> When you sign in with Google, we receive your name, email address, and profile avatar to create and identify your teacher workspace.
              </li>
              <li>
                <strong className="text-[#18181B] dark:text-[#EDEDED]">Class &amp; student records:</strong> Information you choose to enter, including batch names, schedules, student names, grades, parent names, parent phone numbers, attendance statuses, notes, fee cycles, and payment receipts.
              </li>
              <li>
                <strong className="text-[#18181B] dark:text-[#EDEDED]">Session cookies:</strong> Strictly necessary authentication cookies used to keep you signed in securely across page loads.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold tracking-tight">
              2. How We Use Your Data
            </h2>
            <ul className="list-disc pl-5 flex flex-col gap-2 text-sm sm:text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              <li>To display and manage your batches, daily attendance roll calls, and student profiles.</li>
              <li>To automatically calculate monthly fee ledgers, custom sibling/fee overrides, and numbered payment receipts.</li>
              <li>To pre-fill WhatsApp message drafts when you explicitly click a reminder or absence notification button. Scribadoo never sends automated messages on your behalf.</li>
            </ul>
            <p className="text-sm sm:text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              We do not sell, rent, or share your student or parent contact data with advertisers, data brokers, or third parties for marketing.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold tracking-tight">
              3. Data Isolation &amp; Security
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              Your workspace data is stored in PostgreSQL via Supabase and protected by Row Level Security (RLS) policies. Every query is scoped to your authenticated teacher account so other users cannot view or modify your batches, students, attendance logs, or fee ledgers.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold tracking-tight">
              4. Third-Party Infrastructure
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              Scribadoo relies on trusted infrastructure providers to operate:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-2 text-sm sm:text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              <li><strong className="text-[#18181B] dark:text-[#EDEDED]">Supabase:</strong> Authentication and encrypted database storage.</li>
              <li><strong className="text-[#18181B] dark:text-[#EDEDED]">Google OAuth:</strong> Secure sign-in without storing separate passwords.</li>
              <li><strong className="text-[#18181B] dark:text-[#EDEDED]">Netlify:</strong> Application hosting and edge delivery.</li>
              <li><strong className="text-[#18181B] dark:text-[#EDEDED]">WhatsApp:</strong> Opened via standard links only when you initiate a message from your device.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold tracking-tight">
              5. Your Control &amp; Data Deletion
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
              You own the records you enter into Scribadoo. You can edit, archive, or permanently delete students, batches, and fee entries directly inside your dashboard at any time. To request full deletion of your account and associated workspace data, please reach out via the contact details on{" "}
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
