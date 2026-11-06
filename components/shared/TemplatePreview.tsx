"use client";

import { useMemo, useState } from "react";
import { renderTemplate } from "@/content/student-hub/templates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowSquareOut, Check, Clipboard } from "@phosphor-icons/react/dist/ssr";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  raw: string;
  vars: Record<string, string>;
};

export default function TemplatePreview({ open, onOpenChange, title, raw, vars }: Props) {
  const [copied, setCopied] = useState(false);
  const rendered = useMemo(() => renderTemplate(raw, vars), [raw, vars]);
  const gmailHref = useMemo(() => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(rendered);
    return `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
  }, [title, rendered]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(rendered);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl border border-border bg-card shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          {/* Add a visually-hidden description to satisfy aria-describedby */}
          <DialogDescription className="sr-only">
            Preview of your message with variables applied. You can copy or open it in Gmail.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border bg-background/80 p-3">
          <pre className="whitespace-pre-wrap text-sm text-foreground">{rendered}</pre>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-end">
          <div className="mr-auto text-xs text-foreground/60">
            Change the Quick fill fields to update this text.
          </div>
          <Button
            variant="outline"
            onClick={copy}
            className="border-border text-foreground hover:bg-foreground/[0.06]"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Clipboard className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
          <a href={gmailHref} target="_blank" rel="noreferrer">
            <Button className="bg-primary-button text-primary-button-foreground hover:bg-primary-button/90">
              <ArrowSquareOut className="mr-2 h-4 w-4" />
              Open in Gmail
            </Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}