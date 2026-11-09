import Link from "next/link";
import { ChatCircle, GithubLogo, LinkedinLogo, XLogo } from "@phosphor-icons/react/dist/ssr";
import { DISCUSSIONS_URL, GITHUB_REPO_URL } from "@/lib/github";

const YEAR = new Date().getFullYear();

const SOCIAL = [
  { href: GITHUB_REPO_URL, label: "Offervia on GitHub", icon: GithubLogo },
  { href: "https://www.linkedin.com/in/aperezrivero/", label: "LinkedIn", icon: LinkedinLogo },
  { href: "https://x.com/aperez_999", label: "X", icon: XLogo },
  { href: "https://discord.com/users/505408019035586562", label: "Discord", icon: ChatCircle },
];

const linkClass =
  "rounded text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-foreground/70">
          © {YEAR} <span className="font-semibold text-foreground">Offervia</span> · Built by PerezDev
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
          <a href={DISCUSSIONS_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Questions &amp; feedback
          </a>
          <span className="flex items-center gap-1">
            {SOCIAL.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid size-9 place-items-center rounded-full text-foreground/70 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="size-4" aria-hidden />
              </a>
            ))}
          </span>
        </nav>
      </div>
    </footer>
  );
}
