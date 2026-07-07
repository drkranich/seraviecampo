import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { destinationHref, getSite } from "@/lib/site";

export default async function DestinosPage() {
  const supabase = await createClient();
  const site = await getSite(supabase);

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
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-16 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
        {site.destinations.map((destination) => (
          <Link key={destination.name} href={destinationHref(destination)} className="group overflow-hidden rounded-lg border border-campo-border bg-campo-surface">
            <div className="aspect-[4/5] overflow-hidden bg-campo-surface2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={destination.image} alt={destination.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gold">{destination.region}</p>
              <h2 className="mt-2 font-serif text-3xl text-forest-50">{destination.name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-400">{destination.intro || destination.description || site.destinations_text}</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
