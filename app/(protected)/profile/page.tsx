"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/layout/Page";

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
      toast({ title: "Profile updated" });
    } catch {
      toast({ title: "Could not update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function onPick(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "Unsupported file type", description: "Use PNG, JPG, or WEBP.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: "File too large", description: `Max ${MAX_SIZE_MB}MB`, variant: "destructive" });
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
      toast({ title: "Avatar updated" });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error(errorMessage);
      toast({
        title: "Upload failed",
        description: "Check the 'avatars' bucket and Storage policies.",
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
      toast({ title: "Avatar removed" });
    } catch {
      toast({ title: "Could not remove avatar", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  return (
      <PageContainer>
        <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-6 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Your identity</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Profile</h1>
          <p className="mt-1 text-sm text-foreground/70">Manage your avatar and public details.</p>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
          {/* Identity card */}
          <Card className="overflow-hidden rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <div className="h-20 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent" />
            <CardContent className="-mt-12 flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 ring-4 ring-card">
                <AvatarImage src={avatarUrl || ""} alt={name || email || "User"} />
                <AvatarFallback className="bg-primary text-white text-2xl">{initial}</AvatarFallback>
              </Avatar>
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
                  className="w-full bg-primary text-white hover:bg-primary/90"
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
                Square images work best (PNG, JPG, WEBP · max {MAX_SIZE_MB}MB).
              </p>
            </CardContent>
          </Card>

          {/* Public info */}
          <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Public info</CardTitle>
              <CardDescription className="text-foreground/70">What others may see in shared artifacts</CardDescription>
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
                <p className="text-xs text-foreground/50">Email is managed by your sign-in provider.</p>
              </div>
              <div className="pt-1 sm:col-span-2">
                <Button
                  onClick={saveName}
                  disabled={saving || loading}
                  className="bg-primary text-white hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
  );
}