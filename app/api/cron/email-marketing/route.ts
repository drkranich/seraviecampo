import { NextResponse } from "next/server";
import { processEmailMarketingQueue } from "@/lib/email-marketing-queue";

export const runtime = "nodejs";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") || "";
  const key = new URL(request.url).searchParams.get("key");
  return Boolean(secret && (auth === `Bearer ${secret}` || key === secret));
}

async function handle(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") ?? 10);
  const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 10, 1), 50);
  const campaignId = url.searchParams.get("campaign_id");
  const result = await processEmailMarketingQueue({ limit, campaignId });
  return NextResponse.json(result, { status: result.status });
}

export const GET = handle;
export const POST = handle;
