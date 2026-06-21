"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateSite(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const str = (k: string) => String(formData.get(k) || "").trim();
  let perfis: unknown = [];
  let steps: unknown = [];
  try { perfis = JSON.parse(str("perfis") || "[]"); } catch { redirect("/admin/site?error=" + encodeURIComponent("JSON dos perfis inválido.")); }
  try { steps = JSON.parse(str("steps") || "[]"); } catch { redirect("/admin/site?error=" + encodeURIComponent("JSON dos passos inválido.")); }

  const data = {
    brand: str("brand"),
    hero_kicker: str("hero_kicker"),
    hero_title: str("hero_title"),
    hero_subtitle: str("hero_subtitle"),
    hero_cta: str("hero_cta"),
    steps_title: str("steps_title"),
    cta_title: str("cta_title"),
    cta_text: str("cta_text"),
    footer: str("footer"),
    avisos: { cliente: str("aviso_cliente"), produtor: str("aviso_produtor"), entregador: str("aviso_entregador") },
    perfis,
    steps,
  };

  const { error } = await supabase.from("site_content").upsert({ id: 1, data, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) redirect("/admin/site?error=" + encodeURIComponent(error.message));
  revalidatePath("/");
  revalidatePath("/admin/site");
  redirect("/admin/site?ok=1");
}
