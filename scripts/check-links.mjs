// Checks every Student Hub link. Run with: npm run check:links
// Some sites block bots (403/429) even though the page is fine for people;
// those are reported as "blocked" so a human can open them, not as failures.
import { DEALS } from "../content/student-hub/deals.ts";
import { CATALOG } from "../content/student-hub/resources.ts";

const items = [
  ...DEALS.map((d) => ({ kind: "deal", id: d.id, url: d.url })),
  ...CATALOG.map((r) => ({ kind: "resource", id: r.id, url: r.url })),
];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

async function check(url) {
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        headers: { "user-agent": UA, accept: "text/html" },
        signal: AbortSignal.timeout(15000),
      });
      if (method === "HEAD" && (res.status === 405 || res.status === 404 || res.status === 403)) continue;
      return { status: res.status, finalUrl: res.url };
    } catch (err) {
      if (method === "GET") return { status: 0, error: err?.cause?.code || err?.name || String(err) };
    }
  }
  return { status: 0, error: "no response" };
}

const results = await Promise.all(items.map(async (it) => ({ ...it, ...(await check(it.url)) })));
let broken = 0;
for (const r of results) {
  const label =
    r.status >= 200 && r.status < 400 ? "ok     " : r.status === 403 || r.status === 429 ? "blocked" : "BROKEN ";
  if (label === "BROKEN ") broken++;
  const moved = r.finalUrl && r.finalUrl.replace(/\/$/, "") !== r.url.replace(/\/$/, "") ? `  -> ${r.finalUrl}` : "";
  console.log(`${label} ${String(r.status).padStart(3)}  ${r.kind.padEnd(8)} ${r.id.padEnd(28)} ${r.url}${moved}${r.error ? "  " + r.error : ""}`);
}
console.log(`\n${results.length} links, ${broken} broken`);
process.exitCode = broken ? 1 : 0;
