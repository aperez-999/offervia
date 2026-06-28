// app/(protected)/settings/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/layout/Page";

type CoachMode = "interview" | "resume" | "cover_letter" | "career";
type UserPrefsRow = {
  user_id: string;
  default_mode: CoachMode | null;
  weekly_goal: number | null;
  email_digest: boolean | null;
};

export default function SettingsPage() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const { toast } = useToast();

  // profile
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  // preferences (DB-backed)
  const [weeklyGoal, setWeeklyGoal] = useState<number>(5);
  const [defaultMode, setDefaultMode] = useState<CoachMode>("interview");
  const [emailDigest, setEmailDigest] = useState<boolean>(false);

  // ui state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [working, setWorking] = useState(false); // for export/clear/signout

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user) {
          setLoading(false);
          return;
        }

        setEmail(user.email ?? "");
        const meta = user.user_metadata || {};
        setName(meta.full_name || meta.name || "");
        // Supabase sets email_confirmed_at when verified
        setEmailVerified(Boolean(user.email_confirmed_at));

        // Load prefs from DB (if row missing, defaults stay as-is)
        const { data: prefs, error: prefsErr } = await supabase
          .from("user_prefs")
          .select("default_mode, weekly_goal, email_digest")
          .eq("user_id", user.id)
          .maybeSingle();

        if (prefsErr) {
          // Non-fatal; show toast but keep page usable
          toast({ title: "Could not load preferences", variant: "destructive" });
        }

        if (prefs) {
          if (prefs.default_mode) setDefaultMode(prefs.default_mode as CoachMode);
          if (typeof prefs.weekly_goal === "number") setWeeklyGoal(prefs.weekly_goal);
          if (typeof prefs.email_digest === "boolean") setEmailDigest(prefs.email_digest);
        }
      } catch {
        toast({ title: "Failed to load settings", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase, toast]);

  async function onSave() {
    setSaving(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) throw new Error("Not signed in");

      // Update auth metadata (display name)
      const { error: authErr } = await supabase.auth.updateUser({ data: { full_name: name } });
      if (authErr) throw authErr;

      // Upsert DB prefs
      const payload: Partial<UserPrefsRow> & { user_id: string } = {
        user_id: user.id,
        default_mode: defaultMode,
        weekly_goal: weeklyGoal,
        email_digest: emailDigest,
      };

      const { error: upsertErr } = await supabase
        .from("user_prefs")
        .upsert(payload, { onConflict: "user_id" });

      if (upsertErr) throw upsertErr;

      toast({ title: "Settings saved" });
    } catch {
      toast({ title: "Could not save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setWorking(true);
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      toast({ title: "Sign out failed", variant: "destructive" });
    } finally {
      setWorking(false);
    }
  }

  async function exportData() {
    setWorking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // Pull server-side messages (all modes) and prefs
      const [{ data: msgs }, { data: prefs }] = await Promise.all([
        supabase
          .from("messages")
          .select("mode,role,content,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("user_prefs")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      // Pull browser-only drafts and local history from the current device
      const scannerHistory =
        JSON.parse(localStorage.getItem("offervia:scannerHistory_v1") || "[]");

      const draftKeys = [
        "offervia:scannerDraft_v1",
        "offervia:resume:jd_v1",
        "offervia:jobPacketDraft_v1",
        "offervia:coachDraft:interview",
        "offervia:coachDraft:resume",
        "offervia:coachDraft:cover_letter",
        "offervia:coachDraft:career",
      ];
      const drafts = Object.fromEntries(
        draftKeys.map((k) => [k, localStorage.getItem(k) || ""])
      );

      const payload = {
        profile: {
          email,
          name,
          emailVerified,
        },
        preferences: prefs || null,
        messages: msgs || [],
        local: {
          scannerHistory,
          drafts,
        },
        exported_at: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `offervia-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Export ready" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setWorking(false);
    }
  }

  function clearLocalData() {
    const keys = [
      "offervia:scannerHistory_v1",
      "offervia:scannerDraft_v1",
      "offervia:resume:jd_v1",
      "offervia:jobPacketDraft_v1",
      "offervia:coachDraft:interview",
      "offervia:coachDraft:resume",
      "offervia:coachDraft:cover_letter",
      "offervia:coachDraft:career",
    ];
    for (const k of keys) {
      try {
        localStorage.removeItem(k);
      } catch {}
    }
    toast({ title: "Local data cleared" });
  }

  return (
    <PageContainer>
        {/* Header */}
        <section>
          <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <p className="mt-1 text-sm text-foreground/70">
              Personalize your experience and manage your data.
            </p>
          </div>
        </section>

        {/* Profile */}
        <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground">Profile</CardTitle>
            <CardDescription className="text-foreground/70">
              Basic account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-1">
              <label className="text-sm text-foreground/80">Display name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background/80 text-foreground border-border"
                placeholder="Your name"
                disabled={loading}
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-foreground/80">Email</label>
              <Input
                value={email}
                disabled
                className="bg-background/60 text-foreground/70 border-border"
              />
              {emailVerified === false && (
                <p className="text-xs text-foreground/60">
                  Your email isn’t verified yet. Check your inbox for a confirmation link.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-foreground/[0.06]"
                asChild
              >
                <a href="/profile">Edit avatar</a>
              </Button>
              <Button
                variant="outline"
                onClick={signOut}
                disabled={working}
                className="border-border text-foreground hover:bg-foreground/[0.06]"
              >
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground">Preferences</CardTitle>
            <CardDescription className="text-foreground/70">
              Customize your Offervia experience
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-sm text-foreground/80">Default coach mode</label>
              <Select
                value={defaultMode}
                onValueChange={(v) => setDefaultMode(v as CoachMode)}
                disabled={loading}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select a mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interview">Interview Coach</SelectItem>
                  <SelectItem value="resume">Resume Feedback</SelectItem>
                  <SelectItem value="cover_letter">Cover Letter Help</SelectItem>
                  <SelectItem value="career">Career Advice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-foreground/80">Weekly applications goal</label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={50}
                value={Number.isFinite(weeklyGoal) ? weeklyGoal : 0}
                onChange={(e) => setWeeklyGoal(Number(e.target.value || 0))}
                className="border-border bg-background/80 text-foreground"
                disabled={loading}
              />
              <div className="text-xs text-foreground/60">
                Used on the dashboard for progress nudges.
              </div>
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <label className="text-sm text-foreground/80">Weekly email digest</label>
              <div className="flex items-center gap-2">
                <input
                  id="digest"
                  type="checkbox"
                  checked={emailDigest}
                  onChange={(e) => setEmailDigest(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-background accent-primary"
                  disabled={loading}
                />
                <label htmlFor="digest" className="text-sm text-foreground/80">
                  Send a weekly summary (applications & reminders)
                </label>
              </div>
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
              <Button
                onClick={onSave}
                disabled={saving || loading}
                className="bg-primary text-white hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              >
                {saving ? "Saving…" : "Save settings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground">Data & Privacy</CardTitle>
            <CardDescription className="text-foreground/70">
              Export server-stored account data plus any browser-only drafts found on this device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={exportData}
                disabled={working}
                className="border-border text-foreground hover:bg-foreground/[0.06]"
              >
                Export data (JSON)
              </Button>
              <Button
                variant="outline"
                onClick={clearLocalData}
                className="border-border text-foreground hover:bg-foreground/[0.06]"
              >
                Clear local data
              </Button>
            </div>

            <hr className="my-2 border-border" />

            <div className="space-y-1 text-xs text-foreground/60">
              <p>
                <strong className="text-foreground/80">Export data</strong> includes your profile details,
                preferences, server-stored coach history, and browser-saved drafts or local history found on
                this device.
              </p>
              <p>
                <strong className="text-foreground/80">Clear local data</strong> only removes browser-saved
                drafts and local history from this device. It does not delete your Offervia account or
                server-stored data.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Danger zone</div>
              <p className="text-xs text-foreground/60">
                Need your account removed? Contact support and we&apos;ll help with deletion requests
                and data removal steps.
              </p>
              <Button
                variant="outline"
                asChild
                className="border-destructive/30 text-destructive hover:bg-destructive/10  "
              >
                <Link href="/contact">Contact support about account deletion</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
    </PageContainer>
  );
}
