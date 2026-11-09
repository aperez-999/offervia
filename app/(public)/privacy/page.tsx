import Link from "next/link";
import Footer from "@/components/public/Footer";
import { DISCUSSIONS_URL, GITHUB_REPO_URL } from "@/lib/github";

const UPDATED = "November 4, 2026";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-border pt-8">
      <h2 id={`${id}-title`} className="font-display text-xl font-semibold text-foreground">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-foreground/80 [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

const link = "font-medium text-primary underline-offset-4 hover:underline";

export default function PrivacyPage() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
        <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] font-bold tracking-[-0.025em] text-foreground">
          Privacy and terms
        </h1>
        <p className="mt-3 text-[15px] text-foreground/75">
          The short version: we keep what the app needs to work, we never sell it, and you can export or
          delete it yourself at any time. Last updated {UPDATED}.
        </p>

        <div className="mt-10 space-y-10">
          <Section id="what-we-keep" title="What we keep">
            <p>When you make an account, we store:</p>
            <ul>
              <li>Your email, name, and profile photo, plus anything you add to your profile, including My resume.</li>
              <li>Applications in your tracker, with their dates and notes.</li>
              <li>Resumes and cover letters you save, keyword scans, and your interview and coach conversations.</li>
              <li>Your preferences, and counts of how often you use each tool (used for daily limits).</li>
              <li>A short log of requests with IP address and browser type, used to stop abuse.</li>
            </ul>
            <p>
              Some things stay only in your browser and never reach our servers: bullet check text, offer
              comparisons, template details you fill in, and unfinished drafts.
            </p>
          </Section>

          <Section id="who-sees-it" title="Who else sees it">
            <ul>
              <li>
                <strong className="text-foreground">Groq</strong> receives the resume text, job descriptions, and
                messages you send to the scanner, resume tailor, cover letter, mock interview, and coach, so it
                can write a response. Their own privacy policy covers how they handle it.
              </li>
              <li>
                <strong className="text-foreground">Supabase</strong> stores your account and data, and handles
                sign-in, including Google or LinkedIn if you use them.
              </li>
              <li>
                <strong className="text-foreground">Vercel</strong> hosts the site and counts page views without
                cookies. If error reporting is turned on, <strong className="text-foreground">Sentry</strong>{" "}
                receives technical details when something breaks.
              </li>
            </ul>
            <p>We don&apos;t sell your data, show ads, or share it with anyone else.</p>
          </Section>

          <Section id="your-control" title="Your control">
            <ul>
              <li>
                Download everything in <Link href="/settings#data" className={link}>Settings → Data &amp; privacy</Link>.
              </li>
              <li>
                Delete your account there too. It removes your account and everything tied to it right away,
                and it can&apos;t be undone.
              </li>
              <li>Edit or remove My resume and your profile details any time on your Profile.</li>
            </ul>
            <p>We only use the cookies needed to keep you signed in.</p>
          </Section>

          <Section id="using-offervia" title="Using Offervia">
            <ul>
              <li>Offervia is free and provided as is. It can change or go offline without notice.</li>
              <li>
                Rewritten resumes, letters, and feedback can be wrong. Read everything and fix anything
                that isn&apos;t true before you send it. You&apos;re responsible for what you submit.
              </li>
              <li>
                Some tools have a daily limit so the site stays quick for everyone. Don&apos;t try to get around
                it or use the site to send spam.
              </li>
              <li>
                The code is open source on{" "}
                <a href={GITHUB_REPO_URL} className={link} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
                .
              </li>
            </ul>
          </Section>

          <Section id="questions" title="Questions">
            <p>
              Ask in{" "}
              <a href={DISCUSSIONS_URL} className={link} target="_blank" rel="noopener noreferrer">
                GitHub Discussions
              </a>
              . Discussions are public, so don&apos;t post your email, resume, or other personal details there.
              To get or remove your data, use Settings.
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}
