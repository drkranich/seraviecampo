import Link from "next/link";
import { PublicSupportChatWidget } from "@/components/PublicSupportChatWidget";
import type { InstitutionalPage, SiteContent } from "@/lib/site";

function splitParagraphs(value: string) {
  return String(value || "")
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function PublicInstitutionalPage({ site, page }: { site: SiteContent; page: InstitutionalPage }) {
  const content = splitParagraphs(page.body || page.summary);
  const image = page.image || site.hero_image_url;

  return (
    <main className="min-h-screen bg-[#10140E] text-forest-100">
      <header className="relative min-h-[64vh] overflow-hidden bg-[#15190f]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={page.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,17,11,0.94),rgba(13,17,11,0.62),rgba(13,17,11,0.22)),linear-gradient(180deg,rgba(13,17,11,0.18),rgba(13,17,11,0.9))]" />
        </div>

        <nav className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <Link href="/" className="font-serif text-xl font-semibold text-forest-50">
            {site.brand}
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-sm text-forest-100/80">
            <Link href="/destinos" className="transition hover:text-gold">Destinos</Link>
            <Link href="/experiencias" className="transition hover:text-gold">Experiências</Link>
            <Link href="/login" className="transition hover:text-gold">Entrar</Link>
          </div>
        </nav>

        <section className="relative z-10 mx-auto max-w-7xl px-5 pb-14 pt-12 sm:px-6 lg:pt-24">
          <p className="text-xs uppercase tracking-[0.26em] text-gold">{page.label || "Seravie Campo"}</p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl font-semibold leading-none text-forest-50 sm:text-7xl">
            {page.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-forest-50/80 sm:text-xl">
            {page.summary}
          </p>
        </section>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(18rem,0.34fr)] lg:py-20">
        <article className="space-y-6 text-lg leading-relaxed text-stone-300">
          {content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>

        <aside className="h-fit rounded-lg border border-[#2D3326] bg-[#151A12] p-6 shadow-xl shadow-black/10">
          <p className="text-xs uppercase tracking-[0.24em] text-[#C9BE93]">Seravie Campo</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-forest-50">Continue a jornada</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">{site.cta_text}</p>
          <Link href={page.cta_href || site.cta_primary_href || "/signup"} className="mt-6 inline-flex rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-campo-bg transition hover:bg-gold-light">
            {page.cta_label || site.cta_primary_label || "Criar conta"}
          </Link>
        </aside>
      </section>
      <PublicSupportChatWidget />
    </main>
  );
}
