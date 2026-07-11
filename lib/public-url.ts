export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://seraviecampo.com").replace(/\/$/, "");

export function publicUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}
