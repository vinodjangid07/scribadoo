import type { Metadata } from "next";
import { Geist, Plus_Jakarta_Sans } from "next/font/google";
import { UserProvider } from "@/context/user-context";
import { DashboardProvider } from "@/context/dashboard-context";
import { ThemeProvider } from "@/components/shared/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://scribadoo.vinodjangid.site"),
  title: {
    default: "Scribadoo — Tuition Attendance & Fee Management",
    template: "%s | Scribadoo",
  },
  description:
    "Manage tuition batches, mark daily attendance in seconds, track monthly fee ledgers, issue digital receipts, and send WhatsApp reminders to parents.",
  applicationName: "Scribadoo",
  keywords: [
    "tuition management app",
    "coaching class management software",
    "digital attendance register",
    "tuition fee tracker",
    "WhatsApp fee reminder",
    "student batch management",
    "Scribadoo",
  ],
  authors: [{ name: "Scribadoo" }],
  creator: "Scribadoo",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://scribadoo.vinodjangid.site",
    siteName: "Scribadoo",
    title: "Scribadoo — Attendance & Fee Management for Tuition Teachers",
    description:
      "Replace paper registers with Scribadoo. Manage student batches, take fast daily attendance, track monthly fees, and send WhatsApp reminders to parents.",
    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
        alt: "Scribadoo — Tuition Attendance & Fee Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scribadoo — Attendance & Fee Management for Tuition Teachers",
    description:
      "Manage tuition batches, daily attendance, monthly fee ledgers, and WhatsApp parent reminders in one clean register.",
    images: ["/og-image.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/dark-app-icon.webp",
    apple: "/dark-app-icon.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${geistSans.variable}`}
    >
      <body className="min-h-screen flex flex-col font-sans bg-[#FBFBF9] dark:bg-[#121212] text-[#18181B] dark:text-[#EDEDED] antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <DashboardProvider>
              {children}
            </DashboardProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
