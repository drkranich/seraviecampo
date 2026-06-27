"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { countryOf } from "@/lib/countries";

export async function updateParceiroProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const country = String(formData.get("country") || "BR");
  const values = {
    full_name: String(formData.get("full_name") || "").trim() || null,
    farm_name: String(formData.get("farm_name") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    state: String(formData.get("state") || "").trim() || null,
    country,
    currency: countryOf(country).currency,
    bio: String(formData.get("bio") || "").trim() || null,
    avatar_url: String(formData.get("avatar_url") || "").trim() || null,
    cover_url: String(formData.get("cover_url") || "").trim() || null,
    document_url: String(formData.get("document_url") || "").trim() || null,
    document_type: String(formData.get("document_type") || "").trim() || null,
  };

  const { error } = await supabase.from("profiles").update(values).eq("id", user.id);
  if (error) redirect("/parceiro/perfil?error=" + encodeURIComponent(error.message));
  revalidatePath("/parceiro/perfil");
  redirect("/parceiro/perfil?ok=1");
}
