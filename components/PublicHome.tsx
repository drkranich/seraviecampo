import Link from "next/link";
import type { PublicDestination } from "@/lib/public-destinations";
import { DestinationSearchField } from "@/components/DestinationSearchField";
import { PublicSupportChatWidget } from "@/components/PublicSupportChatWidget";
import { destinationHref, type SiteContent } from "@/lib/site";

const teaserBorders = ["border-[#C2A878]", "border-[#7CA049]", "border-[#9A9A66]"];

export function PublicHome({ site, destinations }: { site: SiteContent; destinations?: PublicDestination[] }) {
  const visibleDestinations = destinations?.length ? destinations : site.destinations;

  return (
    <main className="min-h-screen overflow-hidden bg-[#11150F] text-forest-100">
      <header className="relative min-h-[86vh] bg-[#15190f]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={site.hero_image_url} alt={site.hero_title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,17,11,0.92),rgba(13,17,11,0.62),rgba(13,17,11,0.18)),linear-gradient(180deg,rgba(13,17,11,0.26),rgba(13,17,11,0.88))]" />
        </div>

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6">
          <Link href="/" className="font-serif text-xl font-semibold text-forest-50">
            {site.brand}
          </Link>
          <div className="hidden items-center gap-5 text-sm text-forest-100/80 md:flex">
            <a href="#destinos" className="transition hover:text-gold">Destinos</a>
            <a href="#experiencias" className="transition hover:text-gold">Experiências</a>
            <a href="#anfitrioes" className="transition hover:text-gold">Anfitriões</a>
            <Link href="/sobre" className="transition hover:text-gold">Sobre</Link>
            <Link href="/login" className="transition hover:text-gold">Entrar</Link>
          </div>
          <Link href="/signup" className="relative z-10 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-campo-bg transition hover:bg-gold-light">
            {site.hero_cta}
          </Link>
        </nav>

        <section className="relative z-10 mx-auto flex max-w-7xl flex-col px-5 pb-10 pt-12 sm:px-6 lg:pt-20">
          <div className="max-w-3xl">
            <p className="font-serif text-sm uppercase tracking-[0.3em] text-[#D9C68D]">{site.hero_kicker}</p>
            <h1 className="mt-4 font-serif text-5xl font-semibold leading-[0.95] text-forest-50 sm:text-7xl">
              {site.hero_title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-forest-50/80 sm:text-xl">
              {site.hero_subtitle}
            </p>
          </div>

          <form action="/experiencias" className="mt-10 grid max-w-6xl gap-2 rounded-lg border border-white/20 bg-[#10140E]/80 p-2 shadow-2xl shadow-black/30 backdrop-blur md:grid-cols-[1.3fr_1fr_1fr_.8fr_auto]">
            <DestinationSearchField destinations={visibleDestinations} />
            <label className="flex flex-col rounded-md bg-white/[0.06] px-4 py-3">
              <span className="text-xs uppercase tracking-[0.18em] text-forest-100/60">Chegada</span>
              <input name="checkin" type="date" className="mt-1 bg-transparent text-sm text-forest-50 outline-none [color-scheme:dark]" />
            </label>
            <label className="flex flex-col rounded-md bg-white/[0.06] px-4 py-3">
              <span className="text-xs uppercase tracking-[0.18em] text-forest-100/60">Saída</span>
              <input name="checkout" type="date" className="mt-1 bg-transparent text-sm text-forest-50 outline-none [color-scheme:dark]" />
            </label>
            <label className="flex flex-col rounded-md bg-white/[0.06] px-4 py-3">
              <span className="text-xs uppercase tracking-[0.18em] text-forest-100/60">Pessoas</span>
              <input name="hospedes" type="number" min="1" placeholder="2" className="mt-1 bg-transparent text-sm text-forest-50 outline-none placeholder:text-forest-100/40" />
            </label>
            <button className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-campo-bg transition hover:bg-gold-light">
              Buscar
            </button>
          </form>

          <div className="mt-10 grid gap-3 text-sm text-forest-50/80 sm:grid-cols-3">
            {site.hero_teasers.slice(0, 3).map((teaser, index) => (
              <p key={teaser} className={`border-l ${teaserBorders[index] ?? "border-[#C2A878]"} pl-3`}>
                {teaser}
              </p>
            ))}
          </div>
        </section>
      </header>

      <section className="border-y border-[#2D3326] bg-[#151A12]">
        <div className="mx-auto grid max-w-7xl gap-0 px-5 py-5 sm:px-6 md:grid-cols-4">
          {site.ecosystem.map((item) => (
            <article key={item.label} className="border-[#2D3326] py-5 md:border-r md:px-5 md:first:pl-0 md:last:border-r-0">
              <p className="text-xs uppercase tracking-[0.22em] text-gold">{item.label}</p>
              <h2 className="mt-2 font-serif text-2xl text-forest-50">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-400">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="destinos" className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#A9C875]">{site.destinations_label}</p>
            <h2 className="mt-3 font-serif text-4xl text-forest-50">{site.destinations_title}</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-stone-400">{site.destinations_text}</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {visibleDestinations.slice(0, 4).map((destination) => (
              <Link key={destination.name} href={destinationHref(destination)} className="group overflow-hidden rounded-lg border border-campo-border bg-campo-surface">
                <div className="aspect-[4/5] overflow-hidden bg-campo-surface2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={destination.image} alt={destination.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-2xl text-forest-50">{destination.name}</h3>
                  <p className="mt-1 text-sm text-stone-400">{destination.region}</p>
                </div>
              </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#0F1514] py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#C9BE93]">{site.stay_label}</p>
            <h2 className="mt-3 font-serif text-4xl text-forest-50">{site.stay_title}</h2>
            <p className="mt-5 text-sm leading-relaxed text-stone-400">{site.stay_text}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {site.stay_types.map((type) => (
              <Link key={type} href="/experiencias" className="rounded-lg border border-[#2D3326] bg-[#171D15] px-4 py-3 text-sm text-forest-100 transition hover:border-gold/60 hover:text-gold">
                {type}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="experiencias" className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#E0A077]">{site.home_experiences_label}</p>
            <h2 className="mt-3 font-serif text-4xl text-forest-50">{site.home_experiences_title}</h2>
            <p className="mt-5 text-sm leading-relaxed text-stone-400">{site.home_experiences_text}</p>
            {site.experiencias_enabled && (
              <Link href="/experiencias" className="mt-6 inline-flex rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-campo-bg transition hover:bg-gold-light">
                Explorar experiências
              </Link>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {site.experience_tracks.map((track) => (
              <Link key={track.title} href={track.href ?? "/experiencias"} className={`rounded-lg border bg-[#171D15] p-5 transition hover:bg-[#1E251B] ${track.accent || "border-[#C2A878] text-[#D4BD8C]"}`}>
                <h3 className="font-serif text-2xl">{track.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-400">{track.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#2D3326] bg-[#17140F] py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">{site.products_label}</p>
            <h2 className="mt-3 font-serif text-4xl text-forest-50">{site.products_title}</h2>
            <p className="mt-5 text-sm leading-relaxed text-stone-400">{site.products_text}</p>
            <div className="mt-7 flex flex-wrap gap-2 text-sm">
              {site.product_tags.map((item) => (
                <span key={item} className="rounded-lg border border-[#3C3524] bg-[#201A10] px-3 py-2 text-[#D4BD8C]">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#3C3524] bg-[#211B12] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[#D4BD8C]">{site.guides_label}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {site.guide_links.map((guide) => (
                <Link key={guide.label} href={guide.href || "/signup"} className="rounded-lg border border-[#3C3524] px-4 py-3 text-sm text-stone-300 transition hover:border-gold/60 hover:text-gold">
                  {guide.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#101714] py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#C9BE93]">{site.featured_label}</p>
              <h2 className="mt-3 font-serif text-4xl text-forest-50">{site.featured_title}</h2>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-stone-400 md:justify-self-end">{site.featured_text}</p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {site.featured_items.map((item) => (
              <Link key={`${item.label}-${item.title}`} href={item.href || "/experiencias"} className="group overflow-hidden rounded-lg border border-[#293A34] bg-[#151F1B] transition hover:border-[#C9BE93]/60">
                <div className="aspect-[16/10] overflow-hidden bg-campo-surface2">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full bg-[#20281E]" />
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#C9BE93]">{item.label}</p>
                  <h3 className="mt-2 font-serif text-2xl text-forest-50">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone-400">{item.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="anfitrioes" className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#A9C875]">{site.host_label}</p>
            <h2 className="mt-3 font-serif text-4xl text-forest-50">{site.host_title}</h2>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-stone-400">{site.host_text}</p>
            <div className="mt-7 grid gap-2 sm:grid-cols-3">
              {site.host_tools.map((tool) => (
                <span key={tool} className="rounded-lg border border-campo-border bg-campo-surface px-3 py-3 text-sm text-stone-300">
                  {tool}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#2D3326] bg-[#151A12] p-6">
            <h3 className="font-serif text-3xl text-forest-50">{site.trust_title}</h3>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-stone-400">
              {site.trust_items.map((item) => (
                <p key={item.label}>
                  <span className="text-gold">{item.label}</span> {item.text}
                </p>
              ))}
            </div>
            <Link href={site.host_cta_href || "/signup"} className="mt-7 inline-flex rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-campo-bg transition hover:bg-gold-light">
              {site.host_cta_label}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[#2D3326] bg-[#12170F] py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#D4BD8C]">Jornada</p>
            <h2 className="mt-3 font-serif text-4xl text-forest-50">{site.steps_title}</h2>
            <div className="mt-7 space-y-4">
              {site.steps.map((step, index) => (
                <article key={`${step.title}-${index}`} className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-[#2D3326] pt-4">
                  <span className="font-serif text-2xl text-gold">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-serif text-2xl text-forest-50">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-400">{step.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {site.perfis.map((perfil) => (
              <article key={perfil.nome} className="rounded-lg border border-[#2D3326] bg-[#171D15] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#A9C875]">{perfil.tag}</p>
                <h3 className="mt-2 font-serif text-2xl text-forest-50">{perfil.nome}</h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-400">{perfil.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-20">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#E0A077]">{site.testimonials_label}</p>
          <h2 className="mt-3 font-serif text-4xl text-forest-50">{site.testimonials_title}</h2>
          <div className="mt-7 grid gap-3">
            {site.testimonials.map((item) => (
              <figure key={`${item.name}-${item.role}`} className="rounded-lg border border-[#3A2D24] bg-[#18130F] p-5">
                <blockquote className="font-serif text-2xl leading-snug text-forest-50">“{item.quote}”</blockquote>
                <figcaption className="mt-4 text-sm text-stone-400">
                  <span className="text-gold">{item.name}</span> · {item.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#C9BE93]">{site.faq_label}</p>
          <h2 className="mt-3 font-serif text-4xl text-forest-50">{site.faq_title}</h2>
          <div className="mt-7 divide-y divide-[#2D3326] rounded-lg border border-[#2D3326] bg-[#151A12]">
            {site.faq_items.map((item) => (
              <details key={item.question} className="group p-5">
                <summary className="cursor-pointer list-none font-serif text-xl text-forest-50 marker:hidden">
                  <span className="inline-flex w-full items-center justify-between gap-4">
                    {item.question}
                    <span className="text-sm text-gold transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-stone-400">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#171D15] py-14">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 sm:px-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">Seravie Campo</p>
            <h2 className="mt-3 font-serif text-4xl text-forest-50">{site.cta_title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">{site.cta_text}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={site.cta_primary_href || "/signup"} className="rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-campo-bg transition hover:bg-gold-light">
              {site.cta_primary_label}
            </Link>
            <Link href={site.cta_secondary_href || "/experiencias"} className="rounded-lg border border-campo-border px-5 py-3 text-sm font-semibold text-forest-100 transition hover:border-gold/60 hover:text-gold">
              {site.cta_secondary_label}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#2D3326] bg-[#0E120D]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-sm text-stone-400 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <p className="font-serif text-2xl text-forest-50">{site.brand}</p>
            <p className="mt-3 leading-relaxed">{site.footer}</p>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-[0.22em] text-gold">Explorar</h3>
            <div className="mt-3 space-y-2">
              <a href="#destinos" className="block hover:text-gold">Destinos</a>
              <a href="#experiencias" className="block hover:text-gold">Experiências</a>
              <Link href="/experiencias" className="block hover:text-gold">Agenda no campo</Link>
            </div>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-[0.22em] text-gold">Conta</h3>
            <div className="mt-3 space-y-2">
              <Link href="/signup" className="block hover:text-gold">Criar conta</Link>
              <Link href="/login" className="block hover:text-gold">Entrar</Link>
              <a href="#anfitrioes" className="block hover:text-gold">Anfitriões</a>
            </div>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-[0.22em] text-gold">Institucional</h3>
            <div className="mt-3 space-y-2">
              <a href="#chat-seravie" className="block hover:text-gold">Fale conosco</a>
              {site.institutional_pages
                .filter((page) => page.slug)
                .slice(0, 3)
                .map((page) => (
                  <Link key={page.slug} href={`/${page.slug}`} className="block hover:text-gold">
                    {page.title}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </footer>
      <PublicSupportChatWidget />
    </main>
  );
}
