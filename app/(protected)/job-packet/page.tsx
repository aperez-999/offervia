import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

export default function JobPacketPage() {
  return (
    <AuthGuard>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Job Packet</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Turn one job description into a scan, a tailored resume, and a tracker entry.
            </p>
          </div>
          <div className="hidden sm:flex">
            <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-500">
              <Link href="/scanner">
                Start with a job scan <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <Card className="border-border bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              The fastest way to apply
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/80">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                <span className="font-medium text-foreground">Scan</span> the job description to surface keywords and gaps.
              </li>
              <li>
                <span className="font-medium text-foreground">Tailor</span> your resume output for ATS-friendly clarity.
              </li>
              <li>
                <span className="font-medium text-foreground">Track</span> the application so follow-ups don’t slip.
              </li>
            </ol>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline" className="border-border">
                <Link href="/scanner">Go to Scanner</Link>
              </Button>
              <Button asChild variant="outline" className="border-border">
                <Link href="/resume">Go to Resume Tailor</Link>
              </Button>
              <Button asChild variant="outline" className="border-border">
                <Link href="/tracker">Go to Tracker</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="sm:hidden">
          <Button asChild className="w-full bg-emerald-600 text-white hover:bg-emerald-500">
            <Link href="/scanner">
              Start with a job scan <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </AuthGuard>
  );
}

