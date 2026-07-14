import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  deliveryByToken,
  incrementCampaignStat,
  normalizeMarketingEmail,
  recordMarketingEvent,
} from "@/lib/email-marketing-events";

export const runtime = "nodejs";

function page(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body{margin:0;min-height:100vh;display:grid;place-items:center;background:#14160F;color:#E7E9DB;font-family:Arial,sans-serif}
      main{width:min(92vw,560px);border:1px solid rgba(194,168,120,.36);border-radius:24px;background:rgba(31,35,24,.82);box-shadow:0 28px 90px rgba(0,0,0,.38);padding:32px}
      p{color:#C9BE93;line-height:1.7}
      a{color:#C2A878}
      small{display:block;margin-bottom:12px;color:#C2A878;letter-spacing:.24em;text-transform:uppercase}
    </style>
  </head>
  <body>
    <main>
      <small>Seravie Campo</small>
      <h1>${title}</h1>
      <p>${body}</p>
      <p><a href="https://seraviecampo.com">Voltar para a Seravie Campo</a></p>
    </main>
  </body>
</html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    }
  );
}

async function handle(request: Request) {
  const db = createServiceClient();
  if (!db) return page("Descadastro indisponível", "Não foi possível processar sua solicitação agora.", 503);

  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) return page("Link inválido", "O link de descadastro está incompleto.", 400);

  try {
    const delivery = await deliveryByToken(db, token);
    if (!delivery) return page("Link não encontrado", "Não encontramos uma entrega de email vinculada a este link.", 404);

    const email = normalizeMarketingEmail(delivery.recipient_email);
    const { data: suppression } = await db
      .from("email_marketing_suppressions")
      .select("id")
      .eq("email_key", email)
      .maybeSingle();

    if (suppression?.id) {
      await db
        .from("email_marketing_suppressions")
        .update({
          reason: "unsubscribed",
          source: "email_marketing",
          details: { campaign_id: delivery.campaign_id, delivery_id: delivery.id },
        })
        .eq("id", suppression.id);
    } else {
      await db.from("email_marketing_suppressions").insert({
        email,
        reason: "unsubscribed",
        source: "email_marketing",
        details: { campaign_id: delivery.campaign_id, delivery_id: delivery.id },
      });
    }

    if (delivery.subscriber_id) {
      await db
        .from("email_marketing_subscribers")
        .update({ subscribed: false, unsubscribed_at: new Date().toISOString() })
        .eq("id", delivery.subscriber_id);
    } else {
      await db
        .from("email_marketing_subscribers")
        .update({ subscribed: false, unsubscribed_at: new Date().toISOString() })
        .eq("email_key", email);
    }

    const firstUnsubscribe = !delivery.unsubscribed_at;
    await db
      .from("email_marketing_deliveries")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("id", delivery.id);

    if (firstUnsubscribe) {
      await recordMarketingEvent(db, delivery, "unsubscribed", { source: "unsubscribe_link" });
      await incrementCampaignStat(db, delivery.campaign_id, "unsubscribed");
    }

    return page("Descadastro confirmado", "Seu email foi removido das campanhas de marketing da Seravie Campo.");
  } catch {
    return page("Não foi possível concluir", "Tente novamente em instantes ou fale com a equipe Seravie Campo.", 500);
  }
}

export const GET = handle;
export const POST = handle;
