import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripeEnabled, createOrderCheckout } from "@/lib/stripe";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const form = await request.formData();
  const orderId = String(form.get("order_id") || "");

  if (!stripeEnabled()) return NextResponse.redirect(`${origin}/cliente/pagamento?error=stripe_off`, { status: 303 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`, { status: 303 });

  const { data: o } = await supabase
    .from("orders").select("id, customer_id, total_cents, payment_status").eq("id", orderId).single();
  if (!o || o.customer_id !== user.id) return NextResponse.redirect(`${origin}/cliente/pagamento?error=pedido`, { status: 303 });
  if (o.payment_status !== "pendente") return NextResponse.redirect(`${origin}/cliente/pagamento`, { status: 303 });

  const { data: prof } = await supabase.from("profiles").select("currency").eq("id", user.id).single();
  const currency = (prof?.currency as string) || "BRL";

  try {
    const url = await createOrderCheckout({
      amountCents: o.total_cents as number,
      currency,
      orderId: o.id as string,
      description: `Pedido Seravie Campo`,
      customerEmail: user.email ?? "",
      successUrl: `${origin}/cliente/pedidos?pago=1`,
      cancelUrl: `${origin}/cliente/pagamento?error=cancelado`,
    });
    return NextResponse.redirect(url, { status: 303 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.redirect(`${origin}/cliente/pagamento?error=${encodeURIComponent(msg)}`, { status: 303 });
  }
}
