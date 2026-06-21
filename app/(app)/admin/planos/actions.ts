"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseToCents } from "@/lib/catalog";
import { stripeEnabled, createRecurringPrice } from "@/lib/stripe";

export async function updatePlan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/planos?error=" + encodeURIComponent("Plano inválido."));

  const { data: cur } = await supabase.from("plans").select("price_cents, stripe_product_id, name").eq("id", id).single();
  if (!cur) redirect("/admin/planos?error=" + encodeURIComponent("Plano não encontrado."));

  const name = String(formData.get("name") || "").trim() || (cur.name as string);
  const tagline = String(formData.get("tagline") || "").trim();
  const price_cents = parseToCents(String(formData.get("price") || "0"));
  const commRaw = String(formData.get("commission_pct") || "").trim();
  const commission_pct = commRaw === "" ? null : Math.max(0, Math.min(100, Number(commRaw) || 0));
  const features = String(formData.get("features") || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const active = formData.get("active") === "on";

  const values: Record<string, unknown> = { name, tagline, price_cents, commission_pct, features, active, updated_at: new Date().toISOString() };

  // Se o valor mudou e há Stripe, gera um NOVO price (preços são imutáveis).
  if (stripeEnabled() && price_cents > 0 && price_cents !== (cur.price_cents as number)) {
    try {
      const { priceId, productId } = await createRecurringPrice({
        productId: (cur.stripe_product_id as string | null) ?? null,
        productName: `Seravie Campo — ${name}`,
        amountCents: price_cents,
        currency: "BRL",
      });
      values.stripe_price_id = priceId;
      values.stripe_product_id = productId;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "erro";
      redirect("/admin/planos?error=" + encodeURIComponent("Valor salvo, mas falhou no Stripe: " + msg));
    }
  }

  const { error } = await supabase.from("plans").update(values).eq("id", id);
  if (error) redirect("/admin/planos?error=" + encodeURIComponent(error.message));
  revalidatePath("/admin/planos");
  redirect("/admin/planos?ok=1");
}
