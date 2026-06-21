import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlan, planArea } from "@/lib/plans";

// Retorno do Checkout. O webhook é a fonte de verdade em produção;
// aqui marcamos a assinatura como ativa para o fluxo de teste.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const planId = url.searchParams.get("plan") || "campo";
  const plan = getPlan(planId);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`, { status: 303 });

  await supabase.from("subscriptions").upsert(
    { account_id: user.id, plan: plan?.id ?? "campo", status: "ativa" },
    { onConflict: "account_id" }
  );

  return NextResponse.redirect(`${origin}${planArea(plan?.id)}?ok=1`, { status: 303 });
}
