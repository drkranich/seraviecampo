"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAuthedClient } from "@/lib/supabase/server";

export async function completeDelivery(formData: FormData) {
  const orderId = String(formData.get("order_id") || "");
  const back = String(formData.get("back") || "/entregador");
  const signature = String(formData.get("signature_url") || "").trim() || null;
  const photo = String(formData.get("photo_url") || "").trim() || null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: { session } } = await supabase.auth.getSession();
  const db = session ? createAuthedClient(session.access_token) : supabase;

  const { data: o } = await supabase
    .from("orders").select("delivery_person_id, producer_id, self_delivery, status").eq("id", orderId).single();
  if (!o) redirect(`${back}?error=` + encodeURIComponent("Pedido não encontrado."));

  const isCourier = o.delivery_person_id === user.id;
  const isSelfProducer = o.self_delivery && o.producer_id === user.id;
  if (!isCourier && !isSelfProducer) redirect(`${back}?error=` + encodeURIComponent("Você não pode concluir esta entrega."));

  await db.from("orders").update({
    status: "entregue",
    delivery_signature_url: signature,
    delivery_photo_url: photo,
    delivered_at: new Date().toISOString(),
  }).eq("id", orderId);

  revalidatePath(back);
  revalidatePath("/entregador");
  revalidatePath("/entregador/ganhos");
  redirect(`${back}?entregue=1`);
}
