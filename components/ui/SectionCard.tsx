import * as React from "react";

type Tone = "slate" | "indigo" | "blue" | "neutral";

const toneBg: Record<Tone, string> = {
  slate:
    "bg-gradient-to-b from-slate-500/[0.06] to-slate-900/[0.08] dark:from-slate-400/[0.06] dark:to-slate-900/[0.10]",
  indigo:
    "bg-gradient-to-b from-indigo-500/[0.06] to-indigo-900/[0.08] dark:from-indigo-400/[0.06] dark:to-indigo-900/[0.10]",
  blue:
    "bg-gradient-to-b from-blue-500/[0.06] to-blue-900/[0.08] dark:from-blue-400/[0.06] dark:to-blue-900/[0.10]",
  neutral:
    "bg-gradient-to-b from-neutral-500/[0.06] to-neutral-900/[0.08] dark:from-neutral-400/[0.06] dark:to-neutral-900/[0.10]",
};

type Props = {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
  as?: keyof JSX.IntrinsicElements;
};

export function SectionCard({ children, className, tone = "slate", as = "div" }: Props) {
  const Comp = as as any;
  const base = [
    "rounded-xl border border-white/10 shadow-sm ring-1 ring-white/5",
    "backdrop-blur-sm",
    "p-5",
    toneBg[tone],
  ].join(" ");
  return <Comp className={[base, className || ""].join(" ")}>{children}</Comp>;
}