"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Toast, ToastViewport, ToastProps, ToastProviderContext, useToastProvider } from "./toast";

const ToastContext = React.createContext<{
  toast: (opts: ToastProps) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <Toaster>");
  return ctx;
}

function resolveDuration(opts: ToastProps): number {
  if (opts.duration) return opts.duration;
  if (opts.action) return 6000;
  if (opts.variant === "destructive") return 5000;
  if (opts.variant === "upgrade") return 6000;
  return 2800;
}

export function ToastProvider({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const api = React.useMemo(
    () => ({
      toast: (opts: ToastProps) => {
        setToasts((prev) => {
          const last = prev[prev.length - 1];
          // Prevent stacking identical consecutive toasts
          if (last && last.title === opts.title && last.description === opts.description) {
            return prev;
          }
          const id = opts.id ?? Math.random().toString(36).slice(2);
          const duration = resolveDuration(opts);
          setTimeout(() => {
            setToasts((curr) => curr.filter((t) => t.id !== id));
          }, duration);
          return [...prev, { ...opts, id, duration }];
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
  const reduceMotion = useReducedMotion();

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
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout={!reduceMotion}
            data-toast-id={t.id}
            onClick={onClose}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <Toast {...t} />
          </motion.div>
        ))}
      </AnimatePresence>
    </ToastViewport>
  );
}
