import Link from "next/link";
import { PublicSupportChatWidget } from "@/components/PublicSupportChatWidget";
import { getPublicDestinations, type PublicDestination } from "@/lib/public-destinations";
import { createClient } from "@/lib/supabase/server";
import { destinationHref, getSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function DestinosPage() {
  const supabase = await createClient();
  const site = await getSite(supabase);
  const destinations = await getPublicDestinations(supabase, site);
  const liveDestinations = destinations.filter((destination) => destination.listing_count > 0);
  const editorialDestinations = destinations.filter((destination) => destination.listing_count === 0);
  const publishedOfferCount = liveDestinations.reduce((total, destination) => total + destination.listing_count, 0);
  const producerCount = liveDestinations.reduce((total, destination) => total + destination.producer_count, 0);

  return (
    <main className="min-h-screen bg-[#10140E] text-forest-100">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6">
        <Link href="/" className="font-serif text-xl text-forest-50">{site.brand}</Link>
        <div className="flex items-center gap-4 text-sm text-stone-300">
          <Link href="/experiencias" className="hover:text-gold">Experiências</Link>
          <Link href="/login" className="hover:text-gold">Entrar</Link>
        </div>
      </nav>

      <header className="mx-auto max-w-7xl px-5 pb-10 pt-8 sm:px-6 lg:pb-14">
        <p className="text-xs uppercase tracking-[0.24em] text-[#A9C875]">{site.destinations_label}</p>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-none text-forest-50 sm:text-6xl">{site.destinations_title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stone-400">{site.destinations_text}</p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-500">
          A vitrine nasce das cidades e rotas onde produtores, anfitriões e parceiros locais já publicam produtos, vivências e serviços conectados ao campo.
        </p>
        <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
          <DestinationStat label="Destinos ativos" value={String(liveDestinations.length)} />
          <DestinationStat label="Ofertas publicadas" value={String(publishedOfferCount)} />
          <DestinationStat label="Anfitriões e produtores" value={String(producerCount)} />
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#A9C875]">Atualizado pela plataforma</p>
            <h2 className="mt-2 font-serif text-3xl text-forest-50">Destinos com ofertas ativas</h2>
          </div>
          <Link href="/signup?role=produtor" className="rounded-lg border border-gold/40 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/10">
            Anunciar no meu destino
          </Link>
        </div>

        {liveDestinations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {liveDestinations.map((destination) => (
              <DestinationCard key={destination.slug || destination.name} destination={destination} siteText={site.destinations_text} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-campo-border bg-campo-surface p-8 text-center">
            <h3 className="font-serif text-2xl text-forest-50">Nenhum destino com oferta ativa ainda.</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
              Assim que um produtor ou parceiro publicar produto, experiência ou serviço com cidade e estado no perfil, o destino aparece automaticamente nesta vitrine.
            </p>
            <Link href="/signup?role=produtor" className="mt-5 inline-block rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-campo-bg transition hover:bg-gold-light">
              Publicar minha primeira oferta
            </Link>
          </div>
        )}
      </section>

      {editorialDestinations.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.24em] text-gold">Curadoria Seravie Campo</p>
            <h2 className="mt-2 font-serif text-3xl text-forest-50">Lugares que combinam com a proposta</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {editorialDestinations.slice(0, 4).map((destination) => (
              <DestinationCard key={destination.slug || destination.name} destination={destination} siteText={site.destinations_text} compact />
            ))}
          </div>
        </section>
      )}
      <PublicSupportChatWidget />
    </main>
  );
}

function DestinationCard({ destination, siteText, compact }: { destination: PublicDestination; siteText: string; compact?: boolean }) {
  return (
    <Link href={destinationHref(destination)} className="group overflow-hidden rounded-lg border border-campo-border bg-campo-surface">
      <div className={`overflow-hidden bg-campo-surface2 ${compact ? "aspect-[16/10]" : "aspect-[4/5]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={destination.image} alt={destination.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs uppercase tracking-[0.22em] text-gold">{destination.region}</p>
          <span className="rounded-full border border-[#A9C875]/35 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-[#A9C875]">
            {destination.listing_count > 0 ? "Ofertas reais" : "Curadoria"}
          </span>
        </div>
        <h2 className="mt-2 font-serif text-3xl text-forest-50">{destination.name}</h2>
        {destination.listing_count > 0 && (
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#A9C875]">{destination.offer_label}</p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-stone-400">{destination.intro || destination.description || siteText}</p>
        {destination.listing_count > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-campo-border pt-4 text-center">
            <SmallCount label="Produtos" value={destination.product_count} />
            <SmallCount label="Experiências" value={destination.experience_count} />
            <SmallCount label="Locais" value={destination.producer_count} />
          </div>
        )}
      </div>
    </Link>
  );
}

function DestinationStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-campo-border bg-campo-surface/70 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className="mt-1 font-serif text-2xl text-forest-50">{value}</p>
    </div>
  );
}

function SmallCount({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-serif text-lg text-forest-50">{value}</p>
      <p className="text-[0.65rem] uppercase tracking-[0.12em] text-stone-500">{label}</p>
    </div>
  );
}
