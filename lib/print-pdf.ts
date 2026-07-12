/**
 * Dependency-free "export to PDF": render the content in a hidden, same-origin
 * iframe and trigger the browser's native print dialog (where the user picks
 * "Save as PDF"). Using an iframe instead of window.open avoids popup blockers
 * and the `noopener` gotcha that returns a null window (which surfaced as a
 * blank about:blank popup). Client-only — must run in a browser context.
 */

const FRAME_ID = "__offervia_print_frame__";

function escapeHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Print a complete HTML document string via a hidden iframe.
 * Returns false if it can't run (SSR / no document body).
 */
export function printHtmlDocument(html: string): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  document.getElementById(FRAME_ID)?.remove();

  const iframe = document.createElement("iframe");
  iframe.id = FRAME_ID;
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document;
  if (!frameDoc) {
    iframe.remove();
    return false;
  }

  let printed = false;
  const cleanup = () => {
    document.getElementById(FRAME_ID)?.remove();
  };

  const doPrint = () => {
    if (printed) return;
    printed = true;
    const cw = iframe.contentWindow;
    if (!cw) return;
    try {
      cw.focus();
      cw.addEventListener?.("afterprint", () => setTimeout(cleanup, 300));
      cw.print();
    } catch {
      // Fall through to the safety-net cleanup below.
    }
    setTimeout(cleanup, 60_000);
  };

  iframe.onload = () => setTimeout(doPrint, 200);

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  // Fallback: some engines don't fire onload for document.write content.
  setTimeout(doPrint, 700);

  return true;
}

/**
 * Print plain text content (preserving line breaks) as a clean document.
 */
export function printAsPdf(title: string, content: string): boolean {
  const safeBody = escapeHtml(content);
  const safeTitle = (title || "Document").replace(/[<>]/g, "");
  const html = `<!doctype html><html><head><meta charset="utf-8" />
    <title>${safeTitle}</title>
    <style>
      @page { margin: 24mm; }
      html, body { margin: 0; }
      body { font: 12pt/1.6 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111; white-space: pre-wrap; word-wrap: break-word; }
    </style></head><body>${safeBody}</body></html>`;
  return printHtmlDocument(html);
}
