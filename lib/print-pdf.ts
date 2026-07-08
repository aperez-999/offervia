/**
 * Dependency-free "export to PDF": open a clean printable window and trigger the
 * browser's native print dialog, where the user can choose "Save as PDF".
 * Client-only — must be called from a browser context.
 */
export function printAsPdf(title: string, content: string) {
  const w = window.open("", "_blank", "noopener,noreferrer,width=800,height=1000");
  if (!w) return;
  const safeBody = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const safeTitle = (title || "Document").replace(/[<>]/g, "");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8" />
    <title>${safeTitle}</title>
    <style>
      @page { margin: 24mm; }
      body { font: 12pt/1.6 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111; white-space: pre-wrap; }
    </style></head><body>${safeBody}</body></html>`);
  w.document.close();
  w.focus();
  // Give the new document a tick to render before printing.
  setTimeout(() => w.print(), 250);
}
