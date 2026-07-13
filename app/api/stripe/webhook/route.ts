import { NextResponse } from "next/server";
import { createClient as createSb } from "@supabase/supabase-js";
import { verifyStripeSignature } from "@/lib/stripe";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { payoutProducerForOrder, payoutExperienceBooking } from "@/lib/payouts";

type AdminDb = NonNullable<ReturnType<typeof admin>>;
type StripeEvent = {
  id?: string;
  type?: string;
  livemode?: boolean;
  data?: { object?: Record<string, unknown> };
};
type ExistingWebhookEvent = { status: string; updated_at: string | null };
type SupabaseResult = { error: { code?: string; message?: string } | null };

const PROCESSING_STALE_MS = 10 * 60 * 1000;

function throwIfError(result: SupabaseResult): void {
  if (result.error) throw result.error;
}

async function markOrderPaid(db: AdminDb, orderId: string, refs?: { paymentIntentId?: string | null; checkoutSessionId?: string | null }) {
  const updates: Record<string, unknown> = { payment_status: "pago", paid_at: new Date().toISOString() };
  if (refs?.paymentIntentId) updates.stripe_payment_intent_id = refs.paymentIntentId;
  if (refs?.checkoutSessionId) updates.stripe_checkout_session_id = refs.checkoutSessionId;
  const updated = await db.from("orders").update(updates).eq("id", orderId);
  throwIfError(updated);
  await payoutProducerForOrder(db, orderId);
}

async function markExperiencePaid(db: AdminDb, bookingId: string, refs?: { paymentIntentId?: string | null; checkoutSessionId?: string | null }) {
  const updates: Record<string, unknown> = { payment_status: "pago", status: "confirmado", paid_at: new Date().toISOString() };
  if (refs?.paymentIntentId) updates.stripe_payment_intent_id = refs.paymentIntentId;
  if (refs?.checkoutSessionId) updates.stripe_checkout_session_id = refs.checkoutSessionId;
  const updated = await db.from("experience_bookings").update(updates).eq("id", bookingId);
  throwIfError(updated);
  await payoutExperienceBooking(db, bookingId);
}

export const runtime = "nodejs";

