// Placeholder route for /api/tracker supporting GET|POST|PATCH|DELETE
// TODO: Use Supabase server client with RLS; operate only on rows where user_id = auth.uid()
export async function GET() {
  return Response.json({ message: "TODO: implement GET /api/tracker" });
}

export async function POST() {
  return Response.json({ message: "TODO: implement POST /api/tracker" });
}

export async function PATCH() {
  return Response.json({ message: "TODO: implement PATCH /api/tracker" });
}

export async function DELETE() {
  return Response.json({ message: "TODO: implement DELETE /api/tracker" });
}
