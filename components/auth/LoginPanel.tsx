import { BellRinging, FileText, Kanban } from "@phosphor-icons/react/dist/ssr";

const WAITING = [
  { icon: BellRinging, text: "Follow-ups that are due" },
  { icon: FileText, text: "My resume, ready to use" },
  { icon: Kanban, text: "Every application where you left it" },
];

/**
 * The bright side of the sign-in screen: highlighter lime with plum ink. It
 * looks the same in light and dark mode, so it only uses fixed brand colors.
 * A short band on phones, full height beside the form on desktop.
 */
export default function LoginPanel() {
  return (
    <aside className="relative flex h-full flex-col justify-center overflow-hidden bg-highlight px-6 py-10 text-highlight-foreground sm:px-10 lg:px-14 lg:py-14">
      {/* The ring from the logo, drawn large and quiet in the corner. */}
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        className="pointer-events-none absolute -bottom-24 -right-24 hidden size-[26rem] text-drench opacity-[0.12] lg:block"
      >
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="14" />
      </svg>

      <div className="relative max-w-md">
        <p className="font-display text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.04] font-bold tracking-[-0.03em]">
          Good to see you{" "}
          <span className="rounded-[0.2em] bg-drench px-[0.18em] text-drench-foreground [box-decoration-break:clone]">
            again.
          </span>
        </p>
        <p className="mt-4 hidden text-[15px] opacity-85 sm:block">Here&apos;s what&apos;s waiting for you.</p>
        <ul className="mt-6 hidden space-y-3 sm:block">
          {WAITING.map(({ icon: Icon, text }, i) => (
            <li
              key={text}
              className="enter flex items-center gap-3 rounded-2xl bg-[color-mix(in_oklab,var(--highlight)_45%,white)] px-4 py-3 text-[15px] font-medium text-highlight-foreground shadow-[0_12px_30px_-24px_rgb(0_0_0/0.5)]"
              style={{ "--enter-delay": `${200 + i * 110}ms` } as React.CSSProperties}
            >
              <Icon className="size-5 shrink-0 text-drench" weight="duotone" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
