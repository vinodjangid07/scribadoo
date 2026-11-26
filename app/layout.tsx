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
  title: "Scribadoo - Tuition Attendance & Fee Management",
  description: "Simple, fast attendance and fee management for tuition teachers",
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
