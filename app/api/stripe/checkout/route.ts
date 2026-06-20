import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripeEnabled, createSubscriptionCheckout } from "@/lib/stripe";
import { getPlan } from "@/lib/plans";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const form = await request.formData();
  const planId = String(form.get("plan") || "");
  const plan = getPlan(planId);

  if (!stripeEnabled()) {
    return NextResponse.redirect(`${origin}/produtor/assinatura?error=stripe_off`, { status: 303 });
  }
  if (!plan || !plan.priceEnv) {
    return NextResponse.redirect(`${origin}/produtor/assinatura?error=plano_invalido`, { status: 303 });
  }
  const priceId = process.env[plan.priceEnv];
  if (!priceId) {
    return NextResponse.redirect(`${origin}/produtor/assinatura?error=price_off`, { status: 303 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`, { status: 303 });

  try {
    const url = await createSubscriptionCheckout({
      priceId,
      customerEmail: user.email ?? "",
      clientReferenceId: user.id,
      successUrl: `${origin}/api/stripe/return?plan=${plan.id}`,
      cancelUrl: `${origin}/produtor/assinatura?canceled=1`,
    });
    return NextResponse.redirect(url, { status: 303 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.redirect(`${origin}/produtor/assinatura?error=${encodeURIComponent(msg)}`, { status: 303 });
  }
}
