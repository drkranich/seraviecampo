"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("dispute_id") || "");
  const decision = String(formData.get("decision") || ""); // reembolsar | encerrar | recusar
  const note = String(formData.get("note") || "").trim() || null;

  const { data: d } = await supabase.from("disputes").select("order_id").eq("id", id).single();
  if (!d) redirect("/admin/disputas?error=" + encodeURIComponent("Disputa não encontrada."));

  let status = "em_analise";
  let refunded = false;
  if (decision === "reembolsar") { status = "reembolsada"; refunded = true; }
  else if (decision === "encerrar") { status = "encerrada_sem_reembolso"; }
  else if (decision === "recusar") { status = "recusada"; }

  await supabase.from("disputes").update({
    status, refunded, resolution_note: note, resolved_at: new Date().toISOString(),
  }).eq("id", id);

  if (refunded) {
    await supabase.from("orders").update({ payment_status: "reembolsado", status: "cancelado" }).eq("id", d.order_id);
  }

  revalidatePath("/admin/disputas");
  redirect("/admin/disputas?ok=1");
}
