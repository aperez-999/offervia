import type { Metadata } from "next";
import JobPacketClient from "./JobPacketClient";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Job Packet",
  description: "Paste a job description, scan it, tailor your resume, and add the job to your tracker.",
  path: "/job-packet",
  index: false,
});

export default function JobPacketPage() {
  return <JobPacketClient />;
}
