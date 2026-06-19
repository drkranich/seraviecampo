"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProducerProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const values = {
    full_name: String(formData.get("full_name") || "").trim() || null,
    farm_name: String(formData.get("farm_name") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    state: String(formData.get("state") || "").trim() || null,
    bio: String(formData.get("bio") || "").trim() || null,
    avatar_url: String(formData.get("avatar_url") || "").trim() || null,
    cover_url: String(formData.get("cover_url") || "").trim() || null,
  };

  const { error } = await supabase.from("profiles").update(values).eq("id", user.id);

  if (error) {
    redirect("/produtor/perfil?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/produtor/perfil");
  redirect("/produtor/perfil?ok=1");
}
