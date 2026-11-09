import { TEMPLATES } from "@/content/student-hub/templates";
import { DEALS } from "@/content/student-hub/deals";

const STEPS = [
  { title: "Save your resume once", desc: "Every tool starts from it." },
  { title: "Match it to any posting", desc: "See what the job asks for and what's missing." },
  { title: "Keep every application in one place", desc: "With a nudge when it's time to follow up." },
];

/** The plum side of the sign-up screen. Short on phones, full height on desktop. */
export default function SignupPanel() {
  return (
    <aside className="relative flex h-full flex-col justify-between overflow-hidden bg-drench px-6 py-10 text-drench-foreground sm:px-10 lg:px-14 lg:py-14">
      <div className="max-w-md">
        <p className="font-display text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.04] font-bold tracking-[-0.03em]">
          Set it up once.{" "}
          <span className="hl" style={{ "--hl-delay": "500ms" } as React.CSSProperties}>
            Use it for every job.
          </span>
        </p>
        <ol className="mt-10 hidden space-y-6 sm:block">
          {STEPS.map((s, i) => (
            <li key={s.title} className="enter flex gap-4" style={{ "--enter-delay": `${200 + i * 120}ms` } as React.CSSProperties}>
              <span className="font-display text-2xl font-bold tabular-nums opacity-60">{i + 1}</span>
              <span>
                <span className="block font-semibold">{s.title}</span>
                <span className="block text-[15px] opacity-85">{s.desc}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-10 hidden text-sm opacity-80 lg:block">
        Also inside: {TEMPLATES.length} email templates and {DEALS.length} student deals. Free, no credit card.
      </p>
    </aside>
  );
}
