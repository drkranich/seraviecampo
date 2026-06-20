"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveImageUrl } from "@/lib/upload";

export async function updateProducerProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let avatar_url: string | null = null;
  let cover_url: string | null = null;
  try {
    avatar_url = await resolveImageUrl(supabase, user.id, formData, "avatar_url", "avatar");
    cover_url = await resolveImageUrl(supabase, user.id, formData, "cover_url", "cover");
  } catch (e) {
    redirect("/produtor/perfil?error=" + encodeURIComponent(e instanceof Error ? e.message : "Falha na imagem"));
  }

  const values = {
    full_name: String(formData.get("full_name") || "").trim() || null,
    farm_name: String(formData.get("farm_name") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    state: String(formData.get("state") || "").trim() || null,
    bio: String(formData.get("bio") || "").trim() || null,
    avatar_url,
    cover_url,
  };

  const { error } = await supabase.from("profiles").update(values).eq("id", user.id);

  if (error) {
    redirect("/produtor/perfil?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/produtor/perfil");
  redirect("/produtor/perfil?ok=1");
}
