import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSite } from "@/lib/site";

const heroImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=85";

const destinationImages = [
  {
    name: "Lavras Novas",
    region: "Serra, gastronomia e casarios",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Ouro Preto",
    region: "História, igrejas e cultura viva",
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Capitólio",
    region: "Lagos, cachoeiras e passeios",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Monte Verde",
    region: "Chalés, lareira e montanha",
    image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=80",
  },
];

const stayTypes = [
  "Chalés",
  "Fazendas",
  "Cabanas",
  "Glamping",
  "Pousadas",
  "Vinícolas",
  "Sítios",
  "Casas históricas",
  "Refúgios",
  "Tiny houses",
  "Ranchos",
  "Casas na montanha",
];

const experienceTracks = [
  {
    title: "Gastronomia",
    text: "Café especial, queijo artesanal, vinho, cerveja local, almoço na fazenda e fogão a lenha.",
    accent: "border-[#C2A878] text-[#D4BD8C]",
  },
  {
    title: "Natureza",
    text: "Trilhas, cachoeiras, cavalgadas, observação de aves, fotografia e camping guiado.",
    accent: "border-[#7CA049] text-[#A9C875]",
  },
  {
    title: "Cultura",
    text: "Tours históricos, festas tradicionais, oficinas, artesanato e vivências de comunidade.",
    accent: "border-[#B66E4B] text-[#E0A077]",
  },
  {
    title: "Bem-estar",
    text: "Yoga, meditação, banho de floresta, massagem, spa rural e terapias naturais.",
    accent: "border-[#6D8EA0] text-[#A8C7D3]",
  },
  {
    title: "Rural",
    text: "Ordenha, colheita, apicultura, horta orgânica, pão artesanal e dias de fazendeiro.",
    accent: "border-[#9A9A66] text-[#D3D19B]",
  },
];

const ecosystem = [
  {
    label: "Hospede-se",
    title: "Estadas com identidade local",
    text: "Chalés, pousadas, fazendas, cabanas e sítios entram no mesmo mapa de experiências e produtos regionais.",
  },
  {
    label: "Viva",
    title: "Roteiros que acontecem no campo",
    text: "Cada destino pode reunir gastronomia, cultura, natureza, bem-estar e atividades rurais reserváveis.",
  },
  {
    label: "Compre",
    title: "Produtos de quem recebe você",
    text: "Cestas frescas, café, queijo, doces, artesanato e assinaturas regionais conectam visita e recorrência.",
  },
  {
    label: "Planeje",
    title: "Guias, eventos e serviços extras",
    text: "Clima, calendário, restaurantes, atrativos, transfer, chef, flores, fotos e guias locais em um só lugar.",
  },
];

const guides = [
  "Melhor época para viajar",
  "Como chegar e circular",
  "Trilhas, cachoeiras e mirantes",
  "Restaurantes e comida regional",
  "Viagem com crianças e pets",
  "Segurança, cancelamento e reembolso",
];

const hostTools = [
  "Como anunciar",
  "Quanto ganhar",
  "Comissão clara",
  "Central do anfitrião",
  "Seguro e regras",
  "Ferramentas de gestão",
];

