"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { safeFetchJson } from "@/lib/safe-fetch";
import { DELETE_CONFIRMATION } from "@/lib/account";

const PHRASE = DELETE_CONFIRMATION;

/** Permanently deletes the account after the user types the phrase. */
export default function DeleteAccount() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = typed.trim().toLowerCase() === PHRASE;

  async function onDelete() {
    if (!ready || busy) return;
    setBusy(true);
    const res = await safeFetchJson<{ deleted: boolean }>("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: typed }),
      timeoutMs: 30_000,
    });
    if (!res.ok) {
      setBusy(false);
      toast({ title: "Couldn't delete your account", description: res.error, variant: "destructive" });
      return;
    }
    try {
      localStorage.clear();
    } catch {}
    await getBrowserSupabase().auth.signOut().catch(() => {});
    toast({ title: "Your account was deleted" });
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <div>
        <div className="text-sm font-medium text-foreground">Delete account</div>
        <p className="mt-1 text-sm text-foreground/75">
          Permanently removes your account, applications, saved documents, scans, chats, and My resume.
          This can&apos;t be undone. Export your data first if you want a copy.
        </p>
      </div>
      {!open ? (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
        >
          Delete my account
        </Button>
      ) : (
        <div className="space-y-2">
          <label htmlFor="delete-confirm" className="block text-sm text-foreground/80">
            Type <span className="font-semibold text-foreground">{PHRASE}</span> to confirm
          </label>
          <Input
            id="delete-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="max-w-xs bg-background"
            disabled={busy}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onDelete}
              disabled={!ready || busy}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busy ? "Deleting…" : "Permanently delete"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
              disabled={busy}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
