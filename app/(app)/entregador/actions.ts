"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAuthedClient } from "@/lib/supabase/server";

async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: { session } } = await supabase.auth.getSession();
  const db = session ? createAuthedClient(session.access_token) : supabase;
  return { user, db };
}

// Aceita (assume) uma entrega disponível
export async function acceptDelivery(orderId: string) {
  const { user, db } = await authed();
  await db.from("orders")
    .update({ delivery_person_id: user.id })
    .eq("id", orderId)
    .eq("status", "saiu_entrega")
    .is("delivery_person_id", null);
  revalidatePath("/entregador");
}

// Marca a entrega como concluída
export async function completeDelivery(orderId: string) {
  const { user, db } = await authed();
  await db.from("orders")
    .update({ status: "entregue" })
    .eq("id", orderId)
    .eq("delivery_person_id", user.id);
  revalidatePath("/entregador");
  revalidatePath("/entregador/ganhos");
  revalidatePath("/entregador/historico");
}
