"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function confirmPayment(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: o } = await supabase
    .from("orders").select("customer_id, payment_method, payment_status").eq("id", orderId).single();
  if (!o || o.customer_id !== user.id) redirect("/cliente/pagamento?error=" + encodeURIComponent("Pedido não encontrado."));
  if (o.payment_status !== "pendente") redirect("/cliente/pagamento");

  const isCash = o.payment_method === "dinheiro";
  await supabase.from("orders").update({
    payment_status: isCash ? "na_entrega" : "pago",
    paid_at: isCash ? null : new Date().toISOString(),
  }).eq("id", orderId).eq("customer_id", user.id);

  revalidatePath("/cliente/pagamento");
  revalidatePath("/cliente/pedidos");
  redirect("/cliente/pagamento?ok=1");
}
