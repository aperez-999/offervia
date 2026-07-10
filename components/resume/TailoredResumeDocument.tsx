"use client";

/**
 * Parses the AI "template mode" resume text into a structured document and
 * renders it with real resume typography. The same parser powers the
 * print-to-PDF serializer so the on-screen preview and the exported file match.
 */

const KNOWN_HEADINGS = new Set([
  "PROFESSIONAL SUMMARY",
  "SUMMARY",
  "PROFILE",
  "OBJECTIVE",
  "CAREER OBJECTIVE",
  "CORE SKILLS",
  "SKILLS",
  "TECHNICAL SKILLS",
  "KEY SKILLS",
  "EXPERIENCE",
  "PROFESSIONAL EXPERIENCE",
  "WORK EXPERIENCE",
  "EMPLOYMENT",
  "EMPLOYMENT HISTORY",
  "PROJECTS",
  "KEY PROJECTS",
  "SELECTED PROJECTS",
  "EDUCATION",
  "CERTIFICATIONS",
  "CERTIFICATION",
  "LICENSES",
  "AWARDS",
  "HONORS",
  "ACHIEVEMENTS",
  "PUBLICATIONS",
  "LANGUAGES",
  "INTERESTS",
  "VOLUNTEER",
  "VOLUNTEER EXPERIENCE",
  "ADDITIONAL",
  "ADDITIONAL INFORMATION",
  "REFERENCES",
]);

const PARAGRAPH_SECTIONS = new Set([
  "PROFESSIONAL SUMMARY",
  "SUMMARY",
  "PROFILE",
  "OBJECTIVE",
  "CAREER OBJECTIVE",
]);

type ResumeItem =
  | { type: "bullet"; text: string }
  | { type: "text"; text: string }
  | { type: "subhead"; text: string }
  | { type: "label"; label: string; text: string };

type ResumeSection = { heading: string; paragraph: boolean; items: ResumeItem[] };

export type ParsedResume = {
  name: string;
  contacts: string[];
  sections: ResumeSection[];
};

function headingKey(line: string): string {
  return line.trim().replace(/:$/, "").toUpperCase();
}

function isKnownHeading(line: string): boolean {
  return KNOWN_HEADINGS.has(headingKey(line));
}

function isHeading(line: string): boolean {
  const t = line.trim().replace(/:$/, "");
  if (!t || t.length > 42) return false;
  if (KNOWN_HEADINGS.has(t.toUpperCase())) return true;
  // Generic: all-caps line (letters present, no lowercase), short.
  const hasLetter = /[A-Za-z]/.test(t);
  const hasLower = /[a-z]/.test(t);
  return hasLetter && !hasLower && t.split(/\s+/).length <= 5;
}

function stripBullet(line: string): string | null {
  const m = line.match(/^\s*([*\-•▪◦·])\s+(.*)$/);
  return m ? m[2].trim() : null;
}

export function parseResume(raw: string): ParsedResume {
  const lines = (raw || "")
    .replace(/\r\n/g, "\n")
    .replace(/\*\*/g, "")
    .split("\n")
    .map((l) => l.replace(/\s+$/g, ""));

  // Split header (before the first *known* heading) from the rest. Using
  // known headings only prevents an ALL-CAPS name line from being mistaken
  // for a section heading and swallowing the contact block.
  let firstHeadingIdx = lines.findIndex((l) => l.trim() && isKnownHeading(l));
  if (firstHeadingIdx === -1) firstHeadingIdx = lines.length;

  const headerLines = lines.slice(0, firstHeadingIdx).map((l) => l.trim()).filter(Boolean);
  const name = headerLines[0] || "";
  const contacts = headerLines
    .slice(1)
    .flatMap((l) => l.split(/\s*[|•·]\s*/))
    .map((c) => c.trim())
    .filter(Boolean);

  const sections: ResumeSection[] = [];
  let current: ResumeSection | null = null;

  for (const rawLine of lines.slice(firstHeadingIdx)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (isHeading(line)) {
      const heading = line.replace(/:$/, "").trim();
      current = {
        heading,
        paragraph: PARAGRAPH_SECTIONS.has(heading.toUpperCase()),
        items: [],
      };
      sections.push(current);
      continue;
    }

    if (!current) {
      current = { heading: "", paragraph: true, items: [] };
      sections.push(current);
    }

    const bullet = stripBullet(line);
    if (bullet !== null) {
      current.items.push({ type: "bullet", text: bullet });
      continue;
    }

    if (current.paragraph) {
      current.items.push({ type: "text", text: line });
      continue;
    }

    // "Label: value" (skills categories, etc.)
    const colon = line.match(/^([^:]{2,32}):\s+(.*)$/);
    if (colon) {
      current.items.push({ type: "label", label: colon[1].trim(), text: colon[2].trim() });
      continue;
    }

    current.items.push({ type: "subhead", text: line });
  }

  return { name, contacts, sections };
}

