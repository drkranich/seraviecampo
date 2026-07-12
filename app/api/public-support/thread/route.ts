import { NextResponse } from "next/server";
import { createClient as createSb } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/config";

export const runtime = "nodejs";

type StartPayload = {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  sourcePath?: string;
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

export async function POST(request: Request) {
  const db = admin();
  if (!db) return NextResponse.json({ error: "Atendimento indisponivel no momento." }, { status: 503 });

  let payload: StartPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
  }

  const message = clean(payload.message, 4000);
  if (message.length < 2) return NextResponse.json({ error: "Escreva uma mensagem para iniciar a conversa." }, { status: 400 });

  const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  const visitorTokenHash = await sha256(token);

  const { data: thread, error: threadError } = await db
    .from("public_support_threads")
    .insert({
      visitor_token_hash: visitorTokenHash,
      visitor_name: clean(payload.name, 120) || null,
      visitor_email: clean(payload.email, 160) || null,
      visitor_phone: clean(payload.phone, 60) || null,
      subject: clean(payload.subject, 160) || "Atendimento pelo site",
      source_path: clean(payload.sourcePath, 300) || null,
    })
    .select("id")
    .single();

  if (threadError || !thread) return NextResponse.json({ error: "Nao foi possivel iniciar a conversa." }, { status: 500 });

  const { error: messageError } = await db
    .from("public_support_messages")
    .insert({ thread_id: thread.id, sender: "visitor", body: message });

  if (messageError) return NextResponse.json({ error: "Nao foi possivel enviar a mensagem." }, { status: 500 });

  return NextResponse.json({ threadId: thread.id, token });
}
