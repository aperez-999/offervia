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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/layout/Page";
import ProCrest from "@/components/pro/ProCrest";
import { switchTheme, originFromEvent } from "@/lib/theme-transition";
import {
  UserRound,
  Palette,
  SlidersHorizontal,
  CreditCard,
  Database,
  Sun,
  Moon,
  Monitor,
  Crown,
  Check,
  Camera,
} from "lucide-react";

type CoachMode = "interview" | "resume" | "cover_letter" | "career";
type UserPrefsRow = {
  user_id: string;
  default_mode: CoachMode | null;
  weekly_goal: number | null;
  email_digest: boolean | null;
  daily_reminders: boolean | null;
};

const SECTIONS = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "plan", label: "Plan & billing", icon: CreditCard },
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
  const [emailDigest, setEmailDigest] = useState<boolean>(false);
  const [dailyReminders, setDailyReminders] = useState<boolean>(false);

  // plan
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

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
        // daily_reminders is newest — fall back if the column isn't migrated yet.
        let prefs:
          | (Partial<UserPrefsRow> & Record<string, unknown>)
          | null = null;
        let prefsErr: unknown = null;
        {
          const full = await supabase
            .from("user_prefs")
            .select("default_mode, weekly_goal, email_digest, daily_reminders")
            .eq("user_id", user.id)
            .maybeSingle();
          if (full.error) {
            const legacy = await supabase
              .from("user_prefs")
              .select("default_mode, weekly_goal, email_digest")
              .eq("user_id", user.id)
              .maybeSingle();
            prefs = legacy.data;
            prefsErr = legacy.error;
          } else {
            prefs = full.data;
          }
        }

        if (prefsErr) {
          // Non-fatal; show toast but keep page usable
          toast({ title: "Could not load preferences", description: "Some settings may show defaults. Refresh to try again.", variant: "destructive" });
        }

        if (prefs) {
          if (prefs.default_mode) setDefaultMode(prefs.default_mode as CoachMode);
          if (typeof prefs.weekly_goal === "number") setWeeklyGoal(prefs.weekly_goal);
          if (typeof prefs.email_digest === "boolean") setEmailDigest(prefs.email_digest);
          if (typeof prefs.daily_reminders === "boolean")
            setDailyReminders(prefs.daily_reminders);
        }

        // Load subscription/plan (own row via RLS)
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("plan, current_period_end")
          .eq("user_id", user.id)
          .maybeSingle();
        if (sub) {
          setPlan((sub.plan as "free" | "pro") ?? "free");
          setPeriodEnd((sub.current_period_end as string | null) ?? null);
        }
      } catch {
        toast({ title: "Failed to load settings", description: "Check your connection and refresh the page.", variant: "destructive" });
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
        daily_reminders: dailyReminders,
      };

      let upsertErr: unknown = null;
      const upsert = await supabase
        .from("user_prefs")
        .upsert(payload, { onConflict: "user_id" });
      if (upsert.error) {
        // daily_reminders column may not be migrated yet — retry without it.
        const { daily_reminders: _omit, ...legacyPayload } = payload;
        void _omit;
        const retry = await supabase
          .from("user_prefs")
          .upsert(legacyPayload, { onConflict: "user_id" });
        upsertErr = retry.error;
      }

      if (upsertErr) throw upsertErr;

      toast({ variant: "success", title: "Settings saved" });
    } catch {
      toast({ title: "Could not save settings", description: "Your changes weren't saved. Please try again.", variant: "destructive" });
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

  async function openBillingPortal() {
    if (billingLoading) return;
    setBillingLoading(true);
    try {
      const res = await fetch("/api/create-portal-session", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      toast({ title: data?.message || "Billing portal unavailable. Try again.", variant: "destructive" });
    } catch {
      toast({ title: "Billing portal unavailable. Try again.", variant: "destructive" });
    } finally {
      setBillingLoading(false);
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

      toast({ variant: "success", title: "Export ready" });
    } catch {
      toast({ title: "Export failed", description: "We couldn't prepare your data. Please try again.", variant: "destructive" });
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
    toast({ variant: "success", title: "Local data cleared" });
  }

  return (
    <PageContainer>
      <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-6 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Account</p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <p className="mt-1 text-sm text-foreground/70">
              Personalize your experience, manage your plan, and control your data.
            </p>
          </div>
          {plan === "pro" ? (
            <ProCrest size="md" label="Pro plan" />
          ) : (
            <Badge className="border border-border bg-background/60 text-foreground/70">
              Free plan
            </Badge>
          )}
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Section nav */}
        <aside className="xl:sticky xl:top-24">
          <nav className="rounded-2xl border border-border bg-card/60 p-2 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
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
          <Card id="profile" className="scroll-mt-24 rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Profile</CardTitle>
              <CardDescription className="text-foreground/70">
                Basic account information
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

          {/* Appearance */}
          <Card id="appearance" className="scroll-mt-24 rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
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
          <Card id="preferences" className="scroll-mt-24 rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
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

              <div className="grid gap-2 sm:col-span-2">
                <label className="text-sm text-foreground/80">Daily follow-up reminders</label>
                <div className="flex items-center gap-2">
                  <input
                    id="daily-reminders"
                    type="checkbox"
                    checked={dailyReminders}
                    onChange={(e) => setDailyReminders(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background accent-primary"
                    disabled={loading}
                  />
                  <label htmlFor="daily-reminders" className="text-sm text-foreground/80">
                    Email me when a follow-up is due or overdue
                  </label>
                </div>
                <div className="text-xs text-foreground/60">
                  Separate from the weekly digest. Only sends on days you have follow-ups due.
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

          {/* Plan & billing */}
          <Card id="plan" className="scroll-mt-24 rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Plan &amp; billing</CardTitle>
              <CardDescription className="text-foreground/70">
                Manage your subscription and billing details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${plan === "pro" ? "bg-reward/15 text-reward" : "bg-foreground/5 text-foreground/60"}`}>
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {plan === "pro" ? "Offervia Pro" : "Free plan"}
                    </div>
                    <div className="text-xs text-foreground/60">
                      {plan === "pro"
                        ? periodEnd
                          ? `Renews ${new Date(periodEnd).toLocaleDateString()}`
                          : "Active subscription"
                        : "Upgrade to unlock unlimited tailoring and Pro tools."}
                    </div>
                  </div>
                </div>
                {plan === "pro" ? (
                  <Button
                    variant="outline"
                    onClick={openBillingPortal}
                    disabled={billingLoading}
                    className="border-border text-foreground hover:bg-foreground/[0.06]"
                  >
                    {billingLoading ? "Opening…" : "Manage billing"}
                  </Button>
                ) : (
                  <Button asChild className="bg-primary-button text-white hover:bg-primary-button/90">
                    <Link href="/upgrade">Upgrade to Pro</Link>
                  </Button>
                )}
              </div>
              {plan === "pro" ? (
                <p className="text-xs text-foreground/60">
                  Update your payment method, download invoices, or cancel and switch back to Free at any time through the billing portal. Pro access continues until the end of your current period.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card id="data" className="scroll-mt-24 rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Data &amp; privacy</CardTitle>
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

              <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <div className="text-sm font-medium text-foreground">Danger zone</div>
                <p className="text-xs text-foreground/60">
                  Need your account removed? Contact support and we&apos;ll help with deletion requests
                  and data removal steps.
                </p>
                <Button
                  variant="outline"
                  asChild
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <Link href="/contact">Contact support about account deletion</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
