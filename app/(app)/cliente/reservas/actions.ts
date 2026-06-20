"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createReservation(productId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const quantity = Math.max(1, Number(formData.get("quantity")) || 1);
  const note = String(formData.get("note") || "").trim() || null;
  const { data: prod } = await supabase.from("products").select("producer_id").eq("id", productId).single();
  if (!prod) redirect("/cliente/reservas?error=" + encodeURIComponent("Produto não encontrado."));
  const { error } = await supabase.from("harvest_reservations").insert({
    product_id: productId, producer_id: prod.producer_id, customer_id: user.id, quantity, note,
  });
  if (error) redirect("/cliente/reservas?error=" + encodeURIComponent(error.message));
  revalidatePath("/cliente/reservas");
  redirect("/cliente/reservas?ok=1");
}

export async function cancelReservation(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("harvest_reservations").update({ status: "cancelado", updated_at: new Date().toISOString() }).eq("id", id).eq("customer_id", user.id);
  revalidatePath("/cliente/reservas");
  redirect("/cliente/reservas?canc=1");
}
