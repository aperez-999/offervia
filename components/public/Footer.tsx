import Link from "next/link";
import { Linkedin, Twitter, Github, MessageCircleIcon } from "lucide-react";

const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-foreground/80">
            © {YEAR} <span className="text-foreground font-semibold">Offervia</span>. Built by{" "}
            <span className="text-foreground/70 font-medium">PerezDev</span>.
          </div>

          <nav aria-label="Footer" className="flex items-center gap-6 text-sm">
            <Link
              href="/privacy"
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              Terms
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
            target="_blank"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border bg-background text-foreground hover:bg-primary/10 hover:text-primary hover:ring-primary/40 active:scale-95 transition-all motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            rel="noopener noreferrer"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href="https://x.com/aperez_999"
            aria-label="Twitter / X"
            target="_blank"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border bg-background text-foreground hover:bg-primary/10 hover:text-primary hover:ring-primary/40 active:scale-95 transition-all motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            rel="noopener noreferrer"
          >
            <Twitter className="h-4 w-4" />
          </a>
          <a
            href="https://github.com/aperez-999/offervia"
            aria-label="Source code on GitHub"
            target="_blank"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border bg-background text-foreground hover:bg-primary/10 hover:text-primary hover:ring-primary/40 active:scale-95 transition-all motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href="https://discord.com/users/505408019035586562"
            aria-label="Discord"
            target="_blank"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border bg-background text-foreground hover:bg-primary/10 hover:text-primary hover:ring-primary/40 active:scale-95 transition-all motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            rel="noopener noreferrer"
          >
            <MessageCircleIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}