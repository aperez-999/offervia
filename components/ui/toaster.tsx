"use client";

import * as React from "react";
import { Toast, ToastViewport, ToastProps, ToastProviderContext, useToastProvider } from "./toast";

const ToastContext = React.createContext<{
  toast: (opts: ToastProps) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <Toaster>");
  return ctx;
}

export function ToastProvider({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const api = React.useMemo(
    () => ({
      toast: (opts: ToastProps & { duration?: number }) => {
        setToasts((prev) => {
          const last = prev[prev.length - 1];
          // Prevent stacking identical consecutive toasts
          if (last && last.title === opts.title && last.description === opts.description) {
            return prev;
          }
          const id = opts.id ?? Math.random().toString(36).slice(2);
          const next = [...prev, { ...opts, id }];
          // Auto-dismiss
          const duration = opts.duration ?? 2200;
          setTimeout(() => {
            setToasts((curr) => curr.filter((t) => t.id !== id));
          }, duration);
          return next;
        });
      },
    }),
    []
  );

  return (
    <ToastContext.Provider value={api}>
      <ToastProviderContext.Provider value={{ toasts, setToasts }}>
        {children}
      </ToastProviderContext.Provider>
    </ToastContext.Provider>
  );
}

export function Toaster() {
  const { toasts, setToasts } = useToastProvider();

  const onClose = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-close]")) {
      const wrapper = target.closest("[data-toast-id]") as HTMLDivElement | null;
      const id = wrapper?.dataset.toastId;
      if (id) setToasts((prev) => prev.filter((t) => t.id !== id));
    }
  }, [setToasts]);

  return (
    <ToastViewport>
      {toasts.map((t) => (
        <div key={t.id} data-toast-id={t.id} onClick={onClose}>
          <Toast {...t} />
        </div>
      ))}
    </ToastViewport>
  );
}
