import { NextResponse } from "next/server";
import { createClient as createSb } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { runMonthlyJob } from "@/lib/payouts";

export const runtime = "nodejs";

async function handle(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") || "";
  const key = new URL(req.url).searchParams.get("key");
  if (!secret || (auth !== `Bearer ${secret}` && key !== secret)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!svc) return NextResponse.json({ error: "Service role ausente." }, { status: 500 });
  const db = createSb(SUPABASE_URL, svc, { auth: { persistSession: false, autoRefreshToken: false } });
  const r = await runMonthlyJob(db);
  return NextResponse.json({ ok: true, ...r });
}

export const POST = handle;
export const GET = handle;
