// app/(protected)/settings/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/layout/Page";
import { SettingsSkeleton } from "@/components/settings/SettingsSkeleton";
import { DAILY_LIMITS, FEATURE_COPY, GATED_FEATURES } from "@/lib/usage/limits";
import DeleteAccount from "@/components/settings/DeleteAccount";
import { switchTheme, originFromEvent } from "@/lib/theme-transition";
import {
  UserRound,
  Palette,
  SlidersHorizontal,
  Database,
  Sun,
  Moon,
  Monitor,
  Check,
  Camera,
  Gauge,
} from "lucide-react";

type CoachMode = "interview" | "resume" | "cover_letter" | "career";
type UserPrefsRow = {
  user_id: string;
  default_mode: CoachMode | null;
  weekly_goal: number | null;
};

const SECTIONS = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "limits", label: "Daily limits", icon: Gauge },
  { id: "data", label: "Data & privacy", icon: Database },
] as const;

export default function SettingsPage() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  // profile
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  // preferences (DB-backed)
  const [weeklyGoal, setWeeklyGoal] = useState<number>(5);
  const [defaultMode, setDefaultMode] = useState<CoachMode>("interview");


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
        setAvatarUrl(meta.avatar_url || "");
        // Supabase sets email_confirmed_at when verified
        setEmailVerified(Boolean(user.email_confirmed_at));

        // Load prefs from DB (if row missing, defaults stay as-is).
        const { data: prefs, error: prefsErr } = await supabase
          .from("user_prefs")
          .select("default_mode, weekly_goal")
          .eq("user_id", user.id)
          .maybeSingle();

        if (prefsErr) {
          // Non-fatal; show toast but keep page usable
          toast({ title: "Couldn't load your preferences", description: "Some fields may show defaults. Refresh to try again.", variant: "destructive" });
        }

        if (prefs) {
          if (prefs.default_mode) setDefaultMode(prefs.default_mode as CoachMode);
          if (typeof prefs.weekly_goal === "number") setWeeklyGoal(prefs.weekly_goal);
        }

      } catch {
        toast({ title: "Couldn't load settings", description: "Check your connection and refresh the page.", variant: "destructive" });
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
      };

      const { error: upsertErr } = await supabase
        .from("user_prefs")
        .upsert(payload, { onConflict: "user_id" });

      if (upsertErr) throw upsertErr;

      toast({ variant: "success", title: "Settings saved" });
    } catch {
      toast({ title: "Couldn't save settings", description: "Your changes weren't saved. Check your connection and try again.", variant: "destructive" });
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
      toast({ title: "Couldn't sign out. Try again.", variant: "destructive" });
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

      toast({ variant: "success", title: "Export downloaded" });
    } catch {
      toast({ title: "Couldn't export your data", description: "Try again in a moment.", variant: "destructive" });
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
    toast({ variant: "success", title: "Browser data cleared" });
  }

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <PageContainer>
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
        <p className="text-xs font-medium text-primary">Account</p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <p className="mt-1 text-sm text-foreground/70">
              Your account, appearance, preferences, and data.
            </p>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Section nav */}
        <aside className="xl:sticky xl:top-24">
          <nav className="rounded-2xl border border-border bg-card p-2 shadow-sm">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
              >
                <Icon className="h-4 w-4 text-foreground/60" />
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Sections */}
        <div className="space-y-6">
          {/* Profile */}
          <Card id="profile" className="scroll-mt-24 rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Profile</CardTitle>
              <CardDescription className="text-foreground/70">
                Your name and email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/profile"
                  aria-label="Edit avatar"
                  className="group relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                >
                  <Avatar className="h-16 w-16 ring-2 ring-border transition-all duration-300 group-hover:ring-primary/50 motion-safe:group-hover:scale-105">
                    <AvatarImage src={avatarUrl || ""} alt={name || email || "User"} />
                    <AvatarFallback className="bg-primary-button text-white text-xl">
                      {(name || email || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-foreground/40 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <Camera className="h-5 w-5" />
                  </span>
                </Link>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {name || "Your name"}
                  </div>
                  <div className="truncate text-xs text-foreground/60">{email}</div>
                  <Link
                    href="/profile"
                    className="mt-1 inline-flex text-xs font-medium text-primary hover:underline"
                  >
                    Change photo
                  </Link>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  onClick={onSave}
                  disabled={saving || loading}
                  className="bg-primary-button text-white hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                >
                  {saving ? "Saving…" : "Save profile"}
                </Button>
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-foreground/[0.06]"
                  asChild
                >
                  <Link href="/profile">Edit avatar</Link>
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

          {/* Appearance */}
          <Card id="appearance" className="scroll-mt-24 rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Appearance</CardTitle>
              <CardDescription className="text-foreground/70">
                Choose how Offervia looks on this device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {([
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ] as const).map(({ value, label, icon: Icon }) => {
                  const active = theme === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={(e) => switchTheme(() => setTheme(value), originFromEvent(e))}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-sm transition-colors ${
                        active
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "border-border bg-background/60 text-foreground/80 hover:bg-foreground/[0.06]"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-foreground/60"}`} />
                      {label}
                      {active && <Check className="ml-auto h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card id="preferences" className="scroll-mt-24 rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Preferences</CardTitle>
              <CardDescription className="text-foreground/70">
                Coach default and weekly goal
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
                    <SelectItem value="interview">Interview practice</SelectItem>
                    <SelectItem value="resume">Resume feedback</SelectItem>
                    <SelectItem value="cover_letter">Cover letter help</SelectItem>
                    <SelectItem value="career">Career advice</SelectItem>
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
                  Your dashboard tracks progress toward this number each week.
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                <Button
                  onClick={onSave}
                  disabled={saving || loading}
                  className="bg-primary-button text-white hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                >
                  {saving ? "Saving…" : "Save settings"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Daily limits */}
          <Card id="limits" className="scroll-mt-24 rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Daily limits</CardTitle>
              <CardDescription className="text-foreground/70">
                To keep things quick for everyone, a few tools have a daily limit. Each use frees up
                again 24 hours after you make it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border rounded-xl border border-border">
                {GATED_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <dt className="text-foreground/80">{FEATURE_COPY[feature].label}</dt>
                    <dd className="font-medium tabular-nums text-foreground">{DAILY_LIMITS[feature]} a day</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card id="data" className="scroll-mt-24 rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Data &amp; privacy</CardTitle>
              <CardDescription className="text-foreground/70">
                Download a copy of your data, or clear drafts saved in this browser.
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
                  Clear browser data
                </Button>
              </div>

              <hr className="my-2 border-border" />

              <div className="space-y-1 text-xs text-foreground/60">
                <p>
                  <strong className="text-foreground/80">Export data</strong> downloads your profile details,
                  preferences, coach chat history, and any drafts saved in this browser.
                </p>
                <p>
                  <strong className="text-foreground/80">Clear browser data</strong> removes drafts and scan
                  history saved in this browser. Your account and everything saved to it stay as they are.
                </p>
              </div>

              <DeleteAccount />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
