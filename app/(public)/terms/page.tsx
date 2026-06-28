import Link from "next/link";
import { SectionCard } from "@/components/ui/SectionCard";

export default function TermsPage() {
  const lastUpdated = "April 27, 2026";

  const sections = [
    { id: "agreement", title: "Agreement" },
    { id: "use-of-service", title: "Use of Service" },
    { id: "acceptable-use", title: "Acceptable Use" },
    { id: "service-limitations", title: "Service Limitations" },
    { id: "intellectual-property", title: "Intellectual Property" },
    { id: "limitation-of-liability", title: "Limitation of Liability" },
    { id: "termination", title: "Termination" },
    { id: "changes", title: "Changes to the Service & Terms" },
    { id: "contact", title: "Contact" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 text-foreground">
      {/* Header */}
      <header className="mb-10 text-center">
        <div className="mx-auto w-fit rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-foreground/80 backdrop-blur">
          Last updated: {lastUpdated}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground dark:text-white">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground dark:text-white">
          Please read these terms carefully before using Offervia.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Sticky TOC (desktop) */}
        <aside className="sticky top-20 hidden self-start lg:block">
          <nav className="space-y-1 text-sm">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-md px-2 py-1 text-foreground/80 hover:bg-foreground/5"
              >
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <article className="space-y-6">
          <SectionCard id="agreement" title="Agreement">
            <p>
              By accessing or using Offervia, you agree to these Terms of Service and our{" "}
              <Link
                href="/privacy"
                className="underline decoration-primary/60 underline-offset-4 hover:decoration-primary"
              >
                Privacy Policy
              </Link>
              . If you do not agree, do not use the service.
            </p>
          </SectionCard>

          <SectionCard id="use-of-service" title="Use of Service">
            <p>
              You agree to use the service lawfully and responsibly. Do not upload content you do not
              have rights to share. Do not attempt to disrupt, reverse engineer, or abuse the platform.
            </p>
          </SectionCard>

          <SectionCard id="acceptable-use" title="Acceptable Use">
            <ul className="list-disc pl-5">
              <li>No illegal, infringing, or harmful content.</li>
              <li>No attempts to bypass security, rate limits, or platform restrictions.</li>
              <li>No automated scraping or misuse that degrades the service for others.</li>
            </ul>
          </SectionCard>

          <SectionCard id="service-limitations" title="Service Limitations">
            <p>
              The service is provided on an “as is” and “as available” basis. Features may evolve,
              and occasional downtime or defects may occur. AI-generated suggestions can be incomplete
              or inaccurate, so you are responsible for reviewing outputs before relying on them.
            </p>
          </SectionCard>

          <SectionCard id="intellectual-property" title="Intellectual Property">
            <p>
              Offervia and its content are owned by us or our licensors. You retain rights to your own
              materials (e.g., resumes and job descriptions) that you upload. You grant us a limited license
              to process that content solely to operate, maintain, and provide the service to you.
            </p>
          </SectionCard>

          <SectionCard id="limitation-of-liability" title="Limitation of Liability">
            <p>
              To the fullest extent permitted by law, Offervia is not liable for indirect, incidental, special,
              consequential, or exemplary damages arising from use of the service. We do not guarantee job offers
              or outcomes.
            </p>
          </SectionCard>

          <SectionCard id="termination" title="Termination">
            <p>
              We may suspend or terminate access if we reasonably believe there’s a violation of these terms or a
              risk to the service or other users. You may stop using the service at any time.
            </p>
          </SectionCard>

          <SectionCard id="changes" title="Changes to the Service & Terms">
            <p>
              We may update the service or these terms as Offervia evolves. We’ll revise the “Last updated” date
              above and, when appropriate, provide additional notice.
            </p>
          </SectionCard>

          <SectionCard id="contact" title="Contact">
            <p>
              Questions about these terms?{" "}
              <Link
                href="/contact"
                className="underline decoration-primary/60 underline-offset-4 hover:decoration-primary"
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
              className="inline-block rounded-md border border-border px-3 py-1.5 text-sm hover:bg-foreground/5"
            >
              Back to top
            </a>
          </div>
        </article>
      </div>
    </main>
  );
}
