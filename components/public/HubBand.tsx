import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { TEMPLATES } from "@/content/student-hub/templates";
import { DEALS } from "@/content/student-hub/deals";
import { CATALOG } from "@/content/student-hub/resources";

export default function HubBand() {
  return (
    <section id="student-hub" className="scroll-mt-20 bg-drench text-drench-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:py-16 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[46ch]">
          <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.05] font-bold tracking-[-0.025em]">
            Plus a Student Hub.
          </h2>
          <p className="mt-3 text-base leading-relaxed opacity-90">
            {TEMPLATES.length} email templates for follow-ups and thank-yous, {DEALS.length} student
            discounts, and {CATALOG.length} places to learn for free.
          </p>
        </div>
        <Link
          href="/signup?next=/student-hub"
          className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-highlight px-6 py-3 text-[15px] font-semibold text-highlight-foreground transition-[filter,transform] duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-drench motion-safe:active:scale-[0.98] lg:self-auto"
        >
          Open the Student Hub
          <ArrowRight className="size-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" weight="bold" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
