"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/guard";
import { processEmailMarketingQueue } from "@/lib/email-marketing-queue";
import { sendMarketingEmail } from "@/lib/email-marketing-send";
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
  type EmailAudienceKey,
  type EmailMarketingCampaign,
  type EmailMarketingSegment,
  type EmailMarketingTemplate,
} from "@/lib/email-marketing";

function fail(message: string): never {
  redirect("/admin/email-marketing?error=" + encodeURIComponent(message));
}

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function marketingPage(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  }
  return `/admin/email-marketing?${search.toString()}`;
}

function parseBrasiliaDateTime(value: string) {
  const normalized = value.length === 16 ? `${value}:00-03:00` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validValue(value: string, options: Array<{ value: string }>, fallback: string) {
  return options.some((option) => option.value === value) ? value : fallback;
}

function audienceFrom(formData: FormData) {
  const allowed = new Set(EMAIL_AUDIENCE_OPTIONS.map((item) => item.value));
  const selected = formData
    .getAll("audience")
    .map((item) => String(item))
    .filter((item): item is EmailAudienceKey => allowed.has(item as EmailAudienceKey));
  return selected.length ? selected : ["cliente"];
}

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function displayName(row: { full_name?: string | null; display_name?: string | null; farm_name?: string | null }) {
  return row.farm_name || row.display_name || row.full_name || null;
}

function readSnapshotAudience(snapshot: Record<string, unknown>, template: EmailMarketingTemplate | null) {
  const value = snapshot.audience;
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  return template?.audience ?? [];
}

function shouldIncludeLeads(audience: string[], segment: EmailMarketingSegment | null) {
  const rules = (segment?.rules ?? {}) as Record<string, unknown>;
  return audience.includes("lead") || segment?.key === "leads-site-publico" || rules.include_leads === true;
}

function roleFilterFor(audience: string[], segment: EmailMarketingSegment | null) {
  if (segment?.role_filter?.length) return segment.role_filter.map(String);
  return audience.filter((item) => item !== "lead");
}

type RecipientCandidate = {
  email: string;
  name: string | null;
  role: string | null;
  userId: string | null;
  source: "profile" | "public_support";
  metadata: Record<string, unknown>;
};

function dedupeRecipients(rows: RecipientCandidate[]) {
  const byEmail = new Map<string, RecipientCandidate>();
  for (const row of rows) {
    const email = normalizeEmail(row.email);
    if (!email || !email.includes("@")) continue;
    const normalized = { ...row, email };
    const current = byEmail.get(email);
    if (!current || (!current.userId && normalized.userId)) byEmail.set(email, normalized);
  }
  return Array.from(byEmail.values());
}

async function resolveCampaignRecipients(
  supabase: Awaited<ReturnType<typeof createClient>>,
  campaign: EmailMarketingCampaign,
  template: EmailMarketingTemplate | null,
  segment: EmailMarketingSegment | null
) {
  const snapshot = (campaign.content_snapshot ?? {}) as Record<string, unknown>;
  const audience = readSnapshotAudience(snapshot, template);
  const roles = roleFilterFor(audience, segment);
  const includeLeads = shouldIncludeLeads(audience, segment);

  const [profilesResult, adminEmailsResult, leadsResult] = await Promise.all([
    supabase.from("profiles").select("id, role, full_name, display_name, farm_name, city, state"),
    supabase.rpc("admin_emails"),
    includeLeads
      ? supabase
          .from("public_support_threads")
          .select("visitor_email, visitor_name, visitor_phone, subject, source_path, created_at")
          .not("visitor_email", "is", null)
          .order("created_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesResult.error) fail(profilesResult.error.message);
  if (adminEmailsResult.error) fail(adminEmailsResult.error.message);
  if (leadsResult.error) fail(leadsResult.error.message);

  const emailById = new Map(((adminEmailsResult.data ?? []) as Array<{ id: string; email: string }>).map((row) => [row.id, row.email]));
  const roleSet = new Set(roles);
  const profileRecipients = ((profilesResult.data ?? []) as Array<{
    id: string;
    role: string;
    full_name: string | null;
    display_name: string | null;
    farm_name: string | null;
    city: string | null;
    state: string | null;
  }>)
    .filter((row) => roleSet.size === 0 || roleSet.has(row.role))
    .map((row): RecipientCandidate | null => {
      const email = normalizeEmail(emailById.get(row.id));
      if (!email) return null;
      return {
        email,
        name: displayName(row),
        role: row.role,
        userId: row.id,
        source: "profile",
        metadata: { city: row.city, state: row.state },
      };
    })
    .filter(Boolean) as RecipientCandidate[];

  const leadRecipients = ((leadsResult.data ?? []) as Array<{
    visitor_email: string | null;
    visitor_name: string | null;
    visitor_phone: string | null;
    subject: string | null;
    source_path: string | null;
    created_at: string;
  }>).map((row): RecipientCandidate => ({
    email: normalizeEmail(row.visitor_email),
    name: row.visitor_name,
    role: null,
    userId: null,
    source: "public_support",
    metadata: {
      phone: row.visitor_phone,
      subject: row.subject,
      source_path: row.source_path,
      first_contact_at: row.created_at,
    },
  }));

  return dedupeRecipients([...profileRecipients, ...leadRecipients]);
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
  if (!id) fail("Template inválido.");

  const { data, error } = await supabase
    .from("email_marketing_templates")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) fail(error?.message || "Template não encontrado.");

  const original = data as EmailMarketingTemplate;
  const slug = normalizeTemplateSlug(`${original.slug}-copia-${Date.now().toString(36)}`);
  const { data: created, error: insertError } = await supabase
    .from("email_marketing_templates")
    .insert({
      slug,
      name: `${original.name} (cópia)`,
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
  if (!id) fail("Template inválido.");
  const { error } = await supabase
    .from("email_marketing_templates")
    .update({ status: "archived", updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) fail(error.message);
  revalidatePath("/admin/email-marketing");
  redirect("/admin/email-marketing?archived=1");
}

export async function sendTemplateTest(formData: FormData) {
  const { user, supabase } = await adminClient();
  const id = clean(formData.get("id"));
  if (!id) fail("Template inválido.");
  if (!user.email) fail("Seu usuário não tem email para receber o teste.");

  const { data, error } = await supabase
    .from("email_marketing_templates")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) fail(error?.message || "Template não encontrado.");

  const template = data as EmailMarketingTemplate;
  const unsubscribeUrl = "https://seraviecampo.com";
  const result = await sendMarketingEmail({
    to: user.email,
    toName: user.user_metadata?.full_name || user.email,
    subject: `[Teste] ${template.subject}`,
    html: renderEmailHtml(template).replaceAll("{{unsubscribe_url}}", unsubscribeUrl),
    text: templateToPlainText(template).replaceAll("{{unsubscribe_url}}", unsubscribeUrl),
    replyTo: null,
    unsubscribeUrl,
  });

  if (!result.ok) fail(result.error || "Não foi possível enviar o teste do template.");

  revalidatePath("/admin/email-marketing");
  redirect(marketingPage({ template: id, test: 1 }));
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
  if (error || !data) fail(error?.message || "Template não encontrado.");

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
  redirect(marketingPage({ template: template.id, campaign: campaign.id, campaign_created: 1 }));
}

export async function queueCampaign(formData: FormData) {
  const { user, supabase } = await adminClient();
  const campaignId = clean(formData.get("id"));
  if (!campaignId) fail("Campanha inválida.");

  const { data: campaignData, error: campaignError } = await supabase
    .from("email_marketing_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();
  if (campaignError || !campaignData) fail(campaignError?.message || "Campanha não encontrada.");

  const campaign = campaignData as EmailMarketingCampaign;
  if (!["draft", "queued", "scheduled", "paused"].includes(campaign.status)) {
    fail("Apenas campanhas em rascunho, fila, agendadas ou pausadas podem ter a fila atualizada.");
  }

  const [{ data: templateData, error: templateError }, { data: segmentData, error: segmentError }] = await Promise.all([
    campaign.template_id
      ? supabase.from("email_marketing_templates").select("*").eq("id", campaign.template_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    campaign.segment_id
      ? supabase.from("email_marketing_segments").select("*").eq("id", campaign.segment_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (templateError) fail(templateError.message);
  if (segmentError) fail(segmentError.message);

  const template = (templateData ?? null) as EmailMarketingTemplate | null;
  const segment = (segmentData ?? null) as EmailMarketingSegment | null;
  const recipients = await resolveCampaignRecipients(supabase, campaign, template, segment);
  if (recipients.length === 0) fail("Nenhum destinatário elegível foi encontrado para esta campanha.");

  const [{ data: suppressionsData, error: suppressionsError }, { data: subscribersData, error: subscribersError }] = await Promise.all([
    supabase.from("email_marketing_suppressions").select("email"),
    supabase.from("email_marketing_subscribers").select("id, email, subscribed, user_id"),
  ]);
  if (suppressionsError) fail(suppressionsError.message);
  if (subscribersError) fail(subscribersError.message);

  const suppressed = new Set(((suppressionsData ?? []) as Array<{ email: string }>).map((row) => normalizeEmail(row.email)));
  const subscriberByEmail = new Map(
    ((subscribersData ?? []) as Array<{ id: string; email: string; subscribed: boolean; user_id: string | null }>).map((row) => [
      normalizeEmail(row.email),
      row,
    ])
  );

  const missingSubscribers = recipients.filter((row) => !suppressed.has(row.email) && !subscriberByEmail.has(row.email));
  if (missingSubscribers.length) {
    const { error: insertSubscribersError } = await supabase.from("email_marketing_subscribers").insert(
      missingSubscribers.map((row) => ({
        user_id: row.userId,
        email: row.email,
        name: row.name,
        role: row.role,
        source: row.source,
        subscribed: true,
        consent_source: row.source === "profile" ? "conta_seravie" : "atendimento_site",
        metadata: row.metadata,
      }))
    );
    if (insertSubscribersError) fail(insertSubscribersError.message);
  }

  const { data: freshSubscribersData, error: freshSubscribersError } = await supabase
    .from("email_marketing_subscribers")
    .select("id, email, subscribed, user_id");
  if (freshSubscribersError) fail(freshSubscribersError.message);

  const freshSubscriberByEmail = new Map(
    ((freshSubscribersData ?? []) as Array<{ id: string; email: string; subscribed: boolean; user_id: string | null }>).map((row) => [
      normalizeEmail(row.email),
      row,
    ])
  );

  const { data: existingDeliveriesData, error: existingDeliveriesError } = await supabase
    .from("email_marketing_deliveries")
    .select("id, recipient_email, status")
    .eq("campaign_id", campaign.id);
  if (existingDeliveriesError) fail(existingDeliveriesError.message);

  const existingDeliveryEmails = new Set(((existingDeliveriesData ?? []) as Array<{ recipient_email: string }>).map((row) => normalizeEmail(row.recipient_email)));
  let skipped = 0;
  const deliveryRows = recipients.flatMap((row) => {
    const subscriber = freshSubscriberByEmail.get(row.email);
    if (suppressed.has(row.email) || !subscriber?.subscribed || existingDeliveryEmails.has(row.email)) {
      skipped += 1;
      return [];
    }
    return [
      {
        campaign_id: campaign.id,
        subscriber_id: subscriber.id,
        recipient_user_id: row.userId,
        recipient_email: row.email,
        recipient_name: row.name,
        status: "queued",
      },
    ];
  });

  let insertedDeliveries: Array<{ id: string; subscriber_id: string | null; recipient_user_id: string | null; recipient_email: string }> = [];
  if (deliveryRows.length) {
    const { data, error } = await supabase
      .from("email_marketing_deliveries")
      .insert(deliveryRows)
      .select("id, subscriber_id, recipient_user_id, recipient_email");
    if (error) fail(error.message);
    insertedDeliveries = (data ?? []) as typeof insertedDeliveries;
  }

  if (insertedDeliveries.length) {
    const { error: eventError } = await supabase.from("email_marketing_events").insert(
      insertedDeliveries.map((row) => ({
        campaign_id: campaign.id,
        delivery_id: row.id,
        subscriber_id: row.subscriber_id,
        recipient_user_id: row.recipient_user_id,
        recipient_email: row.recipient_email,
        event_type: "queued",
        provider_payload: { source: "super_admin_queue" },
      }))
    );
    if (eventError) fail(eventError.message);
  }

  const queuedTotal = (existingDeliveriesData?.length ?? 0) + insertedDeliveries.length;
  if (queuedTotal === 0) fail("Nenhum destinatário novo entrou na fila.");

  const stats = {
    ...(campaign.stats ?? {}),
    queued: queuedTotal,
    skipped,
  };

  const { error: updateError } = await supabase
    .from("email_marketing_campaigns")
    .update({
      status: "queued",
      stats,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaign.id);
  if (updateError) fail(updateError.message);

  revalidatePath("/admin/email-marketing");
  redirect(`/admin/email-marketing?campaign=${campaign.id}&queued=${insertedDeliveries.length}`);
}

export async function cancelQueuedCampaign(formData: FormData) {
  const { user, supabase } = await adminClient();
  const campaignId = clean(formData.get("id"));
  if (!campaignId) fail("Campanha inválida.");

  const { error: deliveriesError } = await supabase
    .from("email_marketing_deliveries")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("campaign_id", campaignId)
    .eq("status", "queued");
  if (deliveriesError) fail(deliveriesError.message);

  const { error: campaignError } = await supabase
    .from("email_marketing_campaigns")
    .update({ status: "cancelled", updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", campaignId);
  if (campaignError) fail(campaignError.message);

  revalidatePath("/admin/email-marketing");
  redirect(`/admin/email-marketing?campaign=${campaignId}&cancelled=1`);
}

export async function sendQueuedCampaign(formData: FormData) {
  await requireRole("super_admin");
  const campaignId = clean(formData.get("id"));
  if (!campaignId) fail("Campanha inválida.");

  const result = await processEmailMarketingQueue({ campaignId, limit: 25, force: true });
  if (!result.ok) fail(result.error || "Não foi possível processar a fila da campanha.");

  revalidatePath("/admin/email-marketing");
  redirect(`/admin/email-marketing?campaign=${campaignId}&processed=${result.processed}&sent=${result.sent}&failed=${result.failed}`);
}

export async function scheduleCampaign(formData: FormData) {
  const { user, supabase } = await adminClient();
  const campaignId = clean(formData.get("id"));
  const scheduledAtInput = clean(formData.get("scheduled_at"));
  if (!campaignId) fail("Campanha inválida.");
  if (!scheduledAtInput) fail("Informe uma data e horário para agendar.");

  const scheduledAt = parseBrasiliaDateTime(scheduledAtInput);
  if (!scheduledAt) fail("Data de agendamento inválida.");
  if (scheduledAt.getTime() <= Date.now()) fail("Escolha um horário futuro para agendar a campanha.");

  const { error } = await supabase
    .from("email_marketing_campaigns")
    .update({
      status: "scheduled",
      scheduled_at: scheduledAt.toISOString(),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
    .in("status", ["draft", "queued", "scheduled", "paused"]);
  if (error) fail(error.message);

  revalidatePath("/admin/email-marketing");
  redirect(marketingPage({ campaign: campaignId, scheduled: 1 }));
}

export async function retryFailedCampaign(formData: FormData) {
  const { user, supabase } = await adminClient();
  const campaignId = clean(formData.get("id"));
  if (!campaignId) fail("Campanha inválida.");

  const { data, error } = await supabase
    .from("email_marketing_deliveries")
    .update({
      status: "queued",
      sending_at: null,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq("campaign_id", campaignId)
    .eq("status", "failed")
    .select("id");
  if (error) fail(error.message);

  const retried = data?.length ?? 0;
  if (retried === 0) fail("Nenhuma entrega com falha foi encontrada nesta campanha.");

  const { error: campaignError } = await supabase
    .from("email_marketing_campaigns")
    .update({
      status: "queued",
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId);
  if (campaignError) fail(campaignError.message);

  revalidatePath("/admin/email-marketing");
  redirect(marketingPage({ campaign: campaignId, retried }));
}
