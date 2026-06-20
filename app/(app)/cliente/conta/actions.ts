"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAuthedClient } from "@/lib/supabase/server";

export async function updateClienteProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: { session } } = await supabase.auth.getSession();
  const db = session ? createAuthedClient(session.access_token) : supabase;

  const values = {
    full_name: String(formData.get("full_name") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    state: String(formData.get("state") || "").trim() || null,
  };

  const { error } = await db.from("profiles").update(values).eq("id", user.id);
  if (error) redirect("/cliente/conta?error=" + encodeURIComponent(error.message));

  revalidatePath("/cliente/conta");
  redirect("/cliente/conta?ok=1");
}
