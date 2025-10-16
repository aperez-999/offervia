"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/login");
    });
  }, [router]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Intro */}
        <section>
          <h1 className="text-2xl font-semibold text-foreground">Welcome back 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ready to make progress toward your next offer?
          </p>
        </section>

        {/* Quick actions */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
              <CardDescription>Jump right in.</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/resume" className="block">
                  <Card className="h-full transition-colors hover:bg-foreground/[0.05]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-foreground">
                        Tailor Resume
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-muted-foreground">
                      Customize your resume for a specific role.
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/scanner" className="block">
                  <Card className="h-full transition-colors hover:bg-foreground/[0.05]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-foreground">
                        Scan Job Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-muted-foreground">
                      Extract keywords and gaps from a job posting.
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/tracker" className="block">
                  <Card className="h-full transition-colors hover:bg-foreground/[0.05]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-foreground">
                        Track Applications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-muted-foreground">
                      Keep tabs on every application you send.
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Not sure where to start?</CardTitle>
              <CardDescription>
                Try tailoring a resume or scanning a job description to find missing
                keywords.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/resume">
                <Button
                  className="bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                >
                  Tailor Resume
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}