import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { Toaster } from "@/components/ui/sonner";
import { isClerkEnabled } from "@/lib/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VideoIntel — Video Intelligence Dashboard",
  description:
    "Upload a video and instantly surface its most stimulating moments with embedding-powered analysis and timeline insights.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const tree = (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>{children}</PostHogProvider>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );

  // Only mount ClerkProvider when keys exist; otherwise it throws at runtime.
  return isClerkEnabled ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
