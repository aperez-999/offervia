import { getServiceSupabase } from "@/lib/supabase/service";

export type DocumentKind = "cover_letter" | "resume";

/**
 * Best-effort save of a generated document. Never throws — if the documents
 * table hasn't been migrated yet, generation must still succeed.
 */
export async function saveDocument(input: {
  userId: string;
  kind: DocumentKind;
  title: string;
  content: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = getServiceSupabase();
    await supabase.from("documents").insert({
      user_id: input.userId,
      kind: input.kind,
      title: (input.title || "Untitled").slice(0, 200),
      content: input.content,
      meta: input.meta ?? {},
    });
  } catch {
    // Swallow: saving history is non-critical.
  }
}
