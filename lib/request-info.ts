import { headers } from "next/headers";

export type RequestInfo = { ip: string | null; country: string | null; device: string | null; userAgent: string | null };

export async function getRequestInfo(): Promise<RequestInfo> {
  const h = await headers();
  const xff = h.get("x-forwarded-for") || "";
  const ip = (h.get("cf-connecting-ip") || xff.split(",")[0] || h.get("x-real-ip") || "").trim() || null;
  const country = h.get("cf-ipcountry") || null;
  const ua = h.get("user-agent") || "";
  const device = /mobile|android|iphone|ipad|ipod/i.test(ua) ? "Celular/Tablet" : ua ? "Computador" : null;
  return { ip, country, device, userAgent: ua || null };
}
