"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import {
  EMAIL_AUDIENCE_OPTIONS,
  EMAIL_BRAND_PALETTE,
  EMAIL_CATEGORY_OPTIONS,
  EMAIL_STATUS_OPTIONS,
  editableTextToBlocks,
  normalizeTemplateSlug,
  renderEmailHtml,
  templateSnapshot,
  templateToPlainText,
  type EmailMarketingTemplate,
} from "@/lib/email-marketing";

function fail(message: string): never {
  redirect("/admin/email-marketing?error=" + encodeURIComponent(message));
}

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function validValue(value: string, options: Array<{ value: string }>, fallback: string) {
  return options.some((option) => option.value === value) ? value : fallback;
}

function audienceFrom(formData: FormData) {
  const allowed = new Set(EMAIL_AUDIENCE_OPTIONS.map((item) => item.value));
  const selected = formData
    .getAll("audience")
    .map((item) => String(item))
    .filter((item) => allowed.has(item as never));
  return selected.length ? selected : ["cliente"];
}

async function adminClient() {
  const { user } = await requireRole("super_admin");
  const supabase = await createClient();
  return { user, supabase };
}

export async function saveTemplate(formData: FormData) {
  const { user, supabase } = await adminClient();
  const id = clean(formData.get("id"));
  const name = clean(formData.get("name"));
  const slug = normalizeTemplateSlug(clean(formData.get("slug")) || name);
  const subject = clean(formData.get("subject"));
  const heroTitle = clean(formData.get("hero_title"));

  if (!name) fail("Informe o nome do template.");
  if (!slug) fail("Informe um slug valido para o template.");
  if (!subject) fail("Informe o assunto do email.");
  if (!heroTitle) fail("Informe o titulo principal do template.");

  const blocks = editableTextToBlocks(clean(formData.get("blocks_text")));
  const renderable = {
    subject,
    preheader: clean(formData.get("preheader")),
    hero_title: heroTitle,
    hero_body: clean(formData.get("hero_body")),
    cta_label: clean(formData.get("cta_label")),
    cta_url: clean(formData.get("cta_url")),
    image_url: clean(formData.get("image_url")) || null,
    palette: EMAIL_BRAND_PALETTE,
    blocks,
    footer_note: clean(formData.get("footer_note")),
  };

  const values = {
    slug,
    name,
    description: clean(formData.get("description")),
    category: validValue(clean(formData.get("category")), EMAIL_CATEGORY_OPTIONS, "newsletter"),
    audience: audienceFrom(formData),
    status: validValue(clean(formData.get("status")), EMAIL_STATUS_OPTIONS, "draft"),
    ...renderable,
    html_content: renderEmailHtml(renderable),
    plain_text: templateToPlainText(renderable),
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase
      .from("email_marketing_templates")
      .update(values)
      .eq("id", id);
    if (error) fail(error.message);
    revalidatePath("/admin/email-marketing");
    redirect(`/admin/email-marketing?template=${id}&saved=1`);
  }

  const { data, error } = await supabase
    .from("email_marketing_templates")
    .insert({ ...values, created_by: user.id, is_system: false })
    .select("id")
    .single();
  if (error) fail(error.message);
  revalidatePath("/admin/email-marketing");
  redirect(`/admin/email-marketing?template=${data.id}&created=1`);
}

export async function duplicateTemplate(formData: FormData) {
  const { user, supabase } = await adminClient();
  const id = clean(formData.get("id"));
  if (!id) fail("Template invalido.");

  const { data, error } = await supabase
    .from("email_marketing_templates")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) fail(error?.message || "Template nao encontrado.");

  const original = data as EmailMarketingTemplate;
  const slug = normalizeTemplateSlug(`${original.slug}-copia-${Date.now().toString(36)}`);
  const { data: created, error: insertError } = await supabase
    .from("email_marketing_templates")
    .insert({
      slug,
      name: `${original.name} (copia)`,
      description: original.description,
      category: original.category,
      audience: original.audience,
      status: "draft",
      subject: original.subject,
      preheader: original.preheader,
      hero_title: original.hero_title,
      hero_body: original.hero_body,
      cta_label: original.cta_label,
      cta_url: original.cta_url,
      image_url: original.image_url,
      palette: original.palette || EMAIL_BRAND_PALETTE,
      blocks: original.blocks,
      footer_note: original.footer_note,
      html_content: original.html_content || renderEmailHtml(original),
      plain_text: original.plain_text || templateToPlainText(original),
      is_system: false,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();
  if (insertError) fail(insertError.message);
  revalidatePath("/admin/email-marketing");
  redirect(`/admin/email-marketing?template=${created.id}&created=1`);
}

export async function archiveTemplate(formData: FormData) {
  const { user, supabase } = await adminClient();
  const id = clean(formData.get("id"));
  if (!id) fail("Template invalido.");
  const { error } = await supabase
    .from("email_marketing_templates")
    .update({ status: "archived", updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) fail(error.message);
  revalidatePath("/admin/email-marketing");
  redirect("/admin/email-marketing?archived=1");
}

export async function createCampaignDraft(formData: FormData) {
  const { user, supabase } = await adminClient();
  const templateId = clean(formData.get("id"));
  const segmentId = clean(formData.get("segment_id")) || null;
  if (!templateId) fail("Escolha um template para criar campanha.");

  const { data, error } = await supabase
    .from("email_marketing_templates")
    .select("*")
    .eq("id", templateId)
    .single();
  if (error || !data) fail(error?.message || "Template nao encontrado.");

  const template = data as EmailMarketingTemplate;
  const name = `Campanha - ${template.name}`;
  const { data: campaign, error: insertError } = await supabase
    .from("email_marketing_campaigns")
    .insert({
      template_id: template.id,
      segment_id: segmentId,
      name,
      status: "draft",
      subject: template.subject,
      preheader: template.preheader,
      content_snapshot: templateSnapshot(template),
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();
  if (insertError) fail(insertError.message);
  revalidatePath("/admin/email-marketing");
  redirect(`/admin/email-marketing?template=${template.id}&campaign=${campaign.id}`);
}
