"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { priceToCents, type ExperienceStatus } from "@/lib/experiences";

function parseForm(formData: FormData) {
  let images: string[] = [];
  try {
    const r = JSON.parse(String(formData.get("images") || "[]"));
    if (Array.isArray(r)) images = r.filter((x) => typeof x === "string");
  } catch { images = []; }
  const includes = String(formData.get("includes") || "")
    .split("\n").map((l) => l.trim()).filter(Boolean);
  return {
    title: String(formData.get("title") || "").trim(),
    summary: String(formData.get("summary") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    category: String(formData.get("category") || "gastronomia"),
    location: String(formData.get("location") || "").trim(),
    price_cents: priceToCents(String(formData.get("price") || "0")),
    duration_min: Math.max(15, Number(formData.get("duration_min") || 120)),
    capacity: Math.max(1, Number(formData.get("capacity") || 10)),
    includes,
    images,
    active: formData.get("active") === "on",
  };
}

export async function createExperience(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const values = parseForm(formData);
  if (!values.title) redirect("/produtor/experiencias/nova?error=" + encodeURIComponent("Informe o título da experiência"));

  const { data: prof } = await supabase.from("profiles").select("currency").eq("id", user.id).single();
  const currency = (prof?.currency as string) || "BRL";

  const { error } = await supabase.from("experiences").insert({ ...values, currency, producer_id: user.id });
  if (error) redirect("/produtor/experiencias/nova?error=" + encodeURIComponent(error.message));

  revalidatePath("/produtor/experiencias");
  redirect("/produtor/experiencias");
}

export async function updateExperience(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const values = parseForm(formData);
  if (!values.title) redirect(`/produtor/experiencias/${id}?error=` + encodeURIComponent("Informe o título da experiência"));

  const { error } = await supabase.from("experiences")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", id).eq("producer_id", user.id);
  if (error) redirect(`/produtor/experiencias/${id}?error=` + encodeURIComponent(error.message));

  revalidatePath("/produtor/experiencias");
  redirect("/produtor/experiencias");
}

export async function archiveExperience(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("experiences").update({ archived: true, active: false }).eq("id", id).eq("producer_id", user.id);
  revalidatePath("/produtor/experiencias");
  redirect("/produtor/experiencias");
}

export async function restoreExperience(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("experiences").update({ archived: false, active: true }).eq("id", id).eq("producer_id", user.id);
  revalidatePath("/produtor/experiencias");
  redirect("/produtor/experiencias");
}

export async function deleteExperience(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("experiences").delete().eq("id", id).eq("producer_id", user.id);
  revalidatePath("/produtor/experiencias");
  redirect("/produtor/experiencias");
}

export async function setBookingStatus(id: string, status: ExperienceStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("experience_bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id).eq("producer_id", user.id);
  revalidatePath("/produtor/experiencias");
  redirect("/produtor/experiencias?ok=1");
}
