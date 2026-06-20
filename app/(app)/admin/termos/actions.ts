"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateTerms(formData: FormData) {
  const slug = String(formData.get("slug") || "cancelamento");
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  if (!title || !content) redirect("/admin/termos?error=" + encodeURIComponent("Título e conteúdo são obrigatórios."));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cur } = await supabase.from("legal_terms").select("version").eq("slug", slug).single();
  const nextVersion = (cur?.version ?? 0) + 1;

  await supabase.from("legal_terms").update({
    title, content, version: nextVersion, updated_by: user.id, updated_at: new Date().toISOString(),
  }).eq("slug", slug);

  revalidatePath("/admin/termos");
  redirect("/admin/termos?ok=1");
}
