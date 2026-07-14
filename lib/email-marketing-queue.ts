import { renderDeliveryContent } from "@/lib/email-marketing";
import { incrementCampaignStat, recordMarketingEvent, type DeliveryEventRow } from "@/lib/email-marketing-events";
import { marketingEmailProviderReady, sendMarketingEmail } from "@/lib/email-marketing-send";
import { createServiceClient } from "@/lib/supabase/service";

type DeliveryRow = DeliveryEventRow & {
  delivery_token: string;
  recipient_name: string | null;
  attempts: number;
};

type CampaignRow = {
  id: string;
  status: string;
  subject: string;
  reply_to_email: string | null;
  content_snapshot: Record<string, unknown>;
};

export type ProcessEmailMarketingQueueResult = {
  ok: boolean;
  status: number;
  providerConfigured: boolean;
  processed: number;
  sent: number;
  failed: number;
  error?: string;
};

export async function processEmailMarketingQueue(options: { limit?: number; campaignId?: string | null } = {}): Promise<ProcessEmailMarketingQueueResult> {
  const db = createServiceClient();
  if (!db) {
    return { ok: false, status: 500, providerConfigured: false, processed: 0, sent: 0, failed: 0, error: "Service role ausente." };
  }

  if (!marketingEmailProviderReady()) {
    return {
      ok: false,
      status: 503,
      providerConfigured: false,
      processed: 0,
      sent: 0,
      failed: 0,
      error: "Configure Cloudflare Email Service ou RESEND_API_KEY com EMAIL_MARKETING_FROM para processar a fila.",
    };
  }

  const limit = Math.min(Math.max(options.limit ?? 10, 1), 50);
  let deliveriesQuery = db
    .from("email_marketing_deliveries")
    .select("id, campaign_id, subscriber_id, recipient_user_id, recipient_email, recipient_name, delivery_token, attempts")
    .eq("status", "queued")
    .order("queued_at", { ascending: true })
    .limit(limit);

  if (options.campaignId) deliveriesQuery = deliveriesQuery.eq("campaign_id", options.campaignId);

  const { data: deliveries, error: deliveriesError } = await deliveriesQuery;
  if (deliveriesError) {
    return { ok: false, status: 500, providerConfigured: true, processed: 0, sent: 0, failed: 0, error: deliveriesError.message };
  }

  const rows = (deliveries ?? []) as DeliveryRow[];
  if (rows.length === 0) {
    return { ok: true, status: 200, providerConfigured: true, processed: 0, sent: 0, failed: 0 };
  }

  const campaignIds = Array.from(new Set(rows.map((row) => row.campaign_id)));
  const { data: campaigns, error: campaignsError } = await db
    .from("email_marketing_campaigns")
    .select("id, status, subject, reply_to_email, content_snapshot")
    .in("id", campaignIds);
  if (campaignsError) {
    return { ok: false, status: 500, providerConfigured: true, processed: 0, sent: 0, failed: 0, error: campaignsError.message };
  }

  const campaignById = new Map(((campaigns ?? []) as CampaignRow[]).map((campaign) => [campaign.id, campaign]));
  let sent = 0;
  let failed = 0;
  const touchedCampaignIds = new Set<string>();

  for (const delivery of rows) {
    const campaign = campaignById.get(delivery.campaign_id);
    if (!campaign || !["queued", "scheduled", "sending"].includes(campaign.status)) continue;

    touchedCampaignIds.add(campaign.id);
    await db
      .from("email_marketing_deliveries")
      .update({ status: "sending", sending_at: new Date().toISOString(), attempts: delivery.attempts + 1 })
      .eq("id", delivery.id)
      .eq("status", "queued");

    const content = renderDeliveryContent(campaign.content_snapshot, delivery.delivery_token);
    const result = await sendMarketingEmail({
      to: delivery.recipient_email,
      toName: delivery.recipient_name,
      subject: content.subject || campaign.subject,
      html: content.html,
      text: content.text,
      replyTo: campaign.reply_to_email,
      unsubscribeUrl: content.unsubscribeUrl,
    });

    if (result.ok) {
      sent += 1;
      await db
        .from("email_marketing_deliveries")
        .update({
          status: "sent",
          provider: result.provider,
          provider_message_id: result.messageId,
          sent_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", delivery.id);
      await recordMarketingEvent(db, delivery, "sent", {
        provider: result.provider,
        provider_message_id: result.messageId,
        queued_by_provider: result.queued,
      });
      await incrementCampaignStat(db, campaign.id, "sent");
    } else {
      failed += 1;
      await db
        .from("email_marketing_deliveries")
        .update({
          status: "failed",
          provider: result.provider,
          error_message: result.error || "Falha no provedor de email.",
        })
        .eq("id", delivery.id);
      await recordMarketingEvent(db, delivery, "failed", { provider: result.provider, error: result.error });
      await incrementCampaignStat(db, campaign.id, "failed");
    }
  }

  for (const campaignId of touchedCampaignIds) {
    const { count: remaining } = await db
      .from("email_marketing_deliveries")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .in("status", ["queued", "sending"]);
    await db
      .from("email_marketing_campaigns")
      .update({
        status: remaining ? "sending" : "sent",
        sent_at: remaining ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId);
  }

  return { ok: true, status: 200, providerConfigured: true, processed: rows.length, sent, failed };
}
