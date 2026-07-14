type SupabaseLike = {
  from: (table: string) => any;
};

export type DeliveryEventRow = {
  id: string;
  campaign_id: string;
  subscriber_id: string | null;
  recipient_user_id: string | null;
  recipient_email: string;
  opened_at?: string | null;
  clicked_at?: string | null;
  unsubscribed_at?: string | null;
};

export function normalizeMarketingEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export async function deliveryByToken(db: SupabaseLike, token: string) {
  const { data, error } = await db
    .from("email_marketing_deliveries")
    .select("id, campaign_id, subscriber_id, recipient_user_id, recipient_email, opened_at, clicked_at, unsubscribed_at")
    .eq("delivery_token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as DeliveryEventRow | null;
}

export async function recordMarketingEvent(
  db: SupabaseLike,
  delivery: DeliveryEventRow,
  eventType: "queued" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "complained" | "unsubscribed" | "failed",
  payload: Record<string, unknown> = {}
) {
  const { error } = await db.from("email_marketing_events").insert({
    campaign_id: delivery.campaign_id,
    delivery_id: delivery.id,
    subscriber_id: delivery.subscriber_id,
    recipient_user_id: delivery.recipient_user_id,
    recipient_email: delivery.recipient_email,
    event_type: eventType,
    provider_payload: payload,
  });
  if (error) throw new Error(error.message);
}

export async function incrementCampaignStat(db: SupabaseLike, campaignId: string, key: string) {
  const { data, error } = await db.from("email_marketing_campaigns").select("stats").eq("id", campaignId).maybeSingle();
  if (error) throw new Error(error.message);
  const stats = ((data?.stats ?? {}) as Record<string, number>) || {};
  const current = Number(stats[key] ?? 0);
  const { error: updateError } = await db
    .from("email_marketing_campaigns")
    .update({ stats: { ...stats, [key]: current + 1 }, updated_at: new Date().toISOString() })
    .eq("id", campaignId);
  if (updateError) throw new Error(updateError.message);
}
