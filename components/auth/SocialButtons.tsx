"use client";

import { LinkedinLogo } from "@phosphor-icons/react/dist/ssr";
import { useToast } from "@/hooks/use-toast";
import { postJson } from "@/lib/safe-fetch";
import { nextFromLocation } from "@/lib/auth/redirect";

type Provider = "google" | "linkedin_oidc";

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="size-[18px]" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.826 32.091 29.274 35 24 35c-7.18 0-13-5.82-13-13s5.82-13 13-13c3.314 0 6.313 1.243 8.594 3.281l5.657-5.657C34.885 3.053 29.706 1 24 1 11.85 1 2 10.85 2 23s9.85 22 22 22 22-9.85 22-22c0-1.477-.153-2.918-.389-4.417z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.818C14.676 16.267 18.961 13 24 13c3.314 0 6.313 1.243 8.594 3.281l5.657-5.657C34.885 3.053 29.706 1 24 1 15.317 1 7.96 5.795 4.081 12.691l2.225 2z" />
      <path fill="#4CAF50" d="M24 45c5.166 0 9.86-1.977 13.409-5.197l-6.198-5.237C29.024 36.488 26.671 37 24 37c-5.241 0-9.709-3.355-11.303-8H6.27l-6.2 4.785C3.895 39.981 13.076 45 24 45z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.36 4.012-5.125 7-9.303 7-5.241 0-9.709-3.355-11.303-8H6.27l-6.2 4.785C3.895 39.981 13.076 45 24 45c12.15 0 22-9.85 22-22 0-1.477-.153-2.918-.389-4.417z" />
    </svg>
  );
}

/** "Continue with Google / LinkedIn". Sends people back to ?next= when they return. */
export default function SocialButtons({ flash = false }: { flash?: boolean }) {
  const { toast } = useToast();

  async function start(provider: Provider) {
    const result = await postJson<{ success: true; data: { url: string } }>("/api/auth/oauth/start", {
      provider,
      next: nextFromLocation(),
    });
    const url = result.ok ? result.data?.data?.url : null;
    if (!url) {
      toast({ title: "Couldn't open that sign-in", description: "Try again, or use your email.", variant: "destructive" });
      return;
    }
    if (flash) {
      try {
        sessionStorage.setItem("offervia:flash", "login");
      } catch {}
    }
    window.location.replace(url);
  }

  const btn =
    "flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-background text-sm font-medium text-foreground transition-colors duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-2.5">
      <button type="button" className={btn} onClick={() => start("google")}>
        <GoogleIcon /> Continue with Google
      </button>
      <button type="button" className={btn} onClick={() => start("linkedin_oidc")}>
        <LinkedinLogo className="size-[18px] text-[#0A66C2] dark:text-foreground" weight="fill" aria-hidden />
        Continue with LinkedIn
      </button>
    </div>
  );
}

export function OrDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
