import { NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/stripe";

// Webhook do Stripe. Configure STRIPE_WEBHOOK_SECRET e aponte o endpoint
// para /api/stripe/webhook no painel do Stripe.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await request.text();

  if (secret) {
    const ok = await verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret);
    if (!ok) return new NextResponse("assinatura inválida", { status: 400 });
  }

  let event: { type?: string };
  try {
    event = JSON.parse(payload);
  } catch {
    return new NextResponse("payload inválido", { status: 400 });
  }

  // Eventos relevantes (account.updated, customer.subscription.*) podem ser
  // tratados aqui para atualizar profiles/subscriptions. Mantido enxuto por ora.
  return NextResponse.json({ received: true, type: event.type ?? null });
}
