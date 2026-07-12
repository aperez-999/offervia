"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Copy,
  Download,
  Printer,
  Trash2,
  FileText,
  PenLine,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { printAsPdf, printHtmlDocument } from "@/lib/print-pdf";
import {
  ResumeDocument,
  isLikelyStructuredResume,
  resumeToPrintHtml,
} from "@/components/resume/TailoredResumeDocument";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type DocKind = "cover_letter" | "resume";

type DocRow = {
  id: string;
  kind: DocKind;
  title: string;
  content: string;
  meta: Record<string, unknown> | null;
  created_at: string;
};

const FILTERS: { key: "all" | DocKind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "cover_letter", label: "Cover Letters" },
  { key: "resume", label: "Resumes" },
];

function kindLabel(kind: DocKind) {
  return kind === "cover_letter" ? "Cover Letter" : "Resume";
}

function fileSlug(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "document"
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export default function DocumentsClient() {
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const supabase = useMemo(() => getBrowserSupabase(), []);

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | DocKind>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("documents")
        .select("id,kind,title,content,meta,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (!active) return;
      setDocs((data as DocRow[] | null) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  const filtered = useMemo(
    () => (filter === "all" ? docs : docs.filter((d) => d.kind === filter)),
    [docs, filter],
  );

  const counts = useMemo(
    () => ({
      all: docs.length,
      cover_letter: docs.filter((d) => d.kind === "cover_letter").length,
      resume: docs.filter((d) => d.kind === "resume").length,
    }),
    [docs],
  );

  const copy = useCallback(
    (content: string) => {
      navigator.clipboard.writeText(content).then(
        () => toast({ variant: "success", title: "Copied to clipboard" }),
        () => toast({ title: "Copy failed", variant: "destructive" }),
      );
    },
    [toast],
  );

  const download = useCallback((doc: DocRow) => {
    const blob = new Blob([doc.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileSlug(doc.title)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const exportPdf = useCallback((doc: DocRow) => {
    if (doc.kind === "resume" && isLikelyStructuredResume(doc.content)) {
      printHtmlDocument(resumeToPrintHtml(doc.content, doc.title));
    } else {
      printAsPdf(doc.title, doc.content);
    }
  }, []);

  const remove = useCallback(
    async (id: string) => {
      setDeletingId(id);
      const { error } = await supabase.from("documents").delete().eq("id", id);
      setDeletingId(null);
      if (error) {
        toast({ title: "Could not delete", variant: "destructive" });
        return;
      }
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast({ variant: "success", title: "Deleted" });
    },
    [supabase, toast],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <Skeleton key={f.key} className="h-9 w-28 rounded-full" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <FileText className="size-8 text-foreground/30" />
        <p className="text-sm font-medium text-foreground">No saved documents yet</p>
        <p className="max-w-sm text-sm text-foreground/60">
          Cover letters and tailored resumes you generate are saved here automatically.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/cover-letter">
              <PenLine className="size-3.5" /> Write a cover letter
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/resume">
              <FileText className="size-3.5" /> Tailor a resume
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Document filters">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                active
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-background/50 text-foreground/70 hover:bg-foreground/[0.04]"
              }`}
            >
              {f.label}
              <span className="rounded-full bg-foreground/10 px-1.5 text-xs text-foreground/60">
                {counts[f.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <ul className="space-y-3">
        {filtered.map((doc) => {
          const open = openId === doc.id;
          return (
            <li
              key={doc.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="flex items-center gap-3 p-4">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                    doc.kind === "cover_letter"
                      ? "bg-primary/10 text-primary"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {doc.kind === "cover_letter" ? (
                    <PenLine className="size-4" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : doc.id)}
                  className="min-w-0 flex-1 text-left focus-visible:outline-none"
                  aria-expanded={open}
                >
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {doc.title}
                  </span>
                  <span className="block text-xs text-foreground/55">
                    {kindLabel(doc.kind)} · {formatDate(doc.created_at)}
                  </span>
                </button>
                <ChevronDown
                  className={`size-4 shrink-0 text-foreground/40 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    initial={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                    animate={reduceMotion ? undefined : { height: "auto", opacity: 1 }}
                    exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border/60"
                  >
                    <div className="p-4">
                      {doc.kind === "resume" && isLikelyStructuredResume(doc.content) ? (
                        <div className="max-h-[28rem] overflow-auto rounded-lg bg-neutral-200/70 p-3 dark:bg-neutral-800/60">
                          <ResumeDocument text={doc.content} />
                        </div>
                      ) : (
                        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background/60 p-3 font-sans text-sm leading-relaxed text-foreground/90">
                          {doc.content}
                        </pre>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => copy(doc.content)}>
                          <Copy className="size-3.5" /> Copy
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => download(doc)}>
                          <Download className="size-3.5" /> .txt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportPdf(doc)}
                        >
                          <Printer className="size-3.5" /> PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => remove(doc.id)}
                          disabled={deletingId === doc.id}
                        >
                          {deletingId === doc.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground/50">
          No {filter === "cover_letter" ? "cover letters" : "resumes"} saved yet.
        </p>
      ) : null}
    </div>
  );
}
