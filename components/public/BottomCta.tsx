import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export default function BottomCta() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="max-w-[22ch] font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.05] font-bold tracking-[-0.025em] text-foreground">
            Try it on the next job you{" "}
            <span className="hl hl-static">apply&nbsp;to</span>.
          </h2>
          <Link
            href="/signup"
            className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-primary-button px-7 py-3.5 text-[15px] font-semibold text-primary-button-foreground shadow-sm transition-[filter,transform] duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:active:scale-[0.98] sm:self-auto"
          >
            Make a free account
            <ArrowRight className="size-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" weight="bold" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
