"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { trialStatus, PAID_CLIENT_PLANS, ACTIVE_SUB_STATUS } from "@/lib/trial";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

// Adiciona à cesta (quantidade vem do form; default 1)
export async function addToCart(productId: string, formData: FormData) {
  const { supabase, userId } = await getUser();
  const qty = Number(formData.get("quantity")) || 1;

  const { data: existing } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  const newQty = (existing?.quantity ?? 0) + qty;

  await supabase
    .from("cart_items")
    .upsert({ user_id: userId, product_id: productId, quantity: newQty });

  revalidatePath("/cliente/cesta");
  redirect("/cliente/cesta");
}

// Atualiza quantidade (form com campo "quantity")
export async function updateCartItem(productId: string, formData: FormData) {
  const { supabase, userId } = await getUser();
  const qty = Number(formData.get("quantity"));

  if (!qty || qty <= 0) {
    await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", productId);
  } else {
    await supabase
      .from("cart_items")
      .update({ quantity: qty })
      .eq("user_id", userId)
      .eq("product_id", productId);
  }
  revalidatePath("/cliente/cesta");
  redirect("/cliente/cesta");
}

export async function removeCartItem(productId: string) {
  const { supabase, userId } = await getUser();
  await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", productId);
  revalidatePath("/cliente/cesta");
  redirect("/cliente/cesta");
}

export async function checkout(formData: FormData) {
  const { supabase, userId } = await getUser();

  // Gate de degustação: plano Avulso = 15 dias OU 5 compras; depois exige plano pago.
  const { data: prof } = await supabase.from("profiles").select("created_at").eq("id", userId).single();
  const { count: purchaseCount } = await supabase.from("orders").select("id", { count: "exact", head: true })
    .eq("customer_id", userId).neq("status", "cancelado");
  const { data: sub } = await supabase.from("subscriptions").select("plan, status")
    .eq("account_id", userId).in("plan", PAID_CLIENT_PLANS)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  const hasPaid = !!(sub && sub.status && ACTIVE_SUB_STATUS.includes(sub.status));
  const st = trialStatus({ createdAt: prof?.created_at ?? new Date().toISOString(), purchaseCount: purchaseCount ?? 0, hasPaidPlan: hasPaid });
  if (st.blocked) redirect("/cliente/assinatura?trial=expirado");

  const { data, error } = await supabase.rpc("checkout", {
    p_name: String(formData.get("name") || "").trim(),
    p_phone: String(formData.get("phone") || "").trim(),
    p_address: String(formData.get("address") || "").trim(),
    p_notes: String(formData.get("notes") || "").trim(),
    p_payment: String(formData.get("payment") || "pix"),
  });

  if (error) {
    redirect("/cliente/cesta?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/cliente/pedidos");
  revalidatePath("/cliente/cesta");

  const count = Array.isArray(data) ? data.length : 0;
  redirect("/cliente/pagamento?novo=" + count);
}
