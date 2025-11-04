import * as React from "react"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"

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

export type ToastProps = {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
}

const toastVariants = cva(
  // ✅ Use theme-aware tokens
  "pointer-events-auto relative w-full rounded-md border p-4 pr-10 shadow-sm transition-colors " +
    "bg-background text-foreground border-border",
  {
    variants: {
      variant: {
        default:
          "bg-background text-foreground border-border shadow-sm",
        destructive:
          "border-red-300/60 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700/50"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

export function Toast({ title, description, variant = "default" }: ToastProps) {
  return (
    <div
      className={cn(toastVariants({ variant }))}
      role="status"
      aria-live="polite"
    >
      {title ? <div className="text-sm font-medium">{title}</div> : null}
      {description ? (
        <div className="mt-1 text-sm opacity-80">{description}</div>
      ) : null}
      <button
        className="absolute right-2 top-2 rounded p-1 text-foreground/60 hover:bg-foreground/[0.06]"
        aria-label="Close"
        data-close="true"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastViewport({ children }: { children?: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-full max-w-sm space-y-2 px-4">
      {children}
    </div>
  )
}