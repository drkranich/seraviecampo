import Link from "next/link";
import { PublicSupportChatWidget } from "@/components/PublicSupportChatWidget";
import { createClient } from "@/lib/supabase/server";
import { getSite } from "@/lib/site";
import { EXP_CATEGORY_LABEL, formatExpPrice, durationLabel, type Experience } from "@/lib/experiences";

export const dynamic = "force-dynamic";

type ExpWithProducer = Experience & {
  producer: {
    full_name: string | null;
    display_name: string | null;
    farm_name: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
};

type DisplayExperience = ExpWithProducer & { distanceKm: number | null };

function normalizePlace(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesDestination(experience: ExpWithProducer, query: string) {
  const normalizedQuery = normalizePlace(query);
  if (!normalizedQuery || normalizedQuery === "minha localizacao atual") return true;

  const producer = experience.producer;
  const fields = [experience.location, producer?.city, producer?.state, producer?.country]
    .filter(Boolean)
    .map((field) => normalizePlace(String(field)));
  if (fields.some((field) => field && (field.includes(normalizedQuery) || normalizedQuery.includes(field)))) return true;

  const haystack = fields.join(" ");
  const tokens = normalizedQuery.split(/[\s,]+/).filter((token) => token.length > 2);
  return tokens.some((token) => haystack.includes(token));
}

function distanceKm(fromLat: number, fromLng: number, toLat: number | null | undefined, toLng: number | null | undefined) {
  if (toLat == null || toLng == null) return null;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceLabel(km: number) {
  return km < 10 ? `${km.toFixed(1)} km de você` : `${Math.round(km)} km de você`;
}

export default async function ExperienciasPublicPage({
  searchParams,
}: { searchParams: Promise<{ destino?: string; lat?: string; lng?: string }> }) {
  const supabase = await createClient();
  const site = await getSite(supabase);
  const sp = await searchParams;
  const destino = String(sp.destino || "").trim();
  const lat = Number(sp.lat);
  const lng = Number(sp.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const { data } = await supabase
    .from("experiences")
    .select("*, producer:profiles!experiences_producer_id_fkey(full_name, display_name, farm_name, city, state, country, lat, lng)")
    .eq("active", true)
    .eq("archived", false)
    .order("created_at", { ascending: false });
  const allExperiences = (data ?? []) as unknown as ExpWithProducer[];
  const filteredExperiences = destino ? allExperiences.filter((experience) => matchesDestination(experience, destino)) : allExperiences;
  const experiences: DisplayExperience[] = filteredExperiences
    .map((experience) => ({
      ...experience,
      distanceKm: hasCoords ? distanceKm(lat, lng, experience.producer?.lat, experience.producer?.lng) : null,
    }))
    .sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      return 0;
    });

  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-serif text-xl text-forest-100">{site.brand}</Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Entrar</Link>
          <Link href="/signup" className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Criar conta</Link>
        </div>
      </nav>

      <header className="mx-auto max-w-4xl px-6 pb-8 pt-8 text-center">
        <p className="font-serif text-sm uppercase tracking-[0.3em] text-gold">Seravie Campo</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-forest-100 sm:text-5xl">{site.experiencias_title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-stone-400">{site.experiencias_subtitle}</p>
        <p className="mt-5 text-sm text-stone-500">
          Quer ofertar a sua?{" "}
          <Link href="/signup?role=parceiro" className="text-gold hover:underline">Torne-se um anfitrião de experiências</Link>
        </p>
        {(destino || hasCoords) && (
          <p className="mt-4 text-sm text-stone-400">
            Busca por <span className="text-gold">{destino || "sua localização atual"}</span>
            <Link href="/experiencias" className="ml-3 text-stone-500 hover:text-gold">Limpar</Link>
          </p>
        )}
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        {experiences.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-campo-border glass p-12 text-center text-stone-400">
            {destino ? `Ainda não há experiências publicadas para ${destino}. Explore outros destinos da rede Seravie Campo.` : "No momento, não há experiências publicadas. Explore os destinos e acompanhe as próximas vivências da rede Seravie Campo."}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {experiences.map((e) => {
              const cover = e.images?.[0];
              const prod = e.producer;
              const local = e.location || [prod?.city, prod?.state].filter(Boolean).join(", ");
              return (
                <Link key={e.id} href={`/experiencias/${e.id}`}
                  className="group glass overflow-hidden rounded-3xl border border-campo-border transition hover:border-gold/50">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-campo-surface2">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={e.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl opacity-30">SC</div>
                    )}
                  </div>
                  <div className="p-5">
                    <span className="inline-block rounded-full border border-gold/40 px-3 py-0.5 text-[0.65rem] uppercase tracking-wider text-gold">{EXP_CATEGORY_LABEL[e.category]}</span>
                    <h2 className="mt-3 font-serif text-xl leading-snug text-forest-100">{e.title}</h2>
                    {e.summary && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-stone-400">{e.summary}</p>}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-stone-500">{e.distanceKm != null ? distanceLabel(e.distanceKm) : local || durationLabel(e.duration_min)}</span>
                      <span className="font-serif text-gold">{formatExpPrice(e.price_cents, e.currency)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs leading-relaxed text-stone-600">{site.footer}</footer>
      <PublicSupportChatWidget />
    </main>
  );
}
