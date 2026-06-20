"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateClienteProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const values = {
    full_name: String(formData.get("full_name") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    state: String(formData.get("state") || "").trim() || null,
    avatar_url: String(formData.get("avatar_url") || "").trim() || null,
    document_url: String(formData.get("document_url") || "").trim() || null,
    document_type: String(formData.get("document_type") || "").trim() || null,
  };

  const { error } = await supabase.from("profiles").update(values).eq("id", user.id);
  if (error) redirect("/cliente/conta?error=" + encodeURIComponent(error.message));
  revalidatePath("/cliente/conta");
  redirect("/cliente/conta?ok=1");
}
