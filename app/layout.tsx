import type { Metadata } from "next";
import "./globals.css";
import { createClient as createRaw } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";
import { getSite } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  try {
    // Cliente público (sem cookies) — evita tornar o layout raiz dinâmico no build.
    const supabase = createRaw(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const site = await getSite(supabase);
    return {
      title: `${site.brand} — Agro Gourmet`,
      description: site.hero_subtitle,
      icons: site.favicon_url ? { icon: site.favicon_url } : undefined,
    };
  } catch {
    return { title: "Seravie Campo — Agro Gourmet", description: "Sistema Operacional da Economia Local." };
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-campo-bg text-stone-100 antialiased">{children}</body>
    </html>
  );
}
