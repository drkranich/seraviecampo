import { NextResponse } from "next/server";
import { createClient as createSb } from "@supabase/supabase-js";
import { verifyStripeSignature } from "@/lib/stripe";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { payoutProducerForOrder } from "@/lib/payouts";

export const runtime = "nodejs";

// Cliente admin (service-role) — webhook não tem sessão de usuário.
function admin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) return null;
  return createSb(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const payload = await request.text();

  if (secret) {
    const ok = await verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret);
    if (!ok) return new NextResponse("assinatura inválida", { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try { event = JSON.parse(payload); } catch { return new NextResponse("payload inválido", { status: 400 }); }

  const db = admin();
  const obj = (event.data?.object ?? {}) as Record<string, unknown>;
  const meta = (obj.metadata ?? {}) as Record<string, string>;

  try {
    if (!db) {
      // Sem service-role não há como escrever; apenas confirma o recebimento.
      return NextResponse.json({ received: true, note: "service role ausente", type: event.type ?? null });
    }

    if (event.type === "checkout.session.completed") {
      if (obj.mode === "payment" && meta.order_id) {
        await db.from("orders").update({ payment_status: "pago", paid_at: new Date().toISOString() }).eq("id", meta.order_id);
        await payoutProducerForOrder(db, meta.order_id);
      }
      if (obj.mode === "setup" && obj.client_reference_id) {
        await db.from("profiles").update({ ai_card_added: true }).eq("id", obj.client_reference_id as string);
      }
      if (obj.mode === "subscription" && obj.client_reference_id) {
        await db.from("subscriptions").upsert(
          { account_id: obj.client_reference_id as string, status: "ativa", stripe_subscription_id: (obj.subscription as string) ?? null, cancel_at_period_end: false },
          { onConflict: "account_id" }
        );
      }
    } else if (event.type === "payment_intent.succeeded" && meta.order_id) {
      await db.from("orders").update({ payment_status: "pago", paid_at: new Date().toISOString() }).eq("id", meta.order_id);
      await payoutProducerForOrder(db, meta.order_id);
    } else if (event.type === "customer.subscription.deleted" && obj.id) {
      await db.from("subscriptions").update({ status: "cancelada" }).eq("stripe_subscription_id", obj.id as string);
    } else if (event.type === "customer.subscription.updated" && obj.id) {
      await db.from("subscriptions").update({ cancel_at_period_end: !!obj.cancel_at_period_end }).eq("stripe_subscription_id", obj.id as string);
    }
  } catch {
    /* não falhar o webhook por erro de escrita; Stripe re-tenta */
  }

  return NextResponse.json({ received: true, type: event.type ?? null });
}
