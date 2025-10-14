import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
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
  "pointer-events-auto relative w-full rounded-md border p-4 pr-10 shadow-sm transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white border-gray-200 text-gray-900",
        destructive:
          "destructive group border-red-200 bg-red-50 text-red-700"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

export function Toast({ title, description, variant = "default" }: ToastProps) {
  return (
    <div className={cn(toastVariants({ variant }))} role="status" aria-live="polite">
      {title ? <div className="text-sm font-medium">{title}</div> : null}
      {description ? (
        <div className="mt-1 text-sm text-gray-600">{description}</div>
      ) : null}
      <button
        className="absolute right-2 top-2 rounded p-1 text-gray-500 hover:bg-gray-100"
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
