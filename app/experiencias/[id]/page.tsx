import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSite } from "@/lib/site";
import { stripeEnabled } from "@/lib/stripe";
import { Carousel } from "@/components/Carousel";
import { ExperienceBooking } from "@/components/ExperienceBooking";
import { EXP_CATEGORY_LABEL, durationLabel, type Experience } from "@/lib/experiences";

export const dynamic = "force-dynamic";

type ExpWithProducer = Experience & {
  producer: { id: string; full_name: string | null; display_name: string | null; farm_name: string | null; city: string | null; state: string | null; avatar_url: string | null; bio: string | null } | null;
};

export default async function ExperienciaDetalhePublic({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; canceled?: string; ok?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const site = await getSite(supabase);

  const { data } = await supabase
    .from("experiences")
    .select("*, producer:profiles!experiences_producer_id_fkey(id, full_name, display_name, farm_name, city, state, avatar_url, bio)")
    .eq("id", id).eq("active", true).eq("archived", false)
    .maybeSingle();
  if (!data) notFound();
  const exp = data as unknown as ExpWithProducer;

  const { data: { user } } = await supabase.auth.getUser();
  const imgs = exp.images?.length ? exp.images : [];
  const prod = exp.producer;
  const prodName = prod?.farm_name || prod?.display_name || prod?.full_name || "Produtor";
  const local = exp.location || [prod?.city, prod?.state].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-serif text-xl text-forest-100">{site.brand}</Link>
        <Link href="/experiencias" className="text-sm text-stone-400 transition hover:text-gold">← Todas as experiências</Link>
      </nav>

      <div className="mx-auto max-w-6xl px-6 pb-16">
        {sp.ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Reserva confirmada! O anfitrião foi avisado. Veja seus detalhes em “Experiências”.</div>}
        {sp.canceled && <div className="mb-4 rounded-lg border border-campo-border bg-campo-surface2 px-3 py-2 text-sm text-stone-400">Reserva não concluída. Você pode tentar novamente.</div>}
        {sp.error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{decodeURIComponent(sp.error)}</div>}

        <div className="overflow-hidden rounded-3xl border border-campo-border bg-campo-surface2">
          {imgs.length > 0 ? (
            <Carousel images={imgs} alt={exp.title} className="aspect-[16/7] w-full" />
          ) : (
            <div className="flex aspect-[16/7] w-full items-center justify-center text-6xl opacity-30">🌿</div>
          )}
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <span className="inline-block rounded-full border border-gold/40 px-3 py-0.5 text-xs uppercase tracking-wider text-gold">{EXP_CATEGORY_LABEL[exp.category]}</span>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-forest-100">{exp.title}</h1>
            {exp.summary && <p className="mt-3 text-lg leading-relaxed text-stone-300">{exp.summary}</p>}

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-400">
              {local && <span>📍 {local}</span>}
              <span>⏳ {durationLabel(exp.duration_min)}</span>
              <span>👥 até {exp.capacity} pessoas</span>
            </div>

            {exp.description && (
              <div className="mt-8">
                <h2 className="font-serif text-xl text-forest-100">Sobre a experiência</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-300">{exp.description}</p>
              </div>
            )}

            {exp.includes?.length > 0 && (
              <div className="mt-8">
                <h2 className="font-serif text-xl text-forest-100">O que está incluso</h2>
                <ul className="mt-3 space-y-2 text-stone-300">
                  {exp.includes.map((it) => (
                    <li key={it} className="flex items-start gap-2"><span className="mt-0.5 text-leaf">✓</span> {it}</li>
                  ))}
                </ul>
              </div>
            )}

            {prod && (
              <div className="mt-8 flex items-center gap-3 rounded-2xl border border-campo-border glass p-4">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-campo-surface2 text-lg">
                  {prod.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={prod.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : "🌾"}
                </div>
                <div>
                  <p className="font-serif text-forest-100">{prodName}</p>
                  <p className="text-xs text-stone-500">{local || "Anfitrião Seravie Campo"}</p>
                </div>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            {user ? (
              <ExperienceBooking experienceId={exp.id} priceCents={exp.price_cents} currency={exp.currency} capacity={exp.capacity} enabled={stripeEnabled()} />
            ) : (
              <div className="glass rounded-2xl border border-campo-border p-6 text-center">
                <p className="font-serif text-2xl text-gold">{(exp.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: exp.currency })}<span className="text-sm text-stone-500"> /pessoa</span></p>
                <p className="mt-3 text-sm text-stone-400">Entre na sua conta para reservar esta experiência.</p>
                <Link href={`/login?next=/experiencias/${exp.id}`} className="mt-4 block rounded-lg bg-gold py-3 font-medium text-campo-bg transition hover:bg-gold-light">Entrar para reservar</Link>
                <Link href="/signup" className="mt-2 block rounded-lg border border-campo-border py-3 text-stone-200 transition hover:border-gold/50">Criar conta</Link>
              </div>
            )}
          </aside>
        </div>
      </div>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs leading-relaxed text-stone-600">{site.footer}</footer>
    </main>
  );
}
