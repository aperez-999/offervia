import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Account Access",
    template: "%s | Offervia",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
