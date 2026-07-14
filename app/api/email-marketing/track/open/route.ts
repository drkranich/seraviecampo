import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { deliveryByToken, incrementCampaignStat, recordMarketingEvent } from "@/lib/email-marketing-events";

export const runtime = "nodejs";

const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

function pixel() {
  return new NextResponse(PIXEL, {
    headers: {
      "content-type": "image/png",
      "cache-control": "no-store, max-age=0",
    },
  });
}

export async function GET(request: Request) {
  const db = createServiceClient();
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!db || !token) return pixel();

  try {
    const delivery = await deliveryByToken(db, token);
    if (!delivery) return pixel();

    const firstOpen = !delivery.opened_at;
    if (firstOpen) {
      await db.from("email_marketing_deliveries").update({ opened_at: new Date().toISOString() }).eq("id", delivery.id);
      await recordMarketingEvent(db, delivery, "opened", { source: "tracking_pixel" });
      await incrementCampaignStat(db, delivery.campaign_id, "opened");
    }
  } catch {
    return pixel();
  }

  return pixel();
}
