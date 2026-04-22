"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

export default function JobPacketClient() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-4 sm:p-6 space-y-4 sm:space-y-6"
    >
      <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Job Packet</h1>
            <p className="mt-1 text-sm text-foreground/70">
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
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            title: "1) Scan",
            desc: "Surface keywords, strengths, and gaps.",
            href: "/scanner",
            cta: "Open Scanner",
          },
          {
            title: "2) Tailor",
            desc: "Generate ATS-friendly resume edits.",
            href: "/resume",
            cta: "Open Resume Tailor",
          },
          {
            title: "3) Track",
            desc: "Add the application and set follow‑ups.",
            href: "/tracker",
            cta: "Open Tracker",
          },
        ].map((x) => (
          <Card
            key={x.title}
            className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10"
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                {x.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-foreground/80">
              <p className="text-foreground/70">{x.desc}</p>
              <Button asChild className="w-full bg-indigo-600 text-white hover:bg-indigo-500">
                <Link href={x.href}>{x.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="sm:hidden">
        <Button asChild className="w-full bg-emerald-600 text-white hover:bg-emerald-500">
          <Link href="/scanner">
            Start with a job scan <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

