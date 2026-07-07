import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { destinationHighlights, findDestination, getSite } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const site = await getSite(supabase);
  const destination = findDestination(site, slug);

  if (!destination) return { title: site.seo_title, description: site.seo_description };

  return {
    title: `${destination.name} | ${site.brand}`,
    description: destination.intro || destination.description || destination.region,
    openGraph: {
      title: `${destination.name} | ${site.brand}`,
      description: destination.intro || destination.description || destination.region,
      images: destination.image ? [{ url: destination.image }] : undefined,
    },
  };
}

export default async function DestinoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const site = await getSite(supabase);
  const destination = findDestination(site, slug);
  if (!destination) notFound();

  const highlights = destinationHighlights(destination);

  return (
    <main className="min-h-screen bg-[#10140E] text-forest-100">
      <header className="relative min-h-[78vh] overflow-hidden bg-[#15190f]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={destination.image} alt={destination.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,17,11,0.92),rgba(13,17,11,0.58),rgba(13,17,11,0.18)),linear-gradient(180deg,rgba(13,17,11,0.15),rgba(13,17,11,0.9))]" />
        </div>

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6">
          <Link href="/" className="font-serif text-xl text-forest-50">{site.brand}</Link>
          <div className="flex items-center gap-4 text-sm text-forest-100/80">
            <Link href="/destinos" className="hover:text-gold">Destinos</Link>
            <Link href="/experiencias" className="hover:text-gold">Experiências</Link>
            <Link href="/login" className="hover:text-gold">Entrar</Link>
          </div>
        </nav>

        <section className="relative z-10 mx-auto max-w-7xl px-5 pb-12 pt-16 sm:px-6 lg:pt-28">
          <p className="text-xs uppercase tracking-[0.26em] text-gold">{destination.region}</p>
          <h1 className="mt-4 max-w-4xl font-serif text-6xl font-semibold leading-none text-forest-50 sm:text-7xl">{destination.name}</h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-forest-50/80">{destination.intro || destination.description || site.destinations_text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={destination.cta_href || "/experiencias"} className="rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-campo-bg transition hover:bg-gold-light">
              {destination.cta_label || "Ver experiências"}
            </Link>
            <Link href="/destinos" className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-forest-50 transition hover:border-gold/60 hover:text-gold">
              Outros destinos
            </Link>
          </div>
        </section>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:py-20">
        <article>
          <p className="text-xs uppercase tracking-[0.24em] text-[#A9C875]">Guia do destino</p>
          <h2 className="mt-3 font-serif text-4xl text-forest-50">Por que ir agora</h2>
          <p className="mt-6 text-lg leading-relaxed text-stone-300">{destination.description || destination.intro || site.destinations_text}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#2D3326] bg-[#151A12] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gold">Melhor época</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-300">{destination.best_time || "Consulte a sazonalidade com os anfitriões locais."}</p>
            </div>
            <div className="rounded-lg border border-[#2D3326] bg-[#151A12] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gold">Tempo sugerido</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-300">{destination.travel_time || "Roteiros curtos e extensões de fim de semana."}</p>
            </div>
          </div>
        </article>

        <aside className="rounded-lg border border-[#2D3326] bg-[#151A12] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[#A8C7D3]">Destaques</p>
          <div className="mt-5 space-y-3">
            {(highlights.length ? highlights : site.stay_types.slice(0, 5)).map((item) => (
              <p key={item} className="rounded-lg border border-[#2D3326] bg-[#10140E] px-4 py-3 text-sm text-stone-300">{item}</p>
            ))}
          </div>
        </aside>
      </section>

      <section className="border-y border-[#2D3326] bg-[#17140F] py-14">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 sm:px-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">{site.brand}</p>
            <h2 className="mt-3 font-serif text-4xl text-forest-50">Monte seu roteiro com experiências locais.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">Combine estadia, gastronomia, vivências rurais e produtos regionais em uma jornada só.</p>
          </div>
          <Link href={destination.cta_href || "/experiencias"} className="w-fit rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-campo-bg transition hover:bg-gold-light">
            {destination.cta_label || "Explorar experiências"}
          </Link>
        </div>
      </section>
    </main>
  );
}
