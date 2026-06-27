import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSite } from "@/lib/site";

export default async function Home() {
  const supabase = await createClient();
  const site = await getSite(supabase);

  return (
    <main className="min-h-screen">
      {/* Topo */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-serif text-xl text-forest-100">{site.brand}</span>
        <div className="flex items-center gap-2">
          {site.experiencias_enabled && <Link href="/experiencias" className="rounded-lg px-4 py-2 text-sm text-stone-200 transition hover:text-gold">Experiências</Link>}
          <Link href="/login" className="rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Entrar</Link>
          <Link href="/signup" className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Criar conta</Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-6xl px-6 pb-12 pt-10 text-center">
        <p className="font-serif text-sm uppercase tracking-[0.3em] text-gold">{site.hero_kicker}</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold text-forest-100 sm:text-6xl">{site.hero_title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-stone-400">{site.hero_subtitle}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup" className="rounded-lg bg-gold px-7 py-3 font-medium text-campo-bg transition hover:bg-gold-light">{site.hero_cta}</Link>
          <Link href="/login" className="rounded-lg border border-campo-border px-7 py-3 font-medium text-stone-200 transition hover:border-gold/50">Entrar</Link>
        </div>
      </header>

      {/* Perfis */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {site.perfis.map((p) => (
            <article key={p.nome} className="glass rounded-2xl border border-campo-border p-6 transition hover:border-gold/50">
              <span className="inline-block rounded-full border border-gold/40 px-3 py-1 text-xs uppercase tracking-wider text-gold">{p.tag}</span>
              <h2 className="mt-4 font-serif text-xl text-forest-100">{p.nome}</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">{p.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-6 text-center font-serif text-3xl text-forest-100">{site.steps_title}</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {site.steps.map((s) => (
            <div key={s.title} className="rounded-2xl border border-campo-border bg-campo-surface2/40 p-6">
              <h3 className="font-serif text-lg text-gold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Experiências */}
      {site.experiencias_enabled && (
        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="glass overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-forest-900/40 to-campo-surface2/20 p-10 text-center">
            <p className="font-serif text-sm uppercase tracking-[0.3em] text-gold">Novidade</p>
            <h2 className="mt-3 font-serif text-3xl text-forest-100">{site.experiencias_title}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-stone-400">{site.experiencias_subtitle}</p>
            <Link href="/experiencias" className="mt-6 inline-block rounded-lg bg-gold px-8 py-3 font-medium text-campo-bg transition hover:bg-gold-light">Explorar experiências</Link>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto my-10 max-w-4xl px-6">
        <div className="glass rounded-3xl border border-gold/30 bg-gold/5 p-10 text-center">
          <h2 className="font-serif text-3xl text-forest-100">{site.cta_title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-400">{site.cta_text}</p>
          <Link href="/signup" className="mt-6 inline-block rounded-lg bg-gold px-8 py-3 font-medium text-campo-bg transition hover:bg-gold-light">{site.hero_cta}</Link>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs leading-relaxed text-stone-600">
        {site.footer}
      </footer>
    </main>
  );
}
