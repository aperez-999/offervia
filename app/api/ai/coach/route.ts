export const dynamic = "force-dynamic";

// Placeholder route for POST /api/ai/coach
// TODO: Implement STAR-structured coach with response length guard (<=120 words)
export async function POST(_req: Request) {
  return Response.json({ message: "TODO: implement /api/ai/coach" });
}
