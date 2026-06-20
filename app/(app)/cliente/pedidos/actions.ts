"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function cancelOrder(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: o } = await supabase
    .from("orders")
    .select("created_at, status, customer_id")
    .eq("id", orderId)
    .single();

  if (!o || o.customer_id !== user.id) {
    redirect("/cliente/pedidos?error=" + encodeURIComponent("Pedido não encontrado."));
  }
  const age = Date.now() - new Date(o.created_at as string).getTime();
  if (age > CANCEL_WINDOW_MS) {
    redirect("/cliente/pedidos?error=" + encodeURIComponent("Prazo de cancelamento (24h) expirado."));
  }
  if (o.status !== "novo" && o.status !== "preparando") {
    redirect("/cliente/pedidos?error=" + encodeURIComponent("Este pedido não pode mais ser cancelado."));
  }

  await supabase.from("orders").update({ status: "cancelado" }).eq("id", orderId).eq("customer_id", user.id);
  revalidatePath("/cliente/pedidos");
  redirect("/cliente/pedidos?canceled=1");
}
