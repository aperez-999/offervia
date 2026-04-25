import { notFound } from "next/navigation";

import SentryTestPanel from "@/components/dev/SentryTestPanel";

export default function SentryTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <SentryTestPanel />;
}
