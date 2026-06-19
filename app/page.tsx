export default function Home() {
  const perfis = [
    {
      nome: "Seravie OS",
      tag: "Super Admin",
      desc: "O cérebro do ecossistema: dashboard executivo, mapa nacional, aprovações e inteligência estratégica.",
    },
    {
      nome: "Produtor Rural",
      tag: "Oferta",
      desc: "Minha Produção, calendário de safra, produtos com história, pedidos e IA Rural.",
    },
    {
      nome: "Cliente Final",
      tag: "Clube Gourmet",
      desc: "Home cinematográfica, descobertas por proximidade, perfil do produtor e feed social.",
    },
    {
      nome: "Entregador",
      tag: "Logística",
      desc: "Rotas, ganhos, entregas, GPS e comprovante por foto.",
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <header className="mb-16">
        <p className="font-serif text-sm uppercase tracking-[0.3em] text-gold">
          Agro Gourmet
        </p>
        <h1 className="mt-3 font-serif text-5xl font-semibold text-forest-100">
          Seravie Campo
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-400">
          Sistema Operacional da Economia Local. Conectando campo e cidade com
          produtos extraordinários.
        </p>
      </header>

      <section className="grid gap-5 sm:grid-cols-2">
        {perfis.map((p) => (
          <article
            key={p.nome}
            className="rounded-2xl border border-campo-border bg-campo-surface p-6 transition hover:border-gold/50"
          >
            <span className="inline-block rounded-full border border-gold/40 px-3 py-1 text-xs uppercase tracking-wider text-gold">
              {p.tag}
            </span>
            <h2 className="mt-4 font-serif text-2xl text-forest-100">{p.nome}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">{p.desc}</p>
          </article>
        ))}
      </section>

      <footer className="mt-20 border-t border-campo-border pt-6 text-sm text-stone-500">
        🌿 Fundação inicial pronta. Próximo passo: construir os 4 perfis.
      </footer>
    </main>
  );
}