export default async function Home() {
  const supabase = await createClient();
  const site = await getSite(supabase);

  return (
    <main className="min-h-screen overflow-hidden bg-[#11150F] text-forest-100">
      <header className="relative min-h-[86vh] bg-[#15190f]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt="Fazenda ao entardecer" className="h-full w-full object-cover" />
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
            <Link href="/login" className="transition hover:text-gold">Entrar</Link>
          </div>
          <Link href="/signup" className="relative z-10 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-campo-bg transition hover:bg-gold-light">
            Criar conta
          </Link>
        </nav>

        <section className="relative z-10 mx-auto flex max-w-7xl flex-col px-5 pb-10 pt-12 sm:px-6 lg:pt-20">
          <div className="max-w-3xl">
            <p className="font-serif text-sm uppercase tracking-[0.3em] text-[#D9C68D]">{site.hero_kicker}</p>
            <h1 className="mt-4 font-serif text-5xl font-semibold leading-[0.95] text-forest-50 sm:text-7xl">
              Seravie Campo
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-forest-50/80 sm:text-xl">
              Um portal de turismo rural, cultura, gastronomia e economia regional. Encontre onde ficar, o que viver e de quem comprar em uma mesma rede local.
            </p>
          </div>

          <form action="/experiencias" className="mt-10 grid max-w-6xl gap-2 rounded-lg border border-white/20 bg-[#10140E]/80 p-2 shadow-2xl shadow-black/30 backdrop-blur md:grid-cols-[1.3fr_1fr_1fr_.8fr_auto]">
            <label className="flex min-w-0 flex-col rounded-md bg-white/[0.06] px-4 py-3">
              <span className="text-xs uppercase tracking-[0.18em] text-forest-100/60">Destino</span>
              <input name="destino" placeholder="Lavras Novas, Ouro Preto..." className="mt-1 min-w-0 bg-transparent text-sm text-forest-50 outline-none placeholder:text-forest-100/40" />
            </label>
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
            <p className="border-l border-[#C2A878] pl-3">Hospedagens rurais, pousadas, cabanas e fazendas.</p>
            <p className="border-l border-[#7CA049] pl-3">Experiências com produtores, guias e comunidades.</p>
            <p className="border-l border-[#6D8EA0] pl-3">Produtos frescos, rotas sazonais e eventos locais.</p>
          </div>
        </section>
      </header>

      <section className="border-y border-[#2D3326] bg-[#151A12]">
        <div className="mx-auto grid max-w-7xl gap-0 px-5 py-5 sm:px-6 md:grid-cols-4">
          {ecosystem.map((item) => (
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
            <p className="text-xs uppercase tracking-[0.24em] text-[#A9C875]">Mapa de destinos</p>
            <h2 className="mt-3 font-serif text-4xl text-forest-50">Cidades que viram roteiro, não só resultado de busca.</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-stone-400">
            Cada destino pode reunir onde ficar, o que fazer, restaurantes, atrativos, clima, eventos, mapa e história local.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {destinationImages.map((destination) => (
            <article key={destination.name} className="group overflow-hidden rounded-lg border border-campo-border bg-campo-surface">
              <div className="aspect-[4/5] overflow-hidden bg-campo-surface2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={destination.image} alt={destination.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <div className="p-4">
                <h3 className="font-serif text-2xl text-forest-50">{destination.name}</h3>
                <p className="mt-1 text-sm text-stone-400">{destination.region}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#0F1514] py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#A8C7D3]">Hospedagens e categorias</p>
            <h2 className="mt-3 font-serif text-4xl text-forest-50">Do chalé romântico ao rancho produtivo.</h2>
            <p className="mt-5 text-sm leading-relaxed text-stone-400">
              A home agora prepara a Seravie Campo para crescer como portal de estadas, experiências, atrativos e economia local, sem abandonar o produtor rural.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {stayTypes.map((type) => (
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
            <p className="text-xs uppercase tracking-[0.24em] text-[#E0A077]">Experiências populares</p>
            <h2 className="mt-3 font-serif text-4xl text-forest-50">O campo como agenda, não como pano de fundo.</h2>
            <p className="mt-5 text-sm leading-relaxed text-stone-400">
              Gastronomia, natureza, cultura, bem-estar e ruralidade entram como produtos reserváveis, com anfitriões e produtores no centro da narrativa.
            </p>
            {site.experiencias_enabled && (
              <Link href="/experiencias" className="mt-6 inline-flex rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-campo-bg transition hover:bg-gold-light">
                Explorar experiências
              </Link>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {experienceTracks.map((track) => (
              <article key={track.title} className={`rounded-lg border bg-[#171D15] p-5 ${track.accent}`}>
                <h3 className="font-serif text-2xl">{track.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-400">{track.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#2D3326] bg-[#17140F] py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">Produtos e assinaturas regionais</p>
            <h2 className="mt-3 font-serif text-4xl text-forest-50">A viagem continua na mesa de casa.</h2>
            <p className="mt-5 text-sm leading-relaxed text-stone-400">
              Cestas de alimentos frescos, produtos artesanais, cafés, queijos, doces, artesanato e assinaturas regionais conectam turismo, recorrência e renda local.
            </p>
            <div className="mt-7 flex flex-wrap gap-2 text-sm">
              {["Cestas frescas", "Rotas do café", "Rotas do queijo", "Colhe e pague", "Artesãos locais", "Festas tradicionais"].map((item) => (
                <span key={item} className="rounded-lg border border-[#3C3524] bg-[#201A10] px-3 py-2 text-[#D4BD8C]">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#3C3524] bg-[#211B12] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[#D4BD8C]">Portal público completo</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {guides.map((guide) => (
                <Link key={guide} href="/signup" className="rounded-lg border border-[#3C3524] px-4 py-3 text-sm text-stone-300 transition hover:border-gold/60 hover:text-gold">
                  {guide}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="anfitrioes" className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#A9C875]">Área do anfitrião</p>
            <h2 className="mt-3 font-serif text-4xl text-forest-50">Produtores, pousadas, guias e restaurantes entram pela mesma porta.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-stone-400">
              A página pública agora apresenta a Seravie Campo como uma infraestrutura regional: o visitante reserva, compra e planeja; o anfitrião publica, recebe e acompanha.
            </p>
            <div className="mt-7 grid gap-2 sm:grid-cols-3">
              {hostTools.map((tool) => (
                <span key={tool} className="rounded-lg border border-campo-border bg-campo-surface px-3 py-3 text-sm text-stone-300">
                  {tool}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#2D3326] bg-[#151A12] p-6">
            <h3 className="font-serif text-3xl text-forest-50">Confiança antes da reserva</h3>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-stone-400">
              <p><span className="text-gold">Pagamentos e cancelamentos:</span> políticas claras para reserva, reembolso e assinatura.</p>
              <p><span className="text-gold">Avaliações e segurança:</span> reputação, suporte, denúncias e comprovantes em um fluxo único.</p>
              <p><span className="text-gold">Comunidade local:</span> turismo, cultura e produção regional aparecem juntos, sem virar catálogo anônimo.</p>
            </div>
            <Link href="/signup" className="mt-7 inline-flex rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-campo-bg transition hover:bg-gold-light">
              Anunciar na Seravie
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
              <span className="block">Termos de uso</span>
              <span className="block">Privacidade e LGPD</span>
              <span className="block">Ajuda e suporte</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
