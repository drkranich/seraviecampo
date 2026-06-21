import { createTransfer, stripeEnabled } from "@/lib/stripe";
import { producerCommissionPct } from "@/lib/plans";
import { courierShareCents } from "@/lib/shipping";

// db = qualquer cliente supabase (admin no webhook, autenticado na action)
/* eslint-disable @typescript-eslint/no-explicit-any */
const ACTIVE = ["active", "ativa", "ativo", "trialing"];

async function currencyOfCustomer(db: any, customerId: string): Promise<string> {
  const { data } = await db.from("profiles").select("currency").eq("id", customerId).single();
  return (data?.currency as string) || "BRL";
}

// Repasse do PRODUTOR (valor dos produtos − comissão), só se repasse "imediato".
export async function payoutProducerForOrder(db: any, orderId: string): Promise<void> {
  if (!stripeEnabled()) return;
  const { data: o } = await db.from("orders")
    .select("producer_id, customer_id, total_cents, delivery_fee_cents, payment_status, producer_paid_out")
    .eq("id", orderId).single();
  if (!o || o.payment_status !== "pago" || o.producer_paid_out) return;

  const { data: prod } = await db.from("profiles")
    .select("stripe_account_id, stripe_charges_enabled, payout_mode").eq("id", o.producer_id).single();
  if (!prod?.stripe_account_id || !prod.stripe_charges_enabled) return;
  if (prod.payout_mode !== "imediato") return; // mensal acumula (job futuro)

  const { data: sub } = await db.from("subscriptions").select("plan, status").eq("account_id", o.producer_id).maybeSingle();
  const planId = sub && sub.status && ACTIVE.includes(sub.status) ? (sub.plan as string) : "campo";
  const pct = producerCommissionPct(planId);
  const productRevenue = (o.total_cents as number) - ((o.delivery_fee_cents as number) || 0);
  const net = Math.max(0, productRevenue - Math.round((productRevenue * pct) / 100));
  if (net <= 0) return;

  const currency = await currencyOfCustomer(db, o.customer_id);
  try {
    await createTransfer({ amountCents: net, currency, destinationAccountId: prod.stripe_account_id, metadata: { order_id: orderId, kind: "producer" } });
    await db.from("orders").update({ producer_paid_out: true }).eq("id", orderId);
  } catch { /* re-tenta em outro evento */ }
}

// Repasse do FRETE para quem entregou (entregador, ou o próprio produtor se auto-entrega).
export async function payoutCourierForOrder(db: any, orderId: string): Promise<void> {
  if (!stripeEnabled()) return;
  const { data: o } = await db.from("orders")
    .select("producer_id, customer_id, delivery_person_id, self_delivery, delivery_fee_cents, payment_status, courier_paid_out")
    .eq("id", orderId).single();
  if (!o || o.payment_status !== "pago" || o.courier_paid_out) return;
  const fee = (o.delivery_fee_cents as number) || 0;
  if (fee <= 0) return;

  const recipientId = o.self_delivery ? o.producer_id : o.delivery_person_id;
  if (!recipientId) return;
  const { data: rec } = await db.from("profiles").select("stripe_account_id, stripe_charges_enabled").eq("id", recipientId).single();
  if (!rec?.stripe_account_id || !rec.stripe_charges_enabled) return;

  const net = courierShareCents(fee);
  if (net <= 0) return;
  const currency = await currencyOfCustomer(db, o.customer_id);
  try {
    await createTransfer({ amountCents: net, currency, destinationAccountId: rec.stripe_account_id, metadata: { order_id: orderId, kind: o.self_delivery ? "producer_delivery" : "courier" } });
    await db.from("orders").update({ courier_paid_out: true }).eq("id", orderId);
  } catch { /* re-tenta na conclusão */ }
}
