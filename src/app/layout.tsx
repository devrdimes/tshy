import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlanWise AI — AI-Powered Business Planning Partner",
  description: "PlanWise AI guides entrepreneurs through a structured 10-step business planning process with AI-powered insights, task management, and financial projections.",
  keywords: ["business planning", "AI advisor", "startup", "entrepreneur", "SaaS", "financial projections"],
  authors: [{ name: "PlanWise AI" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "PlanWise AI",
    description: "AI-Powered Business Planning Partner",
    url: "https://planwise.ai",
    siteName: "PlanWise AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlanWise AI",
    description: "AI-Powered Business Planning Partner",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