export function isLikelyStructuredResume(raw: string): boolean {
  const parsed = parseResume(raw);
  return Boolean(parsed.name) && parsed.sections.length >= 2;
}

export function ResumeDocument({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const doc = parseResume(text);

  return (
    <div
      className={`resume-paper mx-auto w-full max-w-[8.5in] bg-white px-8 py-9 font-serif text-[13px] leading-relaxed text-neutral-900 shadow-sm sm:px-10 ${className}`}
    >
      {doc.name && (
        <h1 className="text-center text-2xl font-bold tracking-tight text-neutral-900">
          {doc.name}
        </h1>
      )}
      {doc.contacts.length > 0 && (
        <p className="mt-1 text-center text-[11px] text-neutral-600">
          {doc.contacts.join("  •  ")}
        </p>
      )}

      {doc.sections.map((section, si) => (
        <section key={`${section.heading}-${si}`} className="mt-5">
          {section.heading && (
            <h2 className="mb-2 border-b border-neutral-300 pb-1 text-[12px] font-bold uppercase tracking-[0.08em] text-neutral-800">
              {section.heading}
            </h2>
          )}
          <div className="space-y-1.5">
            {(() => {
              const nodes: React.ReactNode[] = [];
              let bulletBuffer: string[] = [];
              const flush = (key: string) => {
                if (bulletBuffer.length === 0) return;
                nodes.push(
                  <ul key={key} className="ml-4 list-disc space-y-1 marker:text-neutral-400">
                    {bulletBuffer.map((b, i) => (
                      <li key={i} className="pl-1 text-neutral-800">
                        {b}
                      </li>
                    ))}
                  </ul>
                );
                bulletBuffer = [];
              };

              section.items.forEach((item, ii) => {
                if (item.type === "bullet") {
                  bulletBuffer.push(item.text);
                  return;
                }
                flush(`ul-${si}-${ii}`);
                if (item.type === "subhead") {
                  nodes.push(
                    <p key={`sh-${ii}`} className="mt-2 font-semibold text-neutral-900">
                      {item.text}
                    </p>
                  );
                } else if (item.type === "label") {
                  nodes.push(
                    <p key={`lb-${ii}`} className="text-neutral-800">
                      <span className="font-semibold text-neutral-900">{item.label}:</span>{" "}
                      {item.text}
                    </p>
                  );
                } else {
                  nodes.push(
                    <p key={`tx-${ii}`} className="text-neutral-800">
                      {item.text}
                    </p>
                  );
                }
              });
              flush(`ul-${si}-end`);
              return nodes;
            })()}
          </div>
        </section>
      ))}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Serializes parsed resume to a standalone printable HTML document (for Save as PDF). */
export function resumeToPrintHtml(raw: string, title = "Tailored Resume"): string {
  const doc = parseResume(raw);
  const parts: string[] = [];

  if (doc.name) parts.push(`<h1>${escapeHtml(doc.name)}</h1>`);
  if (doc.contacts.length) {
    parts.push(`<p class="contact">${doc.contacts.map(escapeHtml).join("  &bull;  ")}</p>`);
  }

  for (const section of doc.sections) {
    parts.push(`<section>`);
    if (section.heading) parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
    let inList = false;
    const closeList = () => {
      if (inList) {
        parts.push(`</ul>`);
        inList = false;
      }
    };
    for (const item of section.items) {
      if (item.type === "bullet") {
        if (!inList) {
          parts.push(`<ul>`);
          inList = true;
        }
        parts.push(`<li>${escapeHtml(item.text)}</li>`);
      } else {
        closeList();
        if (item.type === "subhead") parts.push(`<p class="subhead">${escapeHtml(item.text)}</p>`);
        else if (item.type === "label")
          parts.push(
            `<p><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.text)}</p>`
          );
        else parts.push(`<p>${escapeHtml(item.text)}</p>`);
      }
    }
    closeList();
    parts.push(`</section>`);
  }

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    title
  )}</title><style>
    @page { size: letter; margin: 0.6in; }
    * { box-sizing: border-box; }
    body { font-family: Georgia, "Times New Roman", serif; color: #171717; font-size: 12.5px; line-height: 1.5; margin: 0; }
    h1 { text-align: center; font-size: 22px; margin: 0 0 2px; letter-spacing: -0.01em; }
    .contact { text-align: center; font-size: 11px; color: #525252; margin: 0 0 6px; }
    section { margin-top: 16px; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #d4d4d4; padding-bottom: 3px; margin: 0 0 7px; }
    p { margin: 2px 0; }
    p.subhead { font-weight: 700; margin-top: 8px; }
    ul { margin: 4px 0 6px; padding-left: 18px; }
    li { margin: 2px 0; }
  </style></head><body>${parts.join("")}</body></html>`;
}
