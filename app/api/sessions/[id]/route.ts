import { getSupabase } from "@/lib/supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BYTES = 500_000;

export async function GET(_req: Request, ctx: RouteContext<"/api/sessions/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return Response.json({ error: "Bad id" }, { status: 400 });
  const db = getSupabase();
  if (!db) return Response.json({ error: "Storage not configured" }, { status: 503 });

  const { data, error } = await db.rpc("get_session", { p_id: id });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ data });
}

export async function PUT(req: Request, ctx: RouteContext<"/api/sessions/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return Response.json({ error: "Bad id" }, { status: 400 });
  const db = getSupabase();
  if (!db) return Response.json({ error: "Storage not configured" }, { status: 503 });

  const text = await req.text();
  if (text.length > MAX_BYTES) return Response.json({ error: "Too big" }, { status: 413 });

  const { error } = await db.rpc("save_session", { p_id: id, p_data: JSON.parse(text) });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
