import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { SiteNav } from "@/components/site-nav";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memory Conflict Inspector",
  description: "A hygiene view for AI agent memory: find, explain and fix contradictory memories before your agent recalls them.",
};

export const viewport: Viewport = { themeColor: "#0a0a0c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{ ["--font-sans" as string]: "var(--font-geist-sans)", ["--font-mono" as string]: "var(--font-geist-mono)" }}
    >
      <body className="min-h-screen font-sans">
        <ThemeProvider>
          <SiteNav />
          <main>{children}</main>
          <Toaster theme="dark" position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
