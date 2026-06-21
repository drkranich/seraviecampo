import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripeEnabled, ensureCustomer, createSetupCheckout } from "@/lib/stripe";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (!stripeEnabled()) return NextResponse.redirect(`${origin}/produtor/ia?card=off`, { status: 303 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`, { status: 303 });

  const { data: prof } = await supabase.from("profiles").select("stripe_customer_id, full_name").eq("id", user.id).single();
  let customerId = (prof?.stripe_customer_id as string | null) ?? null;

  try {
    if (!customerId) {
      customerId = await ensureCustomer({ email: user.email ?? "", name: (prof?.full_name as string) ?? undefined });
      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }
    const url = await createSetupCheckout({
      customerId,
      clientReferenceId: user.id,
      successUrl: `${origin}/produtor/ia?card=ok`,
      cancelUrl: `${origin}/produtor/ia?card=cancel`,
    });
    return NextResponse.redirect(url, { status: 303 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.redirect(`${origin}/produtor/ia?card=erro&m=${encodeURIComponent(msg)}`, { status: 303 });
  }
}
