import type { Metadata } from "next";
import JobPacketClient from "./JobPacketClient";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Job Packet",
  description: "Move from a pasted job description to scan insights, a tailored resume, and a tracked application in one guided flow.",
  path: "/job-packet",
  index: false,
});

export default function JobPacketPage() {
  return <JobPacketClient />;
}
