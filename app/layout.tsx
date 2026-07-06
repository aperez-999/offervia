import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster, ToastProvider } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import {
  SITE_DEFAULT_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SHARE_IMAGE_ALT,
  getSiteUrl,
} from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: SITE_NAME,
  title: {
    default: SITE_DEFAULT_TITLE,
    template: "%s | Offervia",
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: getSiteUrl(),
  },
  openGraph: {
    title: SITE_DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    url: getSiteUrl(),
    siteName: SITE_NAME,
    images: [{ url: "/og-image.png", width: 1774, height: 887, alt: SITE_SHARE_IMAGE_ALT }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  icons: {
    shortcut: ["/favicon.ico"],
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-64.png", type: "image/png", sizes: "64x64" },
      { url: "/icon-256.png", type: "image/png", sizes: "256x256" },
      { url: "/offervia-icon-square.png", type: "image/png", sizes: "694x694" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "512x512", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased bg-background text-foreground`}>
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
