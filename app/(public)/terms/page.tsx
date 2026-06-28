import Link from "next/link";
import {
  Scale,
  Handshake,
  BookOpenCheck,
  ShieldAlert,
  Wrench,
  Copyright,
  Gavel,
  LogOut,
  RefreshCw,
  Mail,
  ArrowUp,
} from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

export default function TermsPage() {
  const lastUpdated = "April 27, 2026";

  const sections = [
    { id: "agreement", title: "Agreement", icon: Handshake },
    { id: "use-of-service", title: "Use of Service", icon: BookOpenCheck },
    { id: "acceptable-use", title: "Acceptable Use", icon: ShieldAlert },
    { id: "service-limitations", title: "Service Limitations", icon: Wrench },
    { id: "intellectual-property", title: "Intellectual Property", icon: Copyright },
    { id: "limitation-of-liability", title: "Limitation of Liability", icon: Gavel },
    { id: "termination", title: "Termination", icon: LogOut },
    { id: "changes", title: "Changes to the Service & Terms", icon: RefreshCw },
    { id: "contact", title: "Contact", icon: Mail },
  ];

  return (
    <main className="relative overflow-hidden text-foreground">
      {/* Token-driven backdrop, consistent with the app */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="brand-glow absolute inset-x-0 -top-24 h-96" />
        <div className="absolute top-32 -left-40 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 right-[-60px] h-64 w-64 rounded-full bg-[var(--chart-2)]/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        {/* Header */}
        <header className="animate-in fade-in-0 slide-in-from-bottom-3 duration-700 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Scale className="h-6 w-6" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">
            The ground rules
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-foreground/70">
            Please read these terms carefully before using Offervia. They keep the platform fair, safe, and reliable for everyone.
          </p>
          <div className="mx-auto mt-4 w-fit rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-foreground/70 backdrop-blur">
            Last updated: {lastUpdated}
          </div>
        </header>

        <div className="mt-12 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Sticky TOC (desktop) */}
          <aside className="sticky top-24 hidden h-fit self-start lg:block animate-in fade-in-0 slide-in-from-left-3 duration-700">
            <nav className="rounded-2xl border border-border bg-card/60 p-2 shadow-sm ring-1 ring-white/5 backdrop-blur dark:ring-black/10">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                On this page
              </p>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-primary/10 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <s.icon className="h-4 w-4 text-foreground/40 transition-colors group-hover:text-primary" />
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <article className="space-y-6">
            {[
              {
                id: "agreement",
                title: "Agreement",
                icon: Handshake,
                body: (
                  <p>
                    By accessing or using Offervia, you agree to these Terms of Service and our{" "}
                    <Link
                      href="/privacy"
                      className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
                    >
                      Privacy Policy
                    </Link>
                    . If you do not agree, do not use the service.
                  </p>
                ),
              },
              {
                id: "use-of-service",
                title: "Use of Service",
                icon: BookOpenCheck,
                body: (
                  <p>
                    You agree to use the service lawfully and responsibly. Do not upload content you do not
                    have rights to share. Do not attempt to disrupt, reverse engineer, or abuse the platform.
                  </p>
                ),
              },
              {
                id: "acceptable-use",
                title: "Acceptable Use",
                icon: ShieldAlert,
                body: (
                  <ul className="list-disc space-y-1 pl-5">
                    <li>No illegal, infringing, or harmful content.</li>
                    <li>No attempts to bypass security, rate limits, or platform restrictions.</li>
                    <li>No automated scraping or misuse that degrades the service for others.</li>
                  </ul>
                ),
              },
              {
                id: "service-limitations",
                title: "Service Limitations",
                icon: Wrench,
                body: (
                  <p>
                    The service is provided on an “as is” and “as available” basis. Features may evolve,
                    and occasional downtime or defects may occur. AI-generated suggestions can be incomplete
                    or inaccurate, so you are responsible for reviewing outputs before relying on them.
                  </p>
                ),
              },
              {
                id: "intellectual-property",
                title: "Intellectual Property",
                icon: Copyright,
                body: (
                  <p>
                    Offervia and its content are owned by us or our licensors. You retain rights to your own
                    materials (e.g., resumes and job descriptions) that you upload. You grant us a limited license
                    to process that content solely to operate, maintain, and provide the service to you.
                  </p>
                ),
              },
              {
                id: "limitation-of-liability",
                title: "Limitation of Liability",
                icon: Gavel,
                body: (
                  <p>
                    To the fullest extent permitted by law, Offervia is not liable for indirect, incidental, special,
                    consequential, or exemplary damages arising from use of the service. We do not guarantee job offers
                    or outcomes.
                  </p>
                ),
              },
              {
                id: "termination",
                title: "Termination",
                icon: LogOut,
                body: (
                  <p>
                    We may suspend or terminate access if we reasonably believe there’s a violation of these terms or a
                    risk to the service or other users. You may stop using the service at any time.
                  </p>
                ),
              },
              {
                id: "changes",
                title: "Changes to the Service & Terms",
                icon: RefreshCw,
                body: (
                  <p>
                    We may update the service or these terms as Offervia evolves. We’ll revise the “Last updated” date
                    above and, when appropriate, provide additional notice.
                  </p>
                ),
              },
            ].map((s, i) => (
              <SectionCard
                key={s.id}
                id={s.id}
                title={s.title}
                icon={s.icon}
                className="animate-in fade-in-0 slide-in-from-bottom-3 duration-700"
                style={{ animationDelay: `${80 + i * 60}ms` }}
              >
                {s.body}
              </SectionCard>
            ))}

            <SectionCard id="contact" title="Contact" icon={Mail}>
              <p>
                Questions about these terms?{" "}
                <Link
                  href="/contact"
                  className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
                >
                  Contact us
                </Link>
                .
              </p>
            </SectionCard>

            {/* Back to top */}
            <div className="pt-2">
              <a
                href="#"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-primary/10 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                Back to top
              </a>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
