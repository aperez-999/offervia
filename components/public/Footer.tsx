import Link from "next/link";
import { Linkedin, Twitter, Github, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-gray-700">© {new Date().getFullYear()} Offervia</div>
          <nav className="flex items-center gap-4 text-sm text-gray-600">
            <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-900">Terms of Service</Link>
            <Link href="/contact" className="hover:text-gray-900">Contact</Link>
          </nav>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-gray-500">
          <a href="#" aria-label="LinkedIn" className="transition hover:opacity-80"><Linkedin className="h-4 w-4" /></a>
          <a href="#" aria-label="Twitter/X" className="transition hover:opacity-80"><Twitter className="h-4 w-4" /></a>
          <a href="#" aria-label="GitHub" className="transition hover:opacity-80"><Github className="h-4 w-4" /></a>
          <a href="#" aria-label="Discord" className="transition hover:opacity-80"><MessageCircle className="h-4 w-4" /></a>
        </div>
      </div>
    </footer>
  );
}
