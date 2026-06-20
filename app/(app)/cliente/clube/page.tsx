import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import type { ProductCategory } from "@/lib/catalog";

const CESTAS: { title: string; desc: string; category: ProductCategory; emoji: string }[] = [
  { title: "Cesta Queijos de Minas", desc: "Queijos artesanais curados, com história de família.", category: "laticinios", emoji: "🧀" },
  { title: "Cesta Hortifrúti Fresca", desc: "Verduras, legumes e frutas colhidos no ponto.", category: "hortifruti", emoji: "🥬" },
  { title: "Cesta Cafés Especiais", desc: "Grãos selecionados da serra, torra artesanal.", category: "cafe", emoji: "☕" },
  { title: "Cesta Mel & Geleias", desc: "Mel puro e geleias caseiras da roça.", category: "mel_geleias", emoji: "🍯" },
  { title: "Cesta da Roça", desc: "Ovos caipira e o melhor do campo.", category: "ovos", emoji: "🥚" },
  { title: "Cesta Orgânica", desc: "Tudo orgânico, sem agrotóxicos.", category: "organicos", emoji: "🌱" },
];

export default async function ClubePage() {
  const { profile } = await requireRole("cliente");
  const supabase = await createClient();

  const { data } = await supabase.from("products").select("category").eq("available", true);
  const counts = new Map<string, number>();
  for (const r of (data ?? []) as { category: string }[]) {
    counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
  }

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} userName={profile?.full_name ?? "Cliente"} title="Clube Gourmet" subtitle="Cestas selecionadas que chegam até você.">
      <section className="mb-8 overflow-hidden rounded-2xl border border-campo-border bg-gradient-to-br from-forest-900 via-campo-surface to-campo-bg p-8 sm:p-12">
        <p className="font-serif text-sm uppercase tracking-[0.3em] text-gold">Experiência de descoberta</p>
        <h2 className="mt-2 max-w-xl font-serif text-3xl text-forest-100 sm:text-4xl">Sabores raros, direto de quem produz</h2>
        <p className="mt-3 max-w-lg text-stone-400">Monte sua cesta temática com os melhores produtores da sua região. Em breve, receba automaticamente toda semana.</p>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CESTAS.map((c) => {
          const n = counts.get(c.category) ?? 0;
          return (
            <article key={c.title} className="glass flex flex-col rounded-2xl border border-campo-border p-6">
              <span className="text-4xl">{c.emoji}</span>
              <h3 className="mt-3 font-serif text-xl text-forest-100">{c.title}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-stone-400">{c.desc}</p>
              <p className="mt-3 text-xs text-stone-500">{n} produto(s) disponível(is)</p>
              <Link
                href={`/cliente/explorar?category=${c.category}`}
                className="mt-4 rounded-lg bg-gold py-2.5 text-center text-sm font-medium text-campo-bg transition hover:bg-gold-light"
              >
                Montar minha cesta
              </Link>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
