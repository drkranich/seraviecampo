"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAuthedClient } from "@/lib/supabase/server";

export async function dispatchWithProof(formData: FormData) {
  const orderId = String(formData.get("order_id") || "");
  const back = String(formData.get("back") || "/produtor/pedidos");
  const mode = String(formData.get("mode") || "dispatch"); // 'dispatch' | 'self'
  const photo = String(formData.get("photo_url") || "").trim() || null;
  const signature = String(formData.get("signature_url") || "").trim() || null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: { session } } = await supabase.auth.getSession();
  const db = session ? createAuthedClient(session.access_token) : supabase;

  const { data: o } = await supabase.from("orders").select("producer_id").eq("id", orderId).single();
  if (!o || o.producer_id !== user.id) redirect(`${back}?error=` + encodeURIComponent("Pedido não encontrado."));

  await db.from("orders").update({
    status: "saiu_entrega",
    self_delivery: mode === "self",
    dispatch_photo_url: photo,
    dispatch_signature_url: signature,
    dispatched_at: new Date().toISOString(),
  }).eq("id", orderId).eq("producer_id", user.id);

  revalidatePath(back);
  redirect(`${back}?saida=1`);
}
