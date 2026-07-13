"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/guard";
import { createRefund, createTransferReversal } from "@/lib/stripe";

type DbResult = { error: { message: string } | null };

function ensureDb(result: DbResult): void {
  if (result.error) redirect("/admin/disputas?error=" + encodeURIComponent(result.error.message));
}

export async function openDispute(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const orderId = String(formData.get("order_id") || "");
  const reason = String(formData.get("reason") || "outro");
  const description = String(formData.get("description") || "").trim() || null;
  const back = String(formData.get("back") || "/cliente/pedidos");

  const { data: o } = await supabase
    .from("orders").select("customer_id, producer_id, delivery_person_id").eq("id", orderId).single();
  if (!o) redirect(`${back}?error=` + encodeURIComponent("Pedido não encontrado."));

  let role = "";
  if (o.customer_id === user.id) role = "cliente";
  else if (o.producer_id === user.id) role = "produtor";
  else if (o.delivery_person_id === user.id) role = "entregador";
  else redirect(`${back}?error=` + encodeURIComponent("Você não participa deste pedido."));

  const { error } = await supabase.from("disputes").insert({
    order_id: orderId, opened_by: user.id, opened_role: role, reason, description,
  });
  if (error) redirect(`${back}?error=` + encodeURIComponent(error.message));

  revalidatePath(back);
  revalidatePath("/admin/disputas");
  redirect(`${back}?disputa=1`);
}

export async function resolveDispute(formData: FormData) {
  const { user } = await requireRole("super_admin");
  const supabase = createServiceClient();

  const id = String(formData.get("dispute_id") || "");
  const decision = String(formData.get("decision") || ""); // reembolsar | encerrar | recusar
  const note = String(formData.get("note") || "").trim() || null;

  const { data: d } = await supabase
    .from("disputes")
    .select("id, order_id, stripe_refund_id, order:orders(id, total_cents, payment_status, stripe_payment_intent_id, stripe_refund_id)")
    .eq("id", id)
    .single();
  if (!d) redirect("/admin/disputas?error=" + encodeURIComponent("Disputa não encontrada."));

  const order = Array.isArray(d.order) ? d.order[0] : d.order;
  if (!order) redirect("/admin/disputas?error=" + encodeURIComponent("Pedido não encontrado."));

  if (decision === "reembolsar") {
    if (d.stripe_refund_id || order.stripe_refund_id) {
      redirect("/admin/disputas?error=" + encodeURIComponent("Este pedido já possui reembolso Stripe registrado."));
    }
    if (!order.stripe_payment_intent_id) {
      redirect("/admin/disputas?error=" + encodeURIComponent("Este pedido ainda não tem PaymentIntent Stripe salvo; não é seguro reembolsar automaticamente."));
    }

    const refund = await createRefund({
      paymentIntentId: order.stripe_payment_intent_id,
      amountCents: order.total_cents,
      reason: "requested_by_customer",
      metadata: { dispute_id: id, order_id: d.order_id },
      idempotencyKey: `seravie-refund-dispute-${id}`,
    });

    const refunded = refund.status === "succeeded";
    ensureDb(await supabase.from("payment_refunds").upsert(
      {
        dispute_id: id,
        order_id: d.order_id,
        stripe_refund_id: refund.id,
        stripe_payment_intent_id: order.stripe_payment_intent_id,
        amount_cents: order.total_cents,
        currency: "BRL",
        status: refund.status ?? "pending",
        reason: "requested_by_customer",
        created_by: user.id,
      },
      { onConflict: "stripe_refund_id" }
    ));

    ensureDb(await supabase.from("disputes").update({
      status: refunded ? "reembolsada" : "em_analise",
      refunded,
      stripe_refund_id: refund.id,
      refund_amount_cents: order.total_cents,
      resolution_note: note,
      resolved_at: refunded ? new Date().toISOString() : null,
    }).eq("id", id));

    ensureDb(await supabase.from("orders").update({
      payment_status: refunded ? "reembolsado" : "reembolso_pendente",
      status: "cancelado",
      stripe_refund_id: refund.id,
      refunded_at: refunded ? new Date().toISOString() : null,
    }).eq("id", d.order_id));

    await reverseOrderTransfers(supabase, d.order_id, id);
  } else {
    let status = "em_analise";
    if (decision === "encerrar") status = "encerrada_sem_reembolso";
    else if (decision === "recusar") status = "recusada";

    ensureDb(await supabase.from("disputes").update({
      status, refunded: false, resolution_note: note, resolved_at: new Date().toISOString(),
    }).eq("id", id));
  }

  revalidatePath("/admin/disputas");
  revalidatePath("/admin/pagamentos");
  redirect("/admin/disputas?ok=1");
}

async function reverseOrderTransfers(supabase: ReturnType<typeof createServiceClient>, orderId: string, disputeId: string) {
  const { data: transfers } = await supabase
    .from("payout_transfers")
    .select("id, stripe_transfer_id, amount_cents, status")
    .eq("source_type", "order")
    .eq("source_id", orderId)
    .eq("status", "created");

  for (const transfer of transfers ?? []) {
    if (!transfer.stripe_transfer_id) continue;
    try {
      const reversalId = await createTransferReversal({
        transferId: transfer.stripe_transfer_id,
        amountCents: transfer.amount_cents,
        metadata: { order_id: orderId, dispute_id: disputeId },
        idempotencyKey: `seravie-reversal-${transfer.id}`,
      });
      await supabase.from("payout_transfers").update({
        status: "reversed",
        stripe_reversal_id: reversalId,
        reversed_at: new Date().toISOString(),
        error: null,
      }).eq("id", transfer.id);
    } catch (error) {
      await supabase.from("payout_transfers").update({
        error: error instanceof Error ? error.message : String(error),
      }).eq("id", transfer.id);
    }
  }
}
