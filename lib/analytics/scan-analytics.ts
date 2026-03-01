import { getServiceSupabase } from "@/lib/supabase/service";

export type ScanAnalytics = {
  totalScans: number;
  averageScore: number;
  bestScore: number;
  improvement: number | null;
  scanHistory: { score: number; created_at: string }[];
};

export async function buildScanAnalytics(userId: string): Promise<ScanAnalytics | null> {
  const supabase = getServiceSupabase();
  const { data: scans } = await supabase
    .from("job_scans")
    .select("match_score, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const list = scans ?? [];
  if (list.length === 0) return null;

  const totalScans = list.length;
  const averageScore = Math.round(
    list.reduce((sum, s) => sum + (Number(s.match_score) || 0), 0) / totalScans
  );
  const bestScore = Math.max(...list.map((s) => Number(s.match_score) || 0));

  let improvement: number | null = null;
  if (totalScans >= 6) {
    const firstFive = list.slice(0, 5);
    const lastFive = list.slice(-5);
    const firstFiveAvg =
      firstFive.reduce((sum, s) => sum + (Number(s.match_score) || 0), 0) / firstFive.length;
    const lastFiveAvg =
      lastFive.reduce((sum, s) => sum + (Number(s.match_score) || 0), 0) / lastFive.length;
    improvement = Math.round((lastFiveAvg - firstFiveAvg) * 10) / 10;
  }

  const scanHistory = list.map((s) => ({
    score: Number(s.match_score) || 0,
    created_at:
      typeof s.created_at === "string" ? s.created_at : new Date(s.created_at).toISOString(),
  }));

  return {
    totalScans,
    averageScore,
    bestScore,
    improvement,
    scanHistory,
  };
}
