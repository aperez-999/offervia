const STEPS = [
  { title: "Paste the posting", desc: "From LinkedIn, Handshake, or any careers page." },
  { title: "Fix what's missing", desc: "See the gaps, then update your resume and cover letter for this job." },
  { title: "Apply and follow up", desc: "Track where it stands and when to check in." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <h2 className="max-w-[20ch] font-display text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-bold tracking-[-0.025em] text-foreground">
          The same three steps for every job.
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="reveal">
              <span
                aria-hidden
                className="block font-display text-5xl leading-none font-bold tracking-[-0.04em] text-primary/80 tabular-nums"
              >
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-1.5 max-w-[34ch] text-[15px] leading-relaxed text-foreground/75">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
