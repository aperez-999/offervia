import Link from "next/link";
import { ShieldCheck, Database, Workflow, Lock, UserCheck, Cookie, RefreshCw, Mail, ArrowUp } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

export default function PrivacyPage() {
  const lastUpdated = "April 27, 2026";

  const sections = [
    { id: "introduction", title: "Introduction", icon: ShieldCheck },
    { id: "data-we-collect", title: "Data We Collect", icon: Database },
    { id: "how-data-is-used", title: "How Data Is Used", icon: Workflow },
    { id: "ai-and-security", title: "AI & Security", icon: Lock },
    { id: "user-rights", title: "Your Rights", icon: UserCheck },
    { id: "cookies", title: "Cookies", icon: Cookie },
    { id: "changes", title: "Changes to this Policy", icon: RefreshCw },
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
            Your privacy, respected
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-foreground/70">
            Offervia is built for job seekers. We handle your information with care and transparency — and we never sell your data.
          </p>
          <div className="mx-auto mt-4 w-fit rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground/70">
            Last updated: {lastUpdated}
          </div>
        </header>

        <div className="mt-12 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Sticky TOC (desktop) */}
          <aside className="sticky top-24 hidden h-fit self-start lg:block animate-in fade-in-0 slide-in-from-left-3 duration-700">
            <nav className="rounded-2xl border border-border bg-card p-2 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
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
                Offervia is an AI career suite built for job seekers. This policy explains what we
                collect, how we use it, and the choices available to you. We do not sell your data.
              </p>
            </section>

            {[
              {
                id: "data-we-collect",
                title: "Data We Collect",
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
                title: "How Data Is Used",
                icon: Workflow,
                body: (
                  <p>
                    Your data powers features like resume tailoring, interview coaching, job description
                    scanning, and application tracking. User-submitted content is processed by Offervia’s
                    server-side integrations to generate AI outputs, and we may review aggregated product
                    metrics to improve reliability and user experience.
                  </p>
                ),
              },
              {
                id: "ai-and-security",
                title: "AI & Security",
                icon: Lock,
                body: (
                  <p>
                    Resumes, job descriptions, and chat prompts are transmitted through Offervia’s backend to
                    configured third-party AI services so we can generate tailored content and guidance. We employ
                    reasonable safeguards to protect data in transit and at rest, but no system is perfectly secure.
                  </p>
                ),
              },
              {
                id: "user-rights",
                title: "Your Rights",
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
                title: "Changes to this Policy",
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
                . We’re here to help.
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
