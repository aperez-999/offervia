import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster, ToastProvider } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { publicEnv } from "@/lib/env/public";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Offervia - AI Career Suite",
    template: "%s | Offervia",
  },
  description:
    "Offervia helps job seekers scan roles, tailor resumes, prepare for interviews, and track applications in one workflow.",
  openGraph: {
    title: "Offervia - AI Career Suite",
    description:
      "Offervia helps job seekers scan roles, tailor resumes, prepare for interviews, and track applications in one workflow.",
    siteName: "Offervia",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Offervia" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Offervia - AI Career Suite",
    description:
      "Offervia helps job seekers scan roles, tailor resumes, prepare for interviews, and track applications in one workflow.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ToastProvider>
            {children}
            <Toaster />
          </ToastProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
