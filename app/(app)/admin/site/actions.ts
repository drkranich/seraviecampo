"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify, type SiteContent, type SiteContentEnvelope } from "@/lib/site";

function parseJsonArray(raw: string, label: string) {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) throw new Error("not-array");
    return parsed;
  } catch {
    redirect("/admin/site?error=" + encodeURIComponent(`${label} precisa ser uma lista JSON valida.`));
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isEnvelope(data: Record<string, unknown>) {
  return isRecord(data.published) || isRecord(data.draft);
}

function envelopeFrom(raw: unknown): SiteContentEnvelope {
  if (!isRecord(raw)) return {};
  if (isEnvelope(raw)) return raw as SiteContentEnvelope;
  return {
    published: raw as Partial<SiteContent>,
    draft: raw as Partial<SiteContent>,
    published_at: null,
    draft_updated_at: null,
  };
}

function collectSiteData(formData: FormData): Partial<SiteContent> {
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
    featured_items: parseJsonArray(str("featured_items"), "Vitrines publicas"),
    host_tools: parseJsonArray(str("host_tools"), "Ferramentas do anfitrião"),
    trust_items: parseJsonArray(str("trust_items"), "Itens de confiança"),
    testimonials: parseJsonArray(str("testimonials"), "Depoimentos"),
    faq_items: parseJsonArray(str("faq_items"), "Perguntas frequentes"),
    institutional_pages: parseJsonArray(str("institutional_pages"), "Paginas institucionais"),
  };

  return {
    brand: str("brand"),
    favicon_url: str("favicon_url"),
    seo_title: str("seo_title"),
    seo_description: str("seo_description"),
    og_image_url: str("og_image_url"),
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
    featured_label: str("featured_label"),
    featured_title: str("featured_title"),
    featured_text: str("featured_text"),
    host_label: str("host_label"),
    host_title: str("host_title"),
    host_text: str("host_text"),
    trust_title: str("trust_title"),
    testimonials_label: str("testimonials_label"),
    testimonials_title: str("testimonials_title"),
    faq_label: str("faq_label"),
    faq_title: str("faq_title"),
    host_cta_label: str("host_cta_label"),
    host_cta_href: str("host_cta_href"),
    cta_primary_label: str("cta_primary_label"),
    cta_primary_href: str("cta_primary_href"),
    cta_secondary_label: str("cta_secondary_label"),
    cta_secondary_href: str("cta_secondary_href"),
    ...arrays,
  };
}

function revalidatePublic(site: Partial<SiteContent> | undefined) {
  revalidatePath("/");
  revalidatePath("/experiencias");
  revalidatePath("/admin/site");
  revalidatePath("/admin/site/preview");
  for (const page of site?.institutional_pages ?? []) {
    const slug = page.slug || slugify(page.title || "");
    if (slug) revalidatePath(`/${slug}`);
  }
  for (const destination of site?.destinations ?? []) {
    const slug = destination.slug || slugify(destination.name || "");
    if (slug) revalidatePath(`/destinos/${slug}`);
  }
}

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}

export async function updateSite(formData: FormData) {
  const supabase = await requireUser();
  const draft = collectSiteData(formData);

  const { data: current } = await supabase.from("site_content").select("data").eq("id", 1).maybeSingle();
  const envelope = envelopeFrom(current?.data);
  const now = new Date().toISOString();
  const next: SiteContentEnvelope = {
    ...envelope,
    published: envelope.published ?? envelope.draft ?? {},
    draft,
    draft_updated_at: now,
  };
  const { error } = await supabase.from("site_content").upsert({ id: 1, data: next, updated_at: now }, { onConflict: "id" });
  if (error) redirect("/admin/site?error=" + encodeURIComponent(error.message));
  revalidatePath("/admin/site");
  revalidatePath("/admin/site/preview");
  redirect("/admin/site?draft=1");
}

export async function publishSite() {
  const supabase = await requireUser();
  const { data: current } = await supabase.from("site_content").select("data").eq("id", 1).maybeSingle();
  const envelope = envelopeFrom(current?.data);
  const published = envelope.draft ?? envelope.published ?? {};
  const now = new Date().toISOString();
  const next: SiteContentEnvelope = {
    ...envelope,
    published,
    draft: published,
    published_at: now,
    draft_updated_at: now,
  };

  const { error } = await supabase.from("site_content").upsert({ id: 1, data: next, updated_at: now }, { onConflict: "id" });
  if (error) redirect("/admin/site?error=" + encodeURIComponent(error.message));
  revalidatePublic(published);
  redirect("/admin/site?published=1");
}

export async function discardSiteDraft() {
  const supabase = await requireUser();
  const { data: current } = await supabase.from("site_content").select("data").eq("id", 1).maybeSingle();
  const envelope = envelopeFrom(current?.data);
  const published = envelope.published ?? envelope.draft ?? {};
  const now = new Date().toISOString();
  const next: SiteContentEnvelope = {
    ...envelope,
    published,
    draft: published,
    draft_updated_at: now,
  };

  const { error } = await supabase.from("site_content").upsert({ id: 1, data: next, updated_at: now }, { onConflict: "id" });
  if (error) redirect("/admin/site?error=" + encodeURIComponent(error.message));
  revalidatePath("/admin/site");
  revalidatePath("/admin/site/preview");
  redirect("/admin/site?discarded=1");
}
