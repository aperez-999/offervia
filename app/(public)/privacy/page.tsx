import Link from "next/link";
import { ShieldCheck, Database, Workflow, Lock, UserCheck, Cookie, RefreshCw, Mail, ArrowUp } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

export default function PrivacyPage() {
  const lastUpdated = "April 27, 2026";

  const sections = [
    { id: "introduction", title: "Introduction", icon: ShieldCheck },
    { id: "data-we-collect", title: "Data we collect", icon: Database },
    { id: "how-data-is-used", title: "How data is used", icon: Workflow },
    { id: "ai-and-security", title: "Drafts and security", icon: Lock },
    { id: "user-rights", title: "Your rights", icon: UserCheck },
    { id: "cookies", title: "Cookies", icon: Cookie },
    { id: "changes", title: "Changes to this policy", icon: RefreshCw },
    { id: "contact", title: "Contact", icon: Mail },
  ];

  return (
    <main className="relative overflow-hidden text-foreground">
      {/* Token-driven backdrop, consistent with the app */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="brand-glow absolute inset-x-0 -top-24 h-96" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        {/* Header */}
        <header className="animate-in fade-in-0 slide-in-from-bottom-3 duration-700 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="mt-4 text-xs font-semibold text-primary">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-foreground/70">
            What Offervia collects, how it&apos;s used, and the choices you have. We never sell your data.
          </p>
          <div className="mx-auto mt-4 w-fit rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground/70">
            Last updated: {lastUpdated}
          </div>
        </header>

        <div className="mt-12 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Sticky TOC (desktop) */}
          <aside className="sticky top-24 hidden h-fit self-start lg:block animate-in fade-in-0 slide-in-from-left-3 duration-700">
            <nav className="rounded-2xl border border-border bg-card p-2 shadow-sm">
              <p className="px-3 py-2 text-xs font-semibold text-foreground/50">
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
            {/* Intro callout */}
            <section
              id="introduction"
              className="animate-in fade-in-0 slide-in-from-bottom-3 duration-700 rounded-2xl border border-primary/20 bg-primary/[0.06] p-6 shadow-sm ring-1 ring-primary/15 backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold text-foreground">Introduction</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                Offervia is a job search helper. This policy explains what we collect,
                how we use it, and the choices you have. We do not sell your data.
              </p>
            </section>

            {[
              {
                id: "data-we-collect",
                title: "Data we collect",
                icon: Database,
                body: (
                  <>
                    <p>We collect the data needed to operate Offervia and support your account:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li>Account, profile, and billing-related information needed for sign-in, subscriptions, and support.</li>
                      <li>User-submitted content used in features such as resume tailoring, job scans, coaching, contact requests, and job tracking.</li>
                      <li>Server-stored history needed to provide the product experience, including tracker entries, coach messages, job scans, usage counts, and subscription state.</li>
                      <li>Browser-local drafts and convenience state saved on the device you are using, such as unsent drafts or local history.</li>
                    </ul>
                  </>
                ),
              },
              {
                id: "how-data-is-used",
                title: "How data is used",
                icon: Workflow,
                body: (
                  <p>
                    We use your data to run the tools you ask for: resume rewrites, interview
                    practice, job scans, and the application tracker. Text you submit is sent
                    from our server to a model provider to produce those drafts. We also look
                    at overall usage so we can tell when something is broken.
                  </p>
                ),
              },
              {
                id: "ai-and-security",
                title: "Drafts and security",
                icon: Lock,
                body: (
                  <p>
                    Resumes, job descriptions, and chat messages go through Offervia's server
                    to a third-party model so it can write a draft or give feedback. Traffic
                    is encrypted. Stored data is access-controlled. No setup is perfectly secure.
                  </p>
                ),
              },
              {
                id: "user-rights",
                title: "Your rights",
                icon: UserCheck,
                body: (
                  <p>
                    You can contact us to request access to your account data or help with deletion requests.
                    We review privacy and deletion requests as promptly as we can. For any privacy questions,
                    reach out through our contact page.
                  </p>
                ),
              },
              {
                id: "cookies",
                title: "Cookies",
                icon: Cookie,
                body: (
                  <p>
                    We may use cookies or similar technologies to keep you signed in, remember preferences, and
                    measure basic usage. You can control cookies through your browser settings.
                  </p>
                ),
              },
              {
                id: "changes",
                title: "Changes to this policy",
                icon: RefreshCw,
                body: (
                  <p>
                    We may update this policy as Offervia evolves. We’ll adjust the “Last updated” date above and,
                    when appropriate, provide additional notice.
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
                Questions about privacy?{" "}
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
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-primary/10 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
