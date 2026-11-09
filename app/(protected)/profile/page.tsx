"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { captureClientException } from "@/lib/monitoring/sentry";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/layout/Page";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { SENIORITY_OPTIONS, WORK_PREF_OPTIONS } from "@/lib/profile/career";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_SIZE_MB = 4;

function urlToAvatarsPath(url: string | null | undefined) {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/public\/avatars\/(.+)$/);
  return m?.[1] ?? null; // "<uid>/<file>"
}

export default function ProfilePage() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Career profile fields — feed personalization across scanner, resume,
  // interview, and coach.
  const [headline, setHeadline] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [seniority, setSeniority] = useState("");
  const [keySkills, setKeySkills] = useState("");
  const [locations, setLocations] = useState("");
  const [workPref, setWorkPref] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState("");
  const [savingCareer, setSavingCareer] = useState(false);

  const initial = (name || email || "U").trim().charAt(0).toUpperCase();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setEmail(user.email ?? "");
        const meta = user.user_metadata || {};
        const authName = meta.full_name || meta.name || "";
        const authAvatar = meta.avatar_url || "";

        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        setName(prof?.full_name ?? authName);
        setAvatarUrl(prof?.avatar_url ?? authAvatar);

        // Career fields live on the same row but may not exist pre-migration;
        // query separately and ignore a missing-column error.
        const { data: career } = await supabase
          .from("profiles")
          .select(
            "headline, target_role, seniority, key_skills, locations, work_pref, years_experience, bio"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (career) {
          setHeadline(career.headline ?? "");
          setTargetRole(career.target_role ?? "");
          setSeniority(career.seniority ?? "");
          setKeySkills(career.key_skills ?? "");
          setLocations(career.locations ?? "");
          setWorkPref(career.work_pref ?? "");
          setYearsExperience(
            typeof career.years_experience === "number"
              ? String(career.years_experience)
              : ""
          );
          setBio(career.bio ?? "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase]);

  async function syncProfile(partial: { full_name?: string | null; avatar_url?: string | null; }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");

    await supabase.auth.updateUser({
      data: {
        ...(partial.full_name !== undefined ? { full_name: partial.full_name } : {}),
        ...(partial.avatar_url !== undefined ? { avatar_url: partial.avatar_url } : {}),
      },
    });

    await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          ...(partial.full_name !== undefined ? { full_name: partial.full_name } : {}),
          ...(partial.avatar_url !== undefined ? { avatar_url: partial.avatar_url } : {}),
        },
        { onConflict: "id" }
      );
  }

  async function saveName() {
    try {
      setSaving(true);
      await syncProfile({ full_name: name || null });
      toast({ variant: "success", title: "Profile updated" });
    } catch {
      toast({ title: "Couldn't save your name. Try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function saveCareer() {
    try {
      setSavingCareer(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const years = yearsExperience.trim() === "" ? null : Number(yearsExperience);
      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          headline: headline.trim() || null,
          target_role: targetRole.trim() || null,
          seniority: seniority || null,
          key_skills: keySkills.trim() || null,
          locations: locations.trim() || null,
          work_pref: workPref || null,
          years_experience: years !== null && Number.isFinite(years) ? years : null,
          bio: bio.trim() || null,
        },
        { onConflict: "id" }
      );
      if (error) throw error;
      toast({ variant: "success", title: "Career details saved" });
    } catch {
      toast({
        title: "Couldn't save career details",
        description: "Check your connection and try again. If it keeps failing, contact support.",
        variant: "destructive",
      });
    } finally {
      setSavingCareer(false);
    }
  }

  async function onPick(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "That file type isn't supported", description: "Use a PNG, JPG, WEBP, or GIF image.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: "That image is too large", description: `Use an image under ${MAX_SIZE_MB}MB.`, variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      // best-effort cleanup of old file
      const oldPath = urlToAvatarsPath(avatarUrl);
      if (oldPath) {
        supabase.storage.from("avatars").remove([oldPath]).catch(() => {});
      }

      await syncProfile({ avatar_url: publicUrl });
      setAvatarUrl(publicUrl);
      toast({ variant: "success", title: "Avatar updated" });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error(errorMessage);
      captureClientException(e, { scope: "profile.avatar-upload" });
      toast({
        title: "Couldn't upload your avatar",
        description: "Try again, or try a different image.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    try {
      setUploading(true);
      const oldPath = urlToAvatarsPath(avatarUrl);
      if (oldPath) {
        await supabase.storage.from("avatars").remove([oldPath]);
      }
      await syncProfile({ avatar_url: null });
      setAvatarUrl("");
      toast({ variant: "success", title: "Avatar removed" });
    } catch {
      toast({ title: "Couldn't remove your avatar. Try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
      <PageContainer>
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          <p className="text-xs font-medium text-primary">Account</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Profile</h1>
          <p className="mt-1 text-sm text-foreground/70">Your avatar, name, and career details.</p>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
          {/* Identity card */}
          <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="h-20 bg-primary/10" />
            <CardContent className="-mt-12 flex flex-col items-center text-center">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || loading}
                aria-label="Change avatar"
                className="group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-card disabled:cursor-not-allowed"
              >
                <Avatar className="h-24 w-24 ring-4 ring-card transition-all duration-300 group-hover:ring-primary/40 motion-safe:group-hover:scale-[1.03]">
                  <AvatarImage src={avatarUrl || ""} alt={name || email || "User"} />
                  <AvatarFallback className="bg-primary-button text-primary-button-foreground text-2xl">{initial}</AvatarFallback>
                </Avatar>
                {/* Hover overlay */}
                <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-foreground/45 text-white opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100">
                  <Camera className="h-5 w-5" />
                  <span className="text-xs font-medium">Change</span>
                </span>
                {/* Uploading state */}
                {uploading && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                    <CircleNotch className="h-6 w-6 animate-spin text-primary" />
                  </span>
                )}
              </button>
              <div className="mt-3 text-base font-semibold text-foreground">
                {name || "Your name"}
              </div>
              <div className="text-sm text-foreground/60 break-all">{email}</div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPick(f);
                }}
              />
              <div className="mt-4 flex w-full flex-col gap-2">
                <Button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || loading}
                  className="w-full bg-primary-button text-primary-button-foreground hover:bg-primary-button/90"
                >
                  {uploading ? "Uploading…" : "Change avatar"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-foreground/[0.06]"
                  onClick={removeAvatar}
                  disabled={uploading || loading || !avatarUrl}
                >
                  Remove avatar
                </Button>
              </div>
              <p className="mt-3 text-xs text-foreground/50">
                Square images work best. PNG, JPG, WEBP, or GIF, up to {MAX_SIZE_MB}MB.
              </p>
            </CardContent>
          </Card>

          {/* Public info */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Name and email</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
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
                <p className="text-xs text-foreground/50">Your email comes from how you sign in and can&apos;t be changed here.</p>
              </div>
              <div className="pt-1 sm:col-span-2">
                <Button
                  onClick={saveName}
                  disabled={saving || loading}
                  className="bg-primary-button text-primary-button-foreground hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Career details: used by coach, interview, and cover letter prompts */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm sm:col-span-full xl:col-start-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Career details</CardTitle>
              <CardDescription className="text-foreground/70">
                The coach, mock interviews, and cover letters use these details, so you don&apos;t have to retype your role each time.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1 sm:col-span-2">
                <label htmlFor="headline" className="text-sm text-foreground/80">Headline</label>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="bg-background/80 text-foreground border-border"
                  placeholder="e.g. Frontend engineer, React and design systems"
                  disabled={loading}
                />
              </div>

              <div className="grid gap-1">
                <label htmlFor="targetRole" className="text-sm text-foreground/80">Target role</label>
                <Input
                  id="targetRole"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="bg-background/80 text-foreground border-border"
                  placeholder="e.g. Senior Product Designer"
                  disabled={loading}
                />
              </div>

              <div className="grid gap-1">
                <label htmlFor="seniority" className="text-sm text-foreground/80">Seniority</label>
                <Select value={seniority} onValueChange={setSeniority} disabled={loading}>
                  <SelectTrigger id="seniority" className="bg-background/80 text-foreground border-border">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {SENIORITY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1">
                <label htmlFor="years" className="text-sm text-foreground/80">Years of experience</label>
                <Input
                  id="years"
                  type="number"
                  min={0}
                  max={60}
                  inputMode="numeric"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="bg-background/80 text-foreground border-border"
                  placeholder="e.g. 4"
                  disabled={loading}
                />
              </div>

              <div className="grid gap-1">
                <label htmlFor="workPref" className="text-sm text-foreground/80">Work preference</label>
                <Select value={workPref} onValueChange={setWorkPref} disabled={loading}>
                  <SelectTrigger id="workPref" className="bg-background/80 text-foreground border-border">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_PREF_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1 sm:col-span-2">
                <label htmlFor="skills" className="text-sm text-foreground/80">Key skills</label>
                <Input
                  id="skills"
                  value={keySkills}
                  onChange={(e) => setKeySkills(e.target.value)}
                  className="bg-background/80 text-foreground border-border"
                  placeholder="e.g. React, TypeScript, Figma, user research"
                  disabled={loading}
                />
                <p className="text-xs text-foreground/50">Separate skills with commas.</p>
              </div>

              <div className="grid gap-1 sm:col-span-2">
                <label htmlFor="locations" className="text-sm text-foreground/80">Preferred locations</label>
                <Input
                  id="locations"
                  value={locations}
                  onChange={(e) => setLocations(e.target.value)}
                  className="bg-background/80 text-foreground border-border"
                  placeholder="e.g. Remote (US), New York, London"
                  disabled={loading}
                />
              </div>

              <div className="grid gap-1 sm:col-span-2">
                <label htmlFor="bio" className="text-sm text-foreground/80">About you</label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-24 bg-background/80 text-foreground border-border"
                  placeholder="A sentence or two on your background, strengths, and what you're looking for."
                  disabled={loading}
                />
              </div>

              <div className="pt-1 sm:col-span-2">
                <Button
                  onClick={saveCareer}
                  disabled={savingCareer || loading}
                  className="bg-primary-button text-primary-button-foreground hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                >
                  {savingCareer ? "Saving…" : "Save career details"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
  );
}