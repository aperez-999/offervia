import Link from "next/link";
import { ArrowDown, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import HeroDemo from "./HeroDemo";

const delay = (ms: number) => ({ "--enter-delay": `${ms}ms` }) as React.CSSProperties;

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-12 sm:pt-20 sm:pb-16">
        <h1 className="enter max-w-[16ch] font-display text-[clamp(2.6rem,6.2vw,4.75rem)] leading-[1.02] font-bold tracking-[-0.03em] text-foreground">
          See what the job asks for, and{" "}
          <span className="hl" style={{ "--hl-delay": "700ms" } as React.CSSProperties}>
            show you have&nbsp;it
          </span>
          .
        </h1>

        <p
          className="enter mt-6 max-w-[58ch] text-lg leading-relaxed text-foreground/80 text-pretty"
          style={delay(120)}
        >
          Paste a job posting, see what your resume is missing, and fix it before you apply.
        </p>

        <div className="enter mt-8 flex flex-col gap-3 sm:flex-row sm:items-center" style={delay(220)}>
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary-button px-6 py-3 text-[15px] font-semibold text-primary-button-foreground shadow-sm transition-[filter,transform] duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:active:scale-[0.98]"
          >
            Make a free account
            <ArrowRight
              className="size-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
              weight="bold"
              aria-hidden
            />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/70 px-6 py-3 text-[15px] text-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            How it works
            <ArrowDown className="size-4" aria-hidden />
          </a>
        </div>

        <p className="enter mt-5 text-sm text-muted-foreground" style={delay(300)}>
          Free for students, new grads, and anyone job hunting.
        </p>

        <div className="enter mt-14 sm:mt-16" style={delay(450)}>
          <HeroDemo />
        </div>
      </div>
    </section>
  );
}
