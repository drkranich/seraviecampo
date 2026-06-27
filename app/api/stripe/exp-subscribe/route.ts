import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripeEnabled, createSubscriptionCheckout } from "@/lib/stripe";
import { getPlanById, effectivePriceId } from "@/lib/plans-db";

export const runtime = "nodejs";

function areaOf(role: string | null | undefined): string {
  return role === "parceiro" ? "/parceiro/experiencias" : "/produtor/experiencias";
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const form = await request.formData();
  const planId = String(form.get("plan") || "");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`, { status: 303 });

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const area = areaOf(prof?.role as string | null);

  const plan = await getPlanById(supabase, planId);
  if (!plan || plan.role !== "experiencias") {
    return NextResponse.redirect(`${origin}${area}?error=${encodeURIComponent("Plano inválido.")}`, { status: 303 });
  }

  // Plano gratuito (Inicial) — ativa direto, sem Stripe.
  if ((plan.price_cents ?? 0) <= 0) {
    await supabase.from("experience_subscriptions").upsert(
      { account_id: user.id, plan: plan.id, status: "ativa", stripe_subscription_id: null, cancel_at_period_end: false, updated_at: new Date().toISOString() },
      { onConflict: "account_id" }
    );
    return NextResponse.redirect(`${origin}${area}?ok=plano`, { status: 303 });
  }

  if (!stripeEnabled()) return NextResponse.redirect(`${origin}${area}?error=stripe_off`, { status: 303 });
  const priceId = effectivePriceId(plan);
  if (!priceId) return NextResponse.redirect(`${origin}${area}?error=${encodeURIComponent("Preço não configurado.")}`, { status: 303 });

  try {
    const url = await createSubscriptionCheckout({
      priceId,
      customerEmail: user.email ?? "",
      clientReferenceId: user.id,
      successUrl: `${origin}/api/stripe/exp-return?plan=${plan.id}`,
      cancelUrl: `${origin}${area}?canceled=1`,
      metadata: { kind: "experience", plan: plan.id },
    });
    return NextResponse.redirect(url, { status: 303 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.redirect(`${origin}${area}?error=${encodeURIComponent(msg)}`, { status: 303 });
  }
}
