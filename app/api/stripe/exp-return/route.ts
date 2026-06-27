import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Retorno do Checkout de assinatura de Experiências. O webhook é a fonte de
// verdade; aqui ativamos para o fluxo imediato (teste/UX).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const planId = url.searchParams.get("plan") || "exp_inicial";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`, { status: 303 });

  await supabase.from("experience_subscriptions").upsert(
    { account_id: user.id, plan: planId, status: "ativa", updated_at: new Date().toISOString() },
    { onConflict: "account_id" }
  );

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const area = prof?.role === "parceiro" ? "/parceiro/experiencias" : "/produtor/experiencias";
  return NextResponse.redirect(`${origin}${area}?ok=plano`, { status: 303 });
}
