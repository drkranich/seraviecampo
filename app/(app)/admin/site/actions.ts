"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function parseJsonArray(raw: string, label: string) {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) throw new Error("not-array");
    return parsed;
  } catch {
    redirect("/admin/site?error=" + encodeURIComponent(`${label} precisa ser uma lista JSON valida.`));
  }
}

export async function updateSite(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const str = (k: string) => String(formData.get(k) || "").trim();

  const arrays = {
    perfis: parseJsonArray(str("perfis"), "Cartoes de perfil"),
    steps: parseJsonArray(str("steps"), "Passos"),
    hero_teasers: parseJsonArray(str("hero_teasers"), "Chamadas do hero"),
    ecosystem: parseJsonArray(str("ecosystem"), "Faixa de ecossistema"),
    destinations: parseJsonArray(str("destinations"), "Destinos"),
    stay_types: parseJsonArray(str("stay_types"), "Tipos de hospedagem"),
    experience_tracks: parseJsonArray(str("experience_tracks"), "Trilhas de experiencia"),
    product_tags: parseJsonArray(str("product_tags"), "Tags de produtos"),
    guide_links: parseJsonArray(str("guide_links"), "Guias publicos"),
    host_tools: parseJsonArray(str("host_tools"), "Ferramentas do anfitrião"),
    trust_items: parseJsonArray(str("trust_items"), "Itens de confiança"),
  };

  const data = {
    brand: str("brand"),
    favicon_url: str("favicon_url"),
    hero_image_url: str("hero_image_url"),
    hero_kicker: str("hero_kicker"),
    hero_title: str("hero_title"),
    hero_subtitle: str("hero_subtitle"),
    hero_cta: str("hero_cta"),
    steps_title: str("steps_title"),
    cta_title: str("cta_title"),
    cta_text: str("cta_text"),
    footer: str("footer"),
    avisos: { cliente: str("aviso_cliente"), produtor: str("aviso_produtor"), entregador: str("aviso_entregador") },
    experiencias_enabled: formData.get("experiencias_enabled") === "on",
    experiencias_title: str("experiencias_title"),
    experiencias_subtitle: str("experiencias_subtitle"),
    destinations_label: str("destinations_label"),
    destinations_title: str("destinations_title"),
    destinations_text: str("destinations_text"),
    stay_label: str("stay_label"),
    stay_title: str("stay_title"),
    stay_text: str("stay_text"),
    home_experiences_label: str("home_experiences_label"),
    home_experiences_title: str("home_experiences_title"),
    home_experiences_text: str("home_experiences_text"),
    products_label: str("products_label"),
    products_title: str("products_title"),
    products_text: str("products_text"),
    guides_label: str("guides_label"),
    host_label: str("host_label"),
    host_title: str("host_title"),
    host_text: str("host_text"),
    trust_title: str("trust_title"),
    host_cta_label: str("host_cta_label"),
    host_cta_href: str("host_cta_href"),
    ...arrays,
  };

  const { data: current } = await supabase.from("site_content").select("data").eq("id", 1).maybeSingle();
  const merged = { ...((current?.data as Record<string, unknown> | null) ?? {}), ...data };
  const { error } = await supabase.from("site_content").upsert({ id: 1, data: merged, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) redirect("/admin/site?error=" + encodeURIComponent(error.message));
  revalidatePath("/");
  revalidatePath("/experiencias");
  revalidatePath("/admin/site");
  redirect("/admin/site?ok=1");
}
