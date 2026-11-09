"use client";

import type { ReactNode } from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

type AuthFieldProps = {
  id: string;
  label: string;
  icon: PhosphorIcon;
  registration: UseFormRegisterReturn;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  /** Optional element pinned to the right edge (e.g. a show/hide toggle). */
  rightSlot?: ReactNode;
};

/** Auth input used by login, signup, and password reset. */
export default function AuthField({
  id,
  label,
  icon: Icon,
  registration,
  type = "text",
  placeholder,
  autoComplete,
  error,
  rightSlot,
}: AuthFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="group relative">
        <Icon
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
        />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-11 w-full rounded-xl border border-border bg-background/60 pl-10 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow,border-color]",
            "placeholder:text-foreground/40",
            "hover:border-foreground/20",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
            "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/30",
            rightSlot ? "pr-16" : "pr-3"
          )}
          {...registration}
        />
        {rightSlot ? (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">{rightSlot}</div>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

/** Small "Show / Hide" toggle styled for the field right slot. */
export function PasswordToggle({
  shown,
  onToggle,
}: {
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={shown}
      className="rounded-md px-2 py-1 text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {shown ? "Hide" : "Show"}
    </button>
  );
}
