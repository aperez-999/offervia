"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UploadSimple } from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { postForm } from "@/lib/safe-fetch";
import { MAX_RESUME_CHARS, MIN_RESUME_CHARS, normalizeResumeText } from "@/lib/profile/resume";

type State = "loading" | "ready" | "unavailable";

/**
 * My resume: one saved resume on the account. The scanner, resume tailor,
 * cover letter, and new application flow start from it.
 */
export default function MyResumeCard() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<State>("loading");
  const [saved, setSaved] = useState("");
  const [text, setText] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "upload" | "clear" | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("resume_text, resume_updated_at")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        setState("unavailable");
        return;
      }
      const value = (data?.resume_text as string | null) ?? "";
      setSaved(value);
      setText(value);
      setUpdatedAt((data?.resume_updated_at as string | null) ?? null);
      setState("ready");
    })();
  }, [supabase]);

  async function write(next: string | null) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, resume_text: next, resume_updated_at: next ? now : null }, { onConflict: "id" });
    if (error) throw error;
    setSaved(next ?? "");
    setText(next ?? "");
    setUpdatedAt(next ? now : null);
  }

  async function save() {
    const clean = normalizeResumeText(text);
    if (clean.length < MIN_RESUME_CHARS) {
      toast({ title: "That looks too short", description: "Paste your full resume, or upload the file.", variant: "destructive" });
      return;
    }
    setBusy("save");
    try {
      await write(clean);
      toast({ variant: "success", title: "My resume saved", description: "Your tools will start from it." });
    } catch {
      toast({ title: "Couldn't save your resume", description: "Try again in a moment.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  }

  async function upload(file: File) {
    setBusy("upload");
    const form = new FormData();
    form.append("file", file);
    const res = await postForm<{ text?: string }>("/api/resume-text", form, { timeoutMs: 45_000 });
    setBusy(null);
    if (!res.ok || !res.data?.text) {
      toast({ title: "Couldn't read that file", description: res.ok ? "Try another file." : res.error, variant: "destructive" });
      return;
    }
    setText(res.data.text);
    toast({ title: "File read", description: "Check the text below, then save it." });
  }

  async function clear() {
    setBusy("clear");
    try {
      await write(null);
      toast({ title: "My resume removed" });
    } catch {
      toast({ title: "Couldn't remove it", description: "Try again in a moment.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  }

  const dirty = normalizeResumeText(text) !== saved;

  return (
    <Card id="my-resume" className="scroll-mt-24 rounded-2xl border border-border bg-card shadow-sm sm:col-span-full xl:col-start-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground">My resume</CardTitle>
        <CardDescription className="text-foreground/70">
          Save it once and the scanner, resume tailor, and cover letter start from it. You can still use
          a different version for any one job.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {state === "unavailable" ? (
          <p className="rounded-xl bg-muted/60 p-3 text-sm text-foreground/80">
            Saving a resume isn&apos;t set up on this server yet. You can still paste or upload it in each tool.
          </p>
        ) : (
          <>
            <Textarea
              aria-label="Your resume text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your resume here, or upload a PDF or DOCX."
              className="min-h-56 resize-y bg-background/80 text-sm leading-relaxed"
              maxLength={MAX_RESUME_CHARS}
              disabled={state === "loading" || busy !== null}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={save} disabled={!dirty || busy !== null || state === "loading"}>
                {busy === "save" ? "Saving…" : "Save"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) upload(file);
                }}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy !== null || state === "loading"}>
                <UploadSimple className="size-4" aria-hidden />
                {busy === "upload" ? "Reading…" : "Upload a file"}
              </Button>
              {saved ? (
                <Button variant="ghost" onClick={clear} disabled={busy !== null} className="text-muted-foreground">
                  {busy === "clear" ? "Removing…" : "Remove"}
                </Button>
              ) : null}
              <span className="ml-auto text-xs text-muted-foreground">
                {updatedAt
                  ? `Last saved ${new Date(updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                  : dirty && text.trim()
                    ? "Not saved yet"
                    : ""}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
