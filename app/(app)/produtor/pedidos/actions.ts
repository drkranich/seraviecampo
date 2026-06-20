"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/orders";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

export async function advanceOrderStatus(orderId: string, next: OrderStatus) {
  const { supabase, userId } = await getUser();
  await supabase
    .from("orders")
    .update({ status: next })
    .eq("id", orderId)
    .eq("producer_id", userId);
  revalidatePath("/produtor/pedidos");
}

export async function dispatchOrder(orderId: string) {
  const { supabase, userId } = await getUser();
  await supabase.from("orders").update({ status: "saiu_entrega", self_delivery: false }).eq("id", orderId).eq("producer_id", userId);
  revalidatePath("/produtor/pedidos");
}

export async function selfDeliverOrder(orderId: string) {
  const { supabase, userId } = await getUser();
  await supabase.from("orders").update({ status: "saiu_entrega", self_delivery: true, delivery_person_id: null }).eq("id", orderId).eq("producer_id", userId);
  revalidatePath("/produtor/pedidos");
}

export async function cancelOrder(orderId: string) {
  const { supabase, userId } = await getUser();
  await supabase
    .from("orders")
    .update({ status: "cancelado" })
    .eq("id", orderId)
    .eq("producer_id", userId);
  revalidatePath("/produtor/pedidos");
}
