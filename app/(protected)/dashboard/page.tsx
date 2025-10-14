"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
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
        <section>
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back 👋</h1>
          <p className="text-sm text-gray-600 mt-1">Ready to make progress toward your next offer?</p>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800">Quick Actions</CardTitle>
              <CardDescription>Jump right in.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/resume" className="block">
                  <Card className="h-full hover:bg-gray-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-gray-800">Tailor Resume</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-gray-600">
                      Customize your resume for a specific role.
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/scanner" className="block">
                  <Card className="h-full hover:bg-gray-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-gray-800">Scan Job Description</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-gray-600">
                      Extract keywords and gaps from a job posting.
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/tracker" className="block">
                  <Card className="h-full hover:bg-gray-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-gray-800">Track Applications</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-gray-600">
                      Keep tabs on every application you send.
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800">Not sure where to start?</CardTitle>
              <CardDescription>
                Try tailoring a resume or scanning a job description to find missing keywords.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/resume">
                <Button>
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
