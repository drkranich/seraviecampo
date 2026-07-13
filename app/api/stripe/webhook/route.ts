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

async function markOrderPaid(db: AdminDb, orderId: string) {
  const updated = await db.from("orders").update({ payment_status: "pago", paid_at: new Date().toISOString() }).eq("id", orderId);
  throwIfError(updated);
  await payoutProducerForOrder(db, orderId);
}

async function markExperiencePaid(db: AdminDb, bookingId: string) {
  const updated = await db.from("experience_bookings").update({ payment_status: "pago", status: "confirmado", paid_at: new Date().toISOString() }).eq("id", bookingId);
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
    if (meta.order_id) await markOrderPaid(db, meta.order_id);
    if (meta.booking_id) await markExperiencePaid(db, meta.booking_id);
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

async function processStripeEvent(db: AdminDb, event: StripeEvent) {
  const obj = (event.data?.object ?? {}) as Record<string, unknown>;
  const meta = metadataOf(obj);

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await handleCheckoutSession(db, event, obj);
  } else if (event.type === "payment_intent.succeeded" && meta.order_id) {
    await markOrderPaid(db, meta.order_id);
  } else if (event.type === "payment_intent.succeeded" && meta.booking_id) {
    await markExperiencePaid(db, meta.booking_id);
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
