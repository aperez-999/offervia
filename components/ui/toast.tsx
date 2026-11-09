import * as React from "react"
import { cva } from "class-variance-authority"
import { CheckCircle, Info, WarningCircle, X } from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

import { cn } from "@/lib/utils"

export const ToastProviderContext = React.createContext<{
  toasts: ToastProps[]
  setToasts: React.Dispatch<React.SetStateAction<ToastProps[]>>
} | null>(null)

export function useToastProvider() {
  const ctx = React.useContext(ToastProviderContext)
  if (!ctx) throw new Error("useToastProvider must be used within <Toaster>")
  return ctx
}

export type ToastVariant =
  | "default"
  | "success"
  | "destructive"
  | "info"

export type ToastProps = {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: ToastVariant
  action?: React.ReactNode
  duration?: number
}

const toastVariants = cva(
  "pointer-events-auto relative flex w-full gap-3 overflow-hidden rounded-xl border p-4 pr-9 shadow-lg backdrop-blur-sm transition-colors dark:ring-white/5",
  {
    variants: {
      variant: {
        default: "border-border bg-popover text-popover-foreground",
        success:
          "border-success/25 bg-[color-mix(in_oklch,var(--success)_9%,var(--popover))] text-popover-foreground",
        destructive:
          "border-destructive/25 bg-[color-mix(in_oklch,var(--destructive)_9%,var(--popover))] text-popover-foreground",
        info: "border-info/25 bg-[color-mix(in_oklch,var(--info)_9%,var(--popover))] text-popover-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const iconStyles: Record<
  ToastVariant,
  { Icon: PhosphorIcon; chip: string }
> = {
  default: { Icon: Info, chip: "bg-foreground/[0.07] text-foreground/70" },
  success: { Icon: CheckCircle, chip: "bg-success/15 text-success" },
  destructive: { Icon: WarningCircle, chip: "bg-destructive/15 text-destructive" },
  info: { Icon: Info, chip: "bg-info/15 text-info" },
}

const accentBar: Record<ToastVariant, string> = {
  default: "bg-foreground/25",
  success: "bg-success",
  destructive: "bg-destructive",
  info: "bg-info",
}

export function Toast({
  title,
  description,
  variant = "default",
  action,
  duration,
}: ToastProps) {
  const isError = variant === "destructive"
  const { Icon, chip } = iconStyles[variant] ?? iconStyles.default

  return (
    <div
      className={cn(toastVariants({ variant }))}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      {/* left accent */}
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", accentBar[variant])}
      />

      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
          chip
        )}
      >
        <Icon className="size-[18px]" />
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        {title ? (
          <div className="text-sm font-semibold leading-snug">{title}</div>
        ) : null}
        {description ? (
          <div className="mt-1 break-words text-sm leading-relaxed text-foreground/75">
            {description}
          </div>
        ) : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>

      <button
        className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 transition-colors hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Close"
        data-close="true"
      >
        <X className="h-4 w-4" />
      </button>

      {/* auto-dismiss progress bar */}
      {duration && duration > 0 ? (
        <span
          aria-hidden
          className={cn(
            "toast-progress absolute bottom-0 left-0 h-0.5 w-full origin-left",
            accentBar[variant]
          )}
          style={{ animationDuration: `${duration}ms` }}
        />
      ) : null}
    </div>
  )
}

export function ToastViewport({ children }: { children?: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-full max-w-sm flex-col gap-2 px-4">
      {children}
    </div>
  )
}
