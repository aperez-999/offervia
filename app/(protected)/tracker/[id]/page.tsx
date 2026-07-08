import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import { createPageMetadata } from "@/lib/metadata";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import ApplicationWorkspace, {
  type WorkspaceDoc,
  type WorkspaceScan,
} from "./ApplicationWorkspace";

export const metadata: Metadata = createPageMetadata({
  title: "Application",
  description: "Manage a single job application, its documents, and match insights.",
  path: "/tracker",
  index: false,
});

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function norm(s: string) {
  return s.trim().toLowerCase();
}

/** Best-effort match of a document/scan to this application by company/role text. */
function matchesApp(
  haystack: (string | null | undefined)[],
  company: string,
  position: string,
) {
  const hay = haystack.filter(Boolean).map((s) => norm(String(s)));
  if (hay.length === 0) return false;
  const needles = [norm(company), norm(position)].filter((n) => n.length >= 3);
  return needles.some((n) => hay.some((h) => h.includes(n) || n.includes(h)));
}

export default async function ApplicationWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user?.id) redirect("/login");

  const { data: appRow } = await supabase
    .from("applications")
    .select("id, company, position, status, applied_on, follow_up_date, notes")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!appRow) notFound();

  const company = appRow.company || "";
  const position = (appRow.position as string | null) || "";

  const [{ data: docRows }, { data: scanRows }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, kind, title, content, meta, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("job_scans")
      .select("id, title, match_score, missing_skills, strengths, summary, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const documents: WorkspaceDoc[] = (docRows ?? [])
    .filter((d) => {
      const meta = (d.meta ?? {}) as Record<string, unknown>;
      return matchesApp(
        [d.title, meta.company as string, meta.role as string],
        company,
        position,
      );
    })
    .slice(0, 20)
    .map((d) => ({
      id: d.id as string,
      kind: (d.kind as "cover_letter" | "resume") ?? "cover_letter",
      title: (d.title as string) || "Untitled",
      content: (d.content as string) || "",
      created_at: d.created_at as string,
    }));

  const scans: WorkspaceScan[] = (scanRows ?? [])
    .filter((s) => matchesApp([s.title], company, position))
    .slice(0, 3)
    .map((s) => ({
      id: s.id as string,
      title: (s.title as string | null) ?? null,
      match_score: (s.match_score as number | null) ?? null,
      missing_skills: (s.missing_skills as string[] | null) ?? null,
      strengths: (s.strengths as string[] | null) ?? null,
      summary: (s.summary as string | null) ?? null,
      created_at: s.created_at as string,
    }));

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Application"
        title={company || "Application"}
        description={position ? position : "Manage this application end to end."}
      />
      <ApplicationWorkspace
        app={{
          id: appRow.id as string,
          company,
          position,
          status: (appRow.status as string) || "Applied",
          applied_on: (appRow.applied_on as string | null) || "",
          follow_up_date: (appRow.follow_up_date as string | null) || "",
          notes: (appRow.notes as string | null) || "",
        }}
        documents={documents}
        scans={scans}
      />
    </PageContainer>
  );
}
