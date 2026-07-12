import { NextResponse } from "next/server";
import { createClient as createSb, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/config";

export const runtime = "nodejs";

type PublicMessage = {
  id: string;
  sender: "visitor" | "support";
  body: string;
  created_at: string;
};

function admin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) return null;
  return createSb(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function clean(value: unknown, max = 240) {
  return String(value ?? "").trim().slice(0, max);
}

async function sha256(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function getThread(db: SupabaseClient, threadId: string, token: string) {
  if (!threadId || !token) return null;
  const visitorTokenHash = await sha256(token);
  const { data } = await db
    .from("public_support_threads")
    .select("id, status")
    .eq("id", threadId)
    .eq("visitor_token_hash", visitorTokenHash)
    .maybeSingle();
  return data as { id: string; status: string } | null;
}

export async function GET(request: Request) {
  const db = admin();
  if (!db) return NextResponse.json({ error: "Atendimento indisponivel no momento." }, { status: 503 });

  const url = new URL(request.url);
  const threadId = clean(url.searchParams.get("thread_id"), 80);
  const token = clean(url.searchParams.get("token"), 120);
  const thread = await getThread(db, threadId, token);
  if (!thread) return NextResponse.json({ error: "Conversa nao encontrada." }, { status: 404 });

  const { data, error } = await db
    .from("public_support_messages")
    .select("id, sender, body, created_at")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Nao foi possivel carregar a conversa." }, { status: 500 });
  return NextResponse.json({ status: thread.status, messages: (data ?? []) as PublicMessage[] });
}

export async function POST(request: Request) {
  const db = admin();
  if (!db) return NextResponse.json({ error: "Atendimento indisponivel no momento." }, { status: 503 });

  let payload: { threadId?: string; token?: string; body?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
  }

  const threadId = clean(payload.threadId, 80);
  const token = clean(payload.token, 120);
  const body = clean(payload.body, 4000);
  if (body.length < 1) return NextResponse.json({ error: "Escreva uma mensagem." }, { status: 400 });

  const thread = await getThread(db, threadId, token);
  if (!thread) return NextResponse.json({ error: "Conversa nao encontrada." }, { status: 404 });
  if (thread.status === "closed") return NextResponse.json({ error: "Esta conversa foi encerrada." }, { status: 409 });

  const { error } = await db
    .from("public_support_messages")
    .insert({ thread_id: thread.id, sender: "visitor", body });

  if (error) return NextResponse.json({ error: "Nao foi possivel enviar a mensagem." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
