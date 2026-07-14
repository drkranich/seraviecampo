import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { deliveryByToken, incrementCampaignStat, recordMarketingEvent } from "@/lib/email-marketing-events";
import { SITE_URL } from "@/lib/public-url";

export const runtime = "nodejs";

function safeDestination(value: string | null) {
  if (!value) return SITE_URL;
  try {
    const url = new URL(value, SITE_URL);
    if (!["http:", "https:"].includes(url.protocol)) return SITE_URL;
    return url.toString();
  } catch {
    return SITE_URL;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const destination = safeDestination(url.searchParams.get("url"));
  const db = createServiceClient();
  if (!db || !token) return NextResponse.redirect(destination);

  try {
    const delivery = await deliveryByToken(db, token);
    if (delivery) {
      const firstClick = !delivery.clicked_at;
      if (firstClick) {
        await db.from("email_marketing_deliveries").update({ clicked_at: new Date().toISOString() }).eq("id", delivery.id);
        await incrementCampaignStat(db, delivery.campaign_id, "clicked");
      }
      await recordMarketingEvent(db, delivery, "clicked", { url: destination });
    }
  } catch {
    return NextResponse.redirect(destination);
  }

  return NextResponse.redirect(destination);
}