// Cliente admin (service-role) — webhook não tem sessão de usuário.
function admin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) return null;
  return createSb(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function valueAsString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function metadataOf(obj: Record<string, unknown>): Record<string, string> {
  return (obj.metadata ?? {}) as Record<string, string>;
}

function defaultPlanForRole(role?: string): string {
  if (role === "cliente") return "cli_sabor";
  if (role === "entregador") return "ent_pro";
  return "campo";
}

function isStaleProcessing(updatedAt: string | null): boolean {
  if (!updatedAt) return true;
  return Date.now() - Date.parse(updatedAt) > PROCESSING_STALE_MS;
}

async function reserveStripeEvent(db: AdminDb, event: StripeEvent, obj: Record<string, unknown>): Promise<boolean> {
  if (!event.id) return true;

  const row = {
    id: event.id,
    type: event.type ?? "unknown",
    object_id: valueAsString(obj.id),
    livemode: typeof event.livemode === "boolean" ? event.livemode : null,
    status: "processing",
    error: null,
    processed_at: null,
  };

  const inserted = await db.from("stripe_webhook_events").insert(row);
  if (!inserted.error) return true;
  if (inserted.error.code !== "23505") throw inserted.error;

  const { data, error } = await db.from("stripe_webhook_events").select("status, updated_at").eq("id", event.id).maybeSingle();
  if (error) throw error;

  const existing = data as ExistingWebhookEvent | null;
  if (existing?.status === "processed") return false;
  if (existing?.status === "processing" && !isStaleProcessing(existing.updated_at)) return false;

  const updated = await db.from("stripe_webhook_events").update(row).eq("id", event.id);
  throwIfError(updated);
  return true;
}

async function markStripeEvent(db: AdminDb, eventId: string | undefined, status: "processed" | "failed", error?: unknown) {
  if (!eventId) return;
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : null;
  await db.from("stripe_webhook_events").update({
    status,
    error: status === "failed" ? message : null,
    processed_at: status === "processed" ? new Date().toISOString() : null,
  }).eq("id", eventId);
}

async function handleCheckoutSession(db: AdminDb, event: StripeEvent, obj: Record<string, unknown>) {
  const meta = metadataOf(obj);
  const mode = valueAsString(obj.mode);
  const paymentStatus = valueAsString(obj.payment_status);
  const paid = paymentStatus === "paid" || event.type === "checkout.session.async_payment_succeeded";

  if (mode === "payment") {
    if (!paid) return;
    const refs = {
      paymentIntentId: valueAsString(obj.payment_intent),
      checkoutSessionId: valueAsString(obj.id),
    };
    if (meta.order_id) await markOrderPaid(db, meta.order_id, refs);
    if (meta.booking_id) await markExperiencePaid(db, meta.booking_id, refs);
    return;
  }

  const accountId = valueAsString(obj.client_reference_id);
  if (mode === "setup" && accountId) {
    const updated = await db.from("profiles").update({ ai_card_added: true }).eq("id", accountId);
    throwIfError(updated);
    return;
  }

  if (mode === "subscription" && accountId) {
    const subscriptionId = valueAsString(obj.subscription);
    const now = new Date().toISOString();
    if (meta.kind === "experience") {
      const upserted = await db.from("experience_subscriptions").upsert(
        {
          account_id: accountId,
          plan: meta.plan || "exp_inicial",
          status: "ativa",
          stripe_subscription_id: subscriptionId,
          cancel_at_period_end: false,
          updated_at: now,
        },
        { onConflict: "account_id" }
      );
      throwIfError(upserted);
      return;
    }

    const upserted = await db.from("subscriptions").upsert(
      {
        account_id: accountId,
        plan: meta.plan || defaultPlanForRole(meta.role),
        status: "ativa",
        stripe_subscription_id: subscriptionId,
        cancel_at_period_end: false,
        updated_at: now,
      },
      { onConflict: "account_id" }
    );
    throwIfError(upserted);
  }
}

function valueAsNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stripeTimestamp(value: unknown): string | null {
  const seconds = valueAsNumber(value);
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function findOrderOrBookingByPaymentIntent(db: AdminDb, paymentIntentId: string | null) {
  if (!paymentIntentId) return { orderId: null as string | null, bookingId: null as string | null };

  const { data: order } = await db
    .from("orders")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (order?.id) return { orderId: order.id as string, bookingId: null };

  const { data: booking } = await db
    .from("experience_bookings")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  return { orderId: null, bookingId: (booking?.id as string | undefined) ?? null };
}

async function handleRefundEvent(db: AdminDb, obj: Record<string, unknown>) {
  const meta = metadataOf(obj);
  const refundId = valueAsString(obj.id);
  const paymentIntentId = valueAsString(obj.payment_intent);
  if (!refundId) return;

  const linked = await findOrderOrBookingByPaymentIntent(db, paymentIntentId);
  const orderId = meta.order_id || linked.orderId;
  const bookingId = meta.booking_id || linked.bookingId;
  const status = valueAsString(obj.status) || "pending";
  const amount = valueAsNumber(obj.amount) ?? 0;
  const currency = (valueAsString(obj.currency) || "brl").toUpperCase();

  const refundRow = {
    dispute_id: meta.dispute_id || null,
    order_id: orderId || null,
    booking_id: bookingId || null,
    stripe_refund_id: refundId,
    stripe_payment_intent_id: paymentIntentId,
    amount_cents: amount,
    currency,
    status,
    reason: valueAsString(obj.reason),
    failure_reason: valueAsString(obj.failure_reason),
  };
  const upserted = await db.from("payment_refunds").upsert(refundRow, { onConflict: "stripe_refund_id" });
  throwIfError(upserted);

  if (refundRow.dispute_id && status === "succeeded") {
    throwIfError(await db.from("disputes").update({
      status: "reembolsada",
      refunded: true,
      stripe_refund_id: refundId,
      refund_amount_cents: amount,
      resolved_at: new Date().toISOString(),
    }).eq("id", refundRow.dispute_id));
  } else if (refundRow.dispute_id && status === "failed") {
    throwIfError(await db.from("disputes").update({
      status: "em_analise",
      refunded: false,
      stripe_refund_id: refundId,
      refund_amount_cents: amount,
    }).eq("id", refundRow.dispute_id));
  }

  if (orderId && status === "succeeded") {
    throwIfError(await db.from("orders").update({ payment_status: "reembolsado", stripe_refund_id: refundId, refunded_at: new Date().toISOString(), status: "cancelado" }).eq("id", orderId));
  } else if (orderId && status === "failed") {
    throwIfError(await db.from("orders").update({ payment_status: "pago" }).eq("id", orderId));
  }

  if (bookingId && status === "succeeded") {
    throwIfError(await db.from("experience_bookings").update({ payment_status: "reembolsado", stripe_refund_id: refundId, refunded_at: new Date().toISOString(), status: "cancelado" }).eq("id", bookingId));
  } else if (bookingId && status === "failed") {
    throwIfError(await db.from("experience_bookings").update({ payment_status: "pago" }).eq("id", bookingId));
  }
}

async function handleStripeDisputeEvent(db: AdminDb, obj: Record<string, unknown>) {
  const stripeDisputeId = valueAsString(obj.id);
  if (!stripeDisputeId) return;

  const paymentIntentId = valueAsString(obj.payment_intent);
  const linked = await findOrderOrBookingByPaymentIntent(db, paymentIntentId);
  const status = valueAsString(obj.status);
  const reason = valueAsString(obj.reason);
  const raw = JSON.parse(JSON.stringify(obj));

  const upserted = await db.from("stripe_disputes").upsert({
    id: stripeDisputeId,
    charge_id: valueAsString(obj.charge),
    stripe_payment_intent_id: paymentIntentId,
    order_id: linked.orderId,
    booking_id: linked.bookingId,
    amount_cents: valueAsNumber(obj.amount),
    currency: valueAsString(obj.currency)?.toUpperCase() ?? null,
    status,
    reason,
    evidence_due_by: stripeTimestamp((obj.evidence_details as Record<string, unknown> | undefined)?.due_by),
    raw,
  });
  throwIfError(upserted);

  if (linked.orderId) {
    const existing = await db.from("disputes").select("id").eq("stripe_dispute_id", stripeDisputeId).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data?.id) {
      throwIfError(await db.from("disputes").update({ stripe_status: status, stripe_reason: reason }).eq("id", existing.data.id));
    } else {
      const { data: order } = await db.from("orders").select("customer_id").eq("id", linked.orderId).maybeSingle();
      if (!order?.customer_id) return;
      throwIfError(await db.from("disputes").insert({
        order_id: linked.orderId,
        opened_by: order.customer_id,
        opened_role: "stripe",
        reason: "cobranca",
        description: `Disputa aberta no Stripe: ${reason || "sem motivo informado"}.`,
        status: "em_analise",
        stripe_dispute_id: stripeDisputeId,
        stripe_status: status,
        stripe_reason: reason,
      }));
    }
  }
}

async function processStripeEvent(db: AdminDb, event: StripeEvent) {
  const obj = (event.data?.object ?? {}) as Record<string, unknown>;
  const meta = metadataOf(obj);

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await handleCheckoutSession(db, event, obj);
  } else if (event.type === "payment_intent.succeeded" && meta.order_id) {
    await markOrderPaid(db, meta.order_id, { paymentIntentId: valueAsString(obj.id) });
  } else if (event.type === "payment_intent.succeeded" && meta.booking_id) {
    await markExperiencePaid(db, meta.booking_id, { paymentIntentId: valueAsString(obj.id) });
  } else if (event.type === "refund.created" || event.type === "refund.updated" || event.type === "refund.failed") {
    await handleRefundEvent(db, obj);
  } else if (event.type?.startsWith("charge.dispute.")) {
    await handleStripeDisputeEvent(db, obj);
  } else if (event.type === "customer.subscription.deleted" && obj.id) {
    const subscriptionId = String(obj.id);
    throwIfError(await db.from("subscriptions").update({ status: "cancelada" }).eq("stripe_subscription_id", subscriptionId));
    throwIfError(await db.from("experience_subscriptions").update({ status: "cancelada" }).eq("stripe_subscription_id", subscriptionId));
  } else if (event.type === "customer.subscription.updated" && obj.id) {
    const subscriptionId = String(obj.id);
    const updates = { cancel_at_period_end: Boolean(obj.cancel_at_period_end), updated_at: new Date().toISOString() };
    throwIfError(await db.from("subscriptions").update(updates).eq("stripe_subscription_id", subscriptionId));
    throwIfError(await db.from("experience_subscriptions").update(updates).eq("stripe_subscription_id", subscriptionId));
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || process.env.PAYMENTS_SANDBOX_WEBHOOK_SECRET?.trim();
  if (!secret) return new NextResponse("segredo do webhook ausente", { status: 500 });
  const payload = await request.text();

  const ok = await verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret);
  if (!ok) return new NextResponse("assinatura invalida", { status: 400 });

  let event: StripeEvent;
  try { event = JSON.parse(payload) as StripeEvent; } catch { return new NextResponse("payload invalido", { status: 400 }); }

  const db = admin();
  const obj = (event.data?.object ?? {}) as Record<string, unknown>;
  if (!db) return new NextResponse("service role ausente", { status: 500 });

  try {
    const shouldProcess = await reserveStripeEvent(db, event, obj);
    if (!shouldProcess) return NextResponse.json({ received: true, duplicate: true, type: event.type ?? null });

    await processStripeEvent(db, event);
    await markStripeEvent(db, event.id, "processed");
    return NextResponse.json({ received: true, type: event.type ?? null });
  } catch (error) {
    await markStripeEvent(db, event.id, "failed", error);
    console.error("stripe webhook failed", error);
    return new NextResponse("erro ao processar webhook", { status: 500 });
  }
}
