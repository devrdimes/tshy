import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tashyeed — Structured Business Planning Platform",
  description: "Tashyeed guides entrepreneurs through a structured 10-step business planning process with expert frameworks, task management, financial projections, and milestone tracking.",
  keywords: ["business planning", "startup", "entrepreneur", "SaaS", "financial projections", "business strategy"],
  authors: [{ name: "Tashyeed" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Tashyeed",
    description: "Structure Your Vision. Build With Confidence.",
    url: "https://tashyeed.com",
    siteName: "Tashyeed",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tashyeed",
    description: "Structure Your Vision. Build With Confidence.",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
