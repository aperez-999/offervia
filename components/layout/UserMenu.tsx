"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { switchTheme } from "@/lib/theme-transition";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Settings, UserRound, LogOut, Palette, CreditCard } from "lucide-react";

type PlanType = "free" | "pro";

export default function UserMenu({
  onSignOut,
  plan = "free",
}: {
  onSignOut: () => void;
  plan?: PlanType;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toast } = useToast();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  async function openBillingPortal() {
    if (billingLoading || plan !== "pro") return;
    setBillingLoading(true);
    try {
      const res = await fetch("/api/create-portal-session", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      toast({
        title: "Billing portal unavailable. Try again.",
        variant: "destructive",
      });
    } catch {
      toast({
        title: "Billing portal unavailable. Try again.",
        variant: "destructive",
      });
    } finally {
      setBillingLoading(false);
    }
  }

  useEffect(() => {
    const supabase = getBrowserSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const nm =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        null;
      const em = (user.email as string | undefined) || null;
      const av =
        (user.user_metadata?.avatar_url as string | undefined) || null;
      setName(nm);
      setEmail(em);
      setAvatarUrl(av);
    });
  }, []);

  const initials =
    (name?.trim()?.[0] ?? email?.trim()?.[0] ?? "U").toUpperCase();

  const currentThemeValue =
    theme === "system" ? "system" : (resolvedTheme ?? "light");

  return (
    <DropdownMenu>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
            plan === "pro"
              ? "bg-success/15 text-success"
              : "bg-muted text-muted-foreground"
          }`}
          aria-label={`Plan: ${plan}`}
        >
          {plan === "pro" ? "Pro" : "Free"}
        </span>
        {plan === "free" && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-7 rounded-md border-border px-2 text-[10px] font-medium uppercase tracking-wide text-foreground/80 hover:border-success/30 hover:bg-success/10 hover:text-success"
          >
            <Link href="/upgrade">Upgrade</Link>
          </Button>
        )}
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex cursor-pointer h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-foreground/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            aria-label="Open user menu"
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={avatarUrl ?? ""} alt={name ?? "Avatar"} />
              <AvatarFallback className="text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
      </div>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {name ?? "Your profile"}
            </div>
            {email && (
              <div className="truncate text-xs text-muted-foreground">
                {email}
              </div>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
            <UserRound className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-medium uppercase text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Palette className="h-3.5 w-3.5" />
            Theme
          </span>
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={currentThemeValue}
          onValueChange={(val) =>
            switchTheme(() => setTheme(val as "light" | "dark" | "system"))
          }
        >
          <DropdownMenuRadioItem value="light" className="cursor-pointer">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="cursor-pointer">Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" className="cursor-pointer">System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {plan === "pro" && (
          <DropdownMenuItem
            onClick={openBillingPortal}
            disabled={billingLoading}
            className="flex items-center gap-2 cursor-pointer"
          >
            <CreditCard className="h-4 w-4" />
            {billingLoading ? "Opening…" : "Manage billing"}
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={onSignOut}
          className="text-destructive cursor-pointer focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}