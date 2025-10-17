"use client";

import { useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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

  // profile-ish
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  // preferences (DB-backed)
  const [weeklyGoal, setWeeklyGoal] = useState<number>(5);
  const [defaultMode, setDefaultMode] = useState<CoachMode>("interview");
  const [emailDigest, setEmailDigest] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setEmail(user.email ?? "");
        const meta = user.user_metadata || {};
        setName(meta.full_name || meta.name || "");

        // Load prefs from DB (if row missing, defaults stay as-is)
        const { data: prefs } = await supabase
          .from("user_prefs")
          .select("default_mode, weekly_goal, email_digest")
          .eq("user_id", user.id)
          .maybeSingle();

        if (prefs) {
          if (prefs.default_mode) setDefaultMode(prefs.default_mode as CoachMode);
          if (typeof prefs.weekly_goal === "number") setWeeklyGoal(prefs.weekly_goal);
          if (typeof prefs.email_digest === "boolean") setEmailDigest(prefs.email_digest);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase]);

  async function onSave() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // Update auth metadata name
      await supabase.auth.updateUser({ data: { full_name: name } });

      // Upsert DB prefs
      const payload: Partial<UserPrefsRow> & { user_id: string } = {
        user_id: user.id,
        default_mode: defaultMode,
        weekly_goal: weeklyGoal,
        email_digest: emailDigest,
      };

      const { error } = await supabase.from("user_prefs").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;

      toast({ title: "Settings saved" });
    } catch (e) {
      toast({ title: "Could not save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-foreground/70">
            Update your account details and preferences.
          </p>
        </section>

        <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground">Profile</CardTitle>
            <CardDescription className="text-foreground/70">Basic account information</CardDescription>
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
              <Input value={email} disabled className="bg-background/60 text-foreground/70 border-border" />
            </div>
            <div className="pt-1">
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-foreground/[0.06]"
                asChild
              >
                <a href="/profile">Edit avatar</a>
              </Button>
            </div>
          </CardContent>
        </Card>

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
              <Select value={defaultMode} onValueChange={(v) => setDefaultMode(v as CoachMode)}>
                <SelectTrigger className="border-border"><SelectValue placeholder="Select a mode" /></SelectTrigger>
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
                min={0}
                max={50}
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(Number(e.target.value || 0))}
                className="border-border bg-background/80 text-foreground"
                disabled={loading}
              />
              <div className="text-xs text-foreground/60">Used on the dashboard for progress nudges.</div>
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <label className="text-sm text-foreground/80">Weekly email digest</label>
              <div className="flex items-center gap-2">
                <input
                  id="digest"
                  type="checkbox"
                  checked={emailDigest}
                  onChange={(e) => setEmailDigest(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-background accent-indigo-600"
                  disabled={loading}
                />
                <label htmlFor="digest" className="text-sm text-foreground/80">
                  Send a weekly summary (applications & reminders)
                </label>
              </div>
            </div>

            <div className="sm:col-span-2">
              <Button
                onClick={onSave}
                disabled={saving || loading}
                className="bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
              >
                {saving ? "Saving…" : "Save settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}