import Link from "next/link";
import { Linkedin, Twitter, Github, InstagramIcon } from "lucide-react";

const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-foreground/80">
            © {YEAR} <span className="text-foreground font-semibold">Offervia</span> — A{" "}
            <span className="text-foreground/70 font-medium">PerezDev</span> Property
          </div>

          <nav aria-label="Footer" className="flex items-center gap-6 text-sm">
            <Link
              href="/privacy"
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <a
            href="https://www.linkedin.com/in/aperezrivero/"
            aria-label="LinkedIn"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border bg-background text-foreground hover:bg-foreground/[0.06] active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
            rel="noopener noreferrer"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href="https://x.com/aperez_999"
            aria-label="Twitter / X"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border bg-background text-foreground hover:bg-foreground/[0.06] active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
            rel="noopener noreferrer"
          >
            <Twitter className="h-4 w-4" />
          </a>
          <a
            href="https://github.com/aperez-999"
            aria-label="GitHub"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border bg-background text-foreground hover:bg-foreground/[0.06] active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href="https://www.instagram.com/aperezzz/"
            aria-label="Instagram"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border bg-background text-foreground hover:bg-foreground/[0.06] active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
            rel="noopener noreferrer"
          >
            <InstagramIcon className="h-4 w-4" />
          </a>
        </div>

        <p className="mt-4 text-center text-xs text-foreground/60">
          Secure • Private • Built for job seekers
        </p>

        <p className="mt-2 text-center text-[11px] text-foreground/50">
          Independently developed and maintained by{" "}
          <span className="font-medium text-foreground/70">PerezDev</span>.  
          All rights reserved.
        </p>
      </div>
    </footer>
  );
}