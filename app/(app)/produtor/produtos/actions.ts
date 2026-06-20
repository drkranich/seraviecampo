"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAuthedClient } from "@/lib/supabase/server";
import { parseToCents } from "@/lib/catalog";
import { resolveImageUrl } from "@/lib/upload";

function parseForm(formData: FormData) {
  const available_from = String(formData.get("available_from") || "");
  return {
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "").trim() || null,
    category: String(formData.get("category") || "outros"),
    production_status: String(formData.get("production_status") || "pronto"),
    price_cents: parseToCents(String(formData.get("price") || "0")),
    unit: String(formData.get("unit") || "unidade"),
    stock: Number(formData.get("stock") || 0),
    is_organic: formData.get("is_organic") === "on",
    available: formData.get("available") === "on",
    available_from: available_from || null,
  };
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const values = parseForm(formData);
  if (!values.name) {
    redirect("/produtor/produtos/novo?error=" + encodeURIComponent("Informe o nome do produto"));
  }

  const { data: { session } } = await supabase.auth.getSession();
  const storage = session ? createAuthedClient(session.access_token) : supabase;
  let image_url: string | null = null;
  try {
    image_url = await resolveImageUrl(storage, user.id, formData, "image_url", "produto");
  } catch (e) {
    redirect("/produtor/produtos/novo?error=" + encodeURIComponent(e instanceof Error ? e.message : "Falha na imagem"));
  }

  const { error } = await supabase
    .from("products")
    .insert({ ...values, image_url, producer_id: user.id });

  if (error) {
    redirect("/produtor/produtos/novo?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/produtor");
  revalidatePath("/produtor/produtos");
  redirect("/produtor/produtos");
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const values = parseForm(formData);
  if (!values.name) {
    redirect(`/produtor/produtos/${id}?error=` + encodeURIComponent("Informe o nome do produto"));
  }

  const { data: { session } } = await supabase.auth.getSession();
  const storage = session ? createAuthedClient(session.access_token) : supabase;
  let image_url: string | null = null;
  try {
    image_url = await resolveImageUrl(storage, user.id, formData, "image_url", "produto");
  } catch (e) {
    redirect(`/produtor/produtos/${id}?error=` + encodeURIComponent(e instanceof Error ? e.message : "Falha na imagem"));
  }

  const { error } = await supabase
    .from("products")
    .update({ ...values, image_url })
    .eq("id", id)
    .eq("producer_id", user.id);

  if (error) {
    redirect(`/produtor/produtos/${id}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/produtor");
  revalidatePath("/produtor/produtos");
  redirect("/produtor/produtos");
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("products").delete().eq("id", id).eq("producer_id", user.id);

  revalidatePath("/produtor");
  revalidatePath("/produtor/produtos");
  redirect("/produtor/produtos");
}
