"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertCircle, CheckCircle2, ServerCrash, Siren, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Status =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export default function SentryTestPanel() {
  const [clientStatus, setClientStatus] = useState<Status>({ kind: "idle" });
  const [serverStatus, setServerStatus] = useState<Status>({ kind: "idle" });
  const [clientLoading, setClientLoading] = useState(false);
  const [serverLoading, setServerLoading] = useState(false);

  async function sendClientTest() {
    setClientLoading(true);
    setClientStatus({ kind: "idle" });

    try {
      const eventId = Sentry.captureException(new Error("Local Sentry client test"));
      await Sentry.flush(2000);
      setClientStatus({
        kind: "success",
        message: eventId
          ? `Client event sent. Event ID: ${eventId}`
          : "Client event sent. Check your Sentry Issues or Events stream.",
      });
    } catch (error) {
      setClientStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Client event failed to send.",
      });
    } finally {
      setClientLoading(false);
    }
  }

  async function sendServerTest() {
    setServerLoading(true);
    setServerStatus({ kind: "idle" });

    try {
      const response = await fetch("/api/sentry-test", { method: "POST" });
      const body = (await response.json()) as { ok?: boolean; error?: string; eventId?: string };

      if (!response.ok) {
        setServerStatus({
          kind: "success",
          message: body.eventId
            ? `Server event sent. Event ID: ${body.eventId}`
            : "Server event sent. Check your Sentry Issues or Events stream.",
        });
        return;
      }

      setServerStatus({
        kind: "error",
        message: "The server test route returned success unexpectedly.",
      });
    } catch (error) {
      setServerStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Server event failed to send.",
      });
    } finally {
      setServerLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Card className="border-border/60 shadow-lg">
        <CardHeader className="space-y-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            <TriangleAlert className="h-3.5 w-3.5" />
            Dev-only Sentry test page
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl">Verify Sentry locally</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7 text-foreground/70">
              Use this page to send one client-side event and one server-side event to Sentry
              before you deploy. This route is hidden automatically in production.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-5">
            <div className="flex items-start gap-3">
              <Siren className="mt-0.5 h-5 w-5 text-primary" />
              <div className="space-y-1">
                <h2 className="font-semibold">Client-side test</h2>
                <p className="text-sm leading-6 text-foreground/70">
                  Sends a handled error from the browser using the Sentry client SDK.
                </p>
              </div>
            </div>
            <Button onClick={sendClientTest} disabled={clientLoading}>
              {clientLoading ? "Sending client event..." : "Send client test event"}
            </Button>
            <StatusMessage status={clientStatus} />
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-5">
            <div className="flex items-start gap-3">
              <ServerCrash className="mt-0.5 h-5 w-5 text-primary" />
              <div className="space-y-1">
                <h2 className="font-semibold">Server-side test</h2>
                <p className="text-sm leading-6 text-foreground/70">
                  Calls a dev-only API route that captures a server exception and returns an
                  expected `500` response.
                </p>
              </div>
            </div>
            <Button onClick={sendServerTest} disabled={serverLoading} variant="outline">
              {serverLoading ? "Sending server event..." : "Send server test event"}
            </Button>
            <StatusMessage status={serverStatus} />
          </section>

          <section className="rounded-2xl border border-dashed border-border/60 bg-background p-5 text-sm leading-7 text-foreground/70">
            <p>What you should see next:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Click each button once.</li>
              <li>Wait 10 to 60 seconds.</li>
              <li>Open your Sentry project.</li>
              <li>Check the Issues tab or Events stream for both test events.</li>
            </ol>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusMessage({ status }: { status: Status }) {
  if (status.kind === "idle") return null;

  if (status.kind === "success") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{status.message}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{status.message}</span>
    </div>
  );
}
