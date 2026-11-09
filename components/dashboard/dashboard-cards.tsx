"use client";

import { Badge } from "@/components/ui/badge";

export type DashboardApplicationStatus = "Applied" | "Interviewing" | "Offer" | "Rejected";

export function StatusBadge({ status }: { status: DashboardApplicationStatus }) {
  if (status === "Interviewing") {
    return <Badge variant="interviewing">{status}</Badge>;
  }
  if (status === "Offer") {
    return <Badge variant="offer">{status}</Badge>;
  }
  if (status === "Rejected") {
    return <Badge variant="rejected">{status}</Badge>;
  }
  return <Badge variant="applied">{status}</Badge>;
}
