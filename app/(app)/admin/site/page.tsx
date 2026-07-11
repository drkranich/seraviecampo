import Link from "next/link";
import type { ReactNode } from "react";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { CmsObjectListEditor, CmsStringListEditor, type CmsListField } from "@/components/CmsListEditor";
import { getSiteCmsState } from "@/lib/site";
import { ImageUpload } from "@/components/ImageUpload";
import { discardSiteDraft, publishSite, updateSite } from "./actions";

const inputCls = "w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold";
const labelCls = "mb-1 block text-sm text-stone-300";

const ecosystemFields: CmsListField[] = [
  { key: "label", label: "Selo", placeholder: "Hospede-se" },
  { key: "title", label: "Título", placeholder: "Estadas com identidade local" },
  { key: "text", label: "Texto", kind: "textarea", rows: 3, placeholder: "Explique o valor deste bloco." },
];

const destinationFields: CmsListField[] = [
  { key: "name", label: "Destino", placeholder: "Lavras Novas" },
  { key: "slug", label: "Slug da página", placeholder: "lavras-novas" },
  { key: "region", label: "Resumo", placeholder: "Serra, gastronomia e casarios" },
  { key: "image", label: "Imagem", kind: "image", placeholder: "https://..." },
  { key: "href", label: "Link do card", kind: "url", placeholder: "/destinos/lavras-novas" },
  { key: "intro", label: "Introdução da página", kind: "textarea", rows: 2, placeholder: "Resumo curto do destino." },
  { key: "description", label: "Descrição da página", kind: "textarea", rows: 4, placeholder: "Texto principal da página do destino." },
  { key: "best_time", label: "Melhor época", placeholder: "Outono e inverno" },
  { key: "travel_time", label: "Duração sugerida", placeholder: "2 a 4 dias" },
  { key: "highlights", label: "Destaques", kind: "textarea", rows: 4, placeholder: "Um por linha: trilhas, pousadas, cafés..." },
  { key: "cta_label", label: "Texto do CTA", placeholder: "Ver experiências" },
  { key: "cta_href", label: "Link do CTA", kind: "url", placeholder: "/experiencias" },
];

const accentOptions = [
  { label: "Dourado", value: "border-[#C2A878] text-[#D4BD8C]" },
  { label: "Verde", value: "border-[#7CA049] text-[#A9C875]" },
  { label: "Terracota", value: "border-[#B66E4B] text-[#E0A077]" },
  { label: "Azul suave", value: "border-[#6D8EA0] text-[#A8C7D3]" },
  { label: "Oliva", value: "border-[#9A9A66] text-[#D3D19B]" },
];

const experienceTrackFields: CmsListField[] = [
  { key: "title", label: "Categoria", placeholder: "Gastronomia" },
  { key: "accent", label: "Cor", kind: "select", options: accentOptions },
  { key: "text", label: "Texto", kind: "textarea", rows: 3, placeholder: "Descreva o tipo de experiência." },
  { key: "href", label: "Link", kind: "url", placeholder: "/experiencias" },
];

const guideFields: CmsListField[] = [
  { key: "label", label: "Título do guia", placeholder: "Melhor época para viajar" },
  { key: "href", label: "Link", kind: "url", placeholder: "/signup" },
];

const featuredFields: CmsListField[] = [
  { key: "label", label: "Selo", placeholder: "Temporada" },
  { key: "title", label: "Título", placeholder: "Fim de semana no campo" },
  { key: "text", label: "Texto", kind: "textarea", rows: 3, placeholder: "Explique o destaque." },
  { key: "image", label: "Imagem", kind: "image", placeholder: "https://..." },
  { key: "href", label: "Link", kind: "url", placeholder: "/experiencias" },
];

const trustFields: CmsListField[] = [
  { key: "label", label: "Chamada", placeholder: "Pagamentos e cancelamentos:" },
  { key: "text", label: "Texto", kind: "textarea", rows: 2, placeholder: "Explique o compromisso de confiança." },
];

const testimonialFields: CmsListField[] = [
  { key: "quote", label: "Depoimento", kind: "textarea", rows: 3, placeholder: "A página mostra o destino inteiro..." },
  { key: "name", label: "Nome", placeholder: "Anfitriã rural" },
  { key: "role", label: "Contexto", placeholder: "Hospedagem e experiências" },
];

const faqFields: CmsListField[] = [
  { key: "question", label: "Pergunta", placeholder: "Quem pode anunciar?" },
  { key: "answer", label: "Resposta", kind: "textarea", rows: 3, placeholder: "Explique em linguagem simples." },
];

const institutionalPageFields: CmsListField[] = [
  { key: "slug", label: "Slug publico", placeholder: "sobre" },
  { key: "label", label: "Selo", placeholder: "Institucional" },
  { key: "title", label: "Titulo", placeholder: "Sobre a Seravie Campo" },
  { key: "summary", label: "Resumo", kind: "textarea", rows: 2, placeholder: "Resumo curto da pagina." },
  { key: "body", label: "Conteudo", kind: "textarea", rows: 8, placeholder: "Use uma linha em branco entre paragrafos." },
  { key: "image", label: "Imagem da pagina", kind: "image", placeholder: "https://..." },
  { key: "cta_label", label: "Texto do CTA", placeholder: "Criar conta" },
  { key: "cta_href", label: "Link do CTA", kind: "url", placeholder: "/signup" },
  { key: "seo_title", label: "Titulo SEO", placeholder: "Sobre a Seravie Campo" },
  { key: "seo_description", label: "Descricao SEO", kind: "textarea", rows: 2, placeholder: "Descricao para Google e redes." },
];

const stepFields: CmsListField[] = [
  { key: "title", label: "Título", placeholder: "Planeje" },
  { key: "desc", label: "Descrição", kind: "textarea", rows: 2, placeholder: "Explique esta etapa." },
];

const profileFields: CmsListField[] = [
  { key: "tag", label: "Selo", placeholder: "Viajante" },
  { key: "nome", label: "Nome", placeholder: "Para quem visita" },
  { key: "desc", label: "Descrição", kind: "textarea", rows: 2, placeholder: "Explique este perfil." },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-campo-border bg-campo-surface2/35 p-4">
      <h2 className="mb-4 font-serif text-2xl text-forest-100">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function TextField({ name, label, value }: { name: string; label: string; value: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input name={name} defaultValue={value} className={inputCls} />
    </div>
  );
}

function TextAreaField({ name, label, value, rows = 3 }: { name: string; label: string; value: string; rows?: number }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <textarea name={name} defaultValue={value} rows={rows} className={inputCls} />
    </div>
  );
}

function CmsStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-campo-border bg-campo-surface2/35 p-4">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-2 font-serif text-2xl text-forest-100">{value}</p>
    </div>
  );
}

export default async function SiteCmsPage({
  searchParams,
}: { searchParams: Promise<{ ok?: string; error?: string; draft?: string; published?: string; discarded?: string }> }) {
  const { profile } = await requireRole("super_admin");
  const sp = await searchParams;
  const supabase = await createClient();
  const cms = await getSiteCmsState(supabase);
  const site = cms.draft;

  return (
    <AppShell badge="Seravie Hub" nav={ADMIN_NAV} userName={profile?.full_name ?? "Administrador"} title="Site / CMS" subtitle="Edite a página pública, vitrines e avisos dos painéis.">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/" target="_blank" className="text-sm text-gold hover:underline">Ver página pública</Link>
        <Link href="/admin/site/preview" target="_blank" className="text-sm text-gold hover:underline">Pré-visualizar rascunho</Link>
        <Link href="/experiencias" target="_blank" className="text-sm text-gold hover:underline">Ver experiências</Link>
      </div>
      {sp.draft && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Rascunho salvo. Revise o preview antes de publicar.</div>}
      {sp.published && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Rascunho publicado no site.</div>}
      {sp.discarded && <div className="mb-4 rounded-lg border border-stone-700 bg-stone-900/40 px-3 py-2 text-sm text-stone-300">Rascunho descartado. O formulário voltou para a versão publicada.</div>}
      {sp.ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Página atualizada.</div>}
      {sp.error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{decodeURIComponent(sp.error)}</div>}

      <section className="mb-5 rounded-2xl border border-campo-border bg-campo-surface2/35 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-500">Status do CMS</p>
            <h2 className="mt-1 font-serif text-2xl text-forest-100">{cms.hasDraftChanges ? "Há alterações em rascunho" : "Rascunho igual ao publicado"}</h2>
            <p className="mt-1 text-sm text-stone-400">
              Publicado: {cms.publishedAt ? new Date(cms.publishedAt).toLocaleString("pt-BR") : "ainda sem data registrada"} ·
              Rascunho: {cms.draftUpdatedAt ? new Date(cms.draftUpdatedAt).toLocaleString("pt-BR") : "sem alterações recentes"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/site/preview" target="_blank" className="rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Ver preview</Link>
            <form action={discardSiteDraft}>
              <button className="rounded-lg border border-red-900/50 px-4 py-2 text-sm text-red-300 transition hover:border-red-500/70" disabled={!cms.hasDraftChanges}>Descartar rascunho</button>
            </form>
            <form action={publishSite}>
              <button className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Publicar rascunho</button>
            </form>
          </div>
        </div>
      </section>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <CmsStat label="Destinos" value={String(site.destinations.length)} />
        <CmsStat label="Experiências" value={String(site.experience_tracks.length)} />
        <CmsStat label="Vitrines" value={String(site.featured_items.length)} />
        <CmsStat label="Depoimentos" value={String(site.testimonials.length)} />
        <CmsStat label="FAQ" value={String(site.faq_items.length)} />
        <CmsStat label="Paginas" value={String(site.institutional_pages.length)} />
      </div>

      <form action={updateSite} className="glass max-w-6xl space-y-5 rounded-2xl border border-campo-border p-5 sm:p-6">
        <Section title="SEO e compartilhamento">
          <TextField name="seo_title" label="Título para Google e redes" value={site.seo_title} />
          <TextAreaField name="seo_description" label="Descrição para busca e compartilhamento" value={site.seo_description} rows={2} />
          <div className="rounded-xl border border-campo-border bg-campo-bg/35 p-4">
            <ImageUpload name="og_image_url" label="Imagem de compartilhamento" userId="" currentUrl={site.og_image_url || null} folder="site/seo" shape="wide" />
          </div>
        </Section>

        <Section title="Identidade e hero">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-campo-border bg-campo-bg/35 p-4">
              <ImageUpload name="favicon_url" label="Favicon" userId="" currentUrl={site.favicon_url || null} folder="favicon" shape="square" />
            </div>
            <div className="rounded-xl border border-campo-border bg-campo-bg/35 p-4">
              <ImageUpload name="hero_image_url" label="Imagem principal da home" userId="" currentUrl={site.hero_image_url || null} folder="site/hero" shape="wide" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="brand" label="Marca" value={site.brand} />
            <TextField name="hero_cta" label="Texto do botão principal" value={site.hero_cta} />
          </div>
          <TextField name="hero_kicker" label="Hero - linha pequena" value={site.hero_kicker} />
          <TextField name="hero_title" label="Hero - título" value={site.hero_title} />
          <TextAreaField name="hero_subtitle" label="Hero - subtítulo" value={site.hero_subtitle} />
          <CmsStringListEditor name="hero_teasers" label="Chamadas curtas abaixo da busca" items={site.hero_teasers} itemLabel="Chamada" placeholder="Hospedagens rurais, pousadas, cabanas e fazendas." addLabel="Adicionar chamada" />
        </Section>

        <Section title="Faixa de ecossistema">
          <CmsObjectListEditor name="ecosystem" label="Cards da faixa superior" items={site.ecosystem} fields={ecosystemFields} emptyItem={{ label: "", title: "", text: "" }} itemLabel="Card" addLabel="Adicionar card" titleKey="title" />
        </Section>

        <Section title="Destinos">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField name="destinations_label" label="Selo da seção" value={site.destinations_label} />
            <div className="sm:col-span-2">
              <TextField name="destinations_title" label="Título da seção" value={site.destinations_title} />
            </div>
          </div>
          <TextAreaField name="destinations_text" label="Texto de apoio" value={site.destinations_text} />
          <CmsObjectListEditor name="destinations" label="Cards e páginas de destinos" items={site.destinations} fields={destinationFields} emptyItem={{ name: "", slug: "", region: "", image: "", href: "", intro: "", description: "", best_time: "", travel_time: "", highlights: "", cta_label: "", cta_href: "/experiencias" }} itemLabel="Destino" addLabel="Adicionar destino" titleKey="name" />
        </Section>

        <Section title="Hospedagens e categorias">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField name="stay_label" label="Selo da seção" value={site.stay_label} />
            <div className="sm:col-span-2">
              <TextField name="stay_title" label="Título da seção" value={site.stay_title} />
            </div>
          </div>
          <TextAreaField name="stay_text" label="Texto de apoio" value={site.stay_text} />
          <CmsStringListEditor name="stay_types" label="Tipos de hospedagem" items={site.stay_types} itemLabel="Tipo" placeholder="Chalés" addLabel="Adicionar tipo" />
        </Section>

        <Section title="Experiências públicas">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField name="home_experiences_label" label="Selo da home" value={site.home_experiences_label} />
            <div className="sm:col-span-2">
              <TextField name="home_experiences_title" label="Título da vitrine na home" value={site.home_experiences_title} />
            </div>
          </div>
          <TextAreaField name="home_experiences_text" label="Texto da vitrine na home" value={site.home_experiences_text} />
          <CmsObjectListEditor name="experience_tracks" label="Categorias/linhas de experiência na home" items={site.experience_tracks} fields={experienceTrackFields} emptyItem={{ title: "", text: "", accent: accentOptions[0].value, href: "/experiencias" }} itemLabel="Categoria" addLabel="Adicionar categoria" titleKey="title" />
          <label className="flex items-center gap-2 text-sm font-medium text-forest-100">
            <input type="checkbox" name="experiencias_enabled" defaultChecked={site.experiencias_enabled} className="accent-gold" />
            Mostrar chamada para experiências na página pública
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="experiencias_title" label="Título da página /experiencias" value={site.experiencias_title} />
            <TextAreaField name="experiencias_subtitle" label="Subtítulo da página /experiencias" value={site.experiencias_subtitle} rows={2} />
          </div>
        </Section>

        <Section title="Produtos, guias e recorrência">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField name="products_label" label="Selo de produtos" value={site.products_label} />
            <div className="sm:col-span-2">
              <TextField name="products_title" label="Título de produtos" value={site.products_title} />
            </div>
          </div>
          <TextAreaField name="products_text" label="Texto de produtos" value={site.products_text} />
          <CmsStringListEditor name="product_tags" label="Tags de produtos/rotas" items={site.product_tags} itemLabel="Tag" placeholder="Cestas frescas" addLabel="Adicionar tag" />
          <TextField name="guides_label" label="Selo dos guias" value={site.guides_label} />
          <CmsObjectListEditor name="guide_links" label="Links de guias públicos" items={site.guide_links} fields={guideFields} emptyItem={{ label: "", href: "/signup" }} itemLabel="Guia" addLabel="Adicionar guia" titleKey="label" />
        </Section>

        <Section title="Vitrines editoriais">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField name="featured_label" label="Selo da seção" value={site.featured_label} />
            <div className="sm:col-span-2">
              <TextField name="featured_title" label="Título da seção" value={site.featured_title} />
            </div>
          </div>
          <TextAreaField name="featured_text" label="Texto de apoio" value={site.featured_text} />
          <CmsObjectListEditor name="featured_items" label="Cards de destaque" items={site.featured_items} fields={featuredFields} emptyItem={{ label: "", title: "", text: "", image: "", href: "/experiencias" }} itemLabel="Destaque" addLabel="Adicionar destaque" titleKey="title" />
        </Section>

        <Section title="Área do anfitrião">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField name="host_label" label="Selo da seção" value={site.host_label} />
            <div className="sm:col-span-2">
              <TextField name="host_title" label="Título da seção" value={site.host_title} />
            </div>
          </div>
          <TextAreaField name="host_text" label="Texto da seção" value={site.host_text} />
          <CmsStringListEditor name="host_tools" label="Ferramentas/benefícios do anfitrião" items={site.host_tools} itemLabel="Benefício" placeholder="Como anunciar" addLabel="Adicionar benefício" />
          <TextField name="trust_title" label="Título do bloco de confiança" value={site.trust_title} />
          <CmsObjectListEditor name="trust_items" label="Itens do bloco de confiança" items={site.trust_items} fields={trustFields} emptyItem={{ label: "", text: "" }} itemLabel="Item" addLabel="Adicionar item" titleKey="label" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="host_cta_label" label="CTA do anfitrião" value={site.host_cta_label} />
            <TextField name="host_cta_href" label="Link do CTA" value={site.host_cta_href} />
          </div>
        </Section>

        <Section title="Depoimentos e perguntas frequentes">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField name="testimonials_label" label="Selo de depoimentos" value={site.testimonials_label} />
            <div className="sm:col-span-2">
              <TextField name="testimonials_title" label="Título dos depoimentos" value={site.testimonials_title} />
            </div>
          </div>
          <CmsObjectListEditor name="testimonials" label="Depoimentos" items={site.testimonials} fields={testimonialFields} emptyItem={{ quote: "", name: "", role: "" }} itemLabel="Depoimento" addLabel="Adicionar depoimento" titleKey="name" />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField name="faq_label" label="Selo do FAQ" value={site.faq_label} />
            <div className="sm:col-span-2">
              <TextField name="faq_title" label="Título do FAQ" value={site.faq_title} />
            </div>
          </div>
          <CmsObjectListEditor name="faq_items" label="Perguntas e respostas" items={site.faq_items} fields={faqFields} emptyItem={{ question: "", answer: "" }} itemLabel="Pergunta" addLabel="Adicionar pergunta" titleKey="question" />
        </Section>

        <Section title="Paginas institucionais">
          <CmsObjectListEditor
            name="institutional_pages"
            label="Paginas publicas"
            items={site.institutional_pages}
            fields={institutionalPageFields}
            emptyItem={{ slug: "", label: "", title: "", summary: "", body: "", image: "", cta_label: "", cta_href: "/signup", seo_title: "", seo_description: "" }}
            itemLabel="Pagina"
            addLabel="Adicionar pagina"
            titleKey="title"
          />
        </Section>

        <Section title="Avisos dos painéis">
          <div className="grid gap-4 lg:grid-cols-3">
            <TextField name="aviso_cliente" label="Aviso - cliente" value={site.avisos.cliente} />
            <TextField name="aviso_produtor" label="Aviso - produtor" value={site.avisos.produtor} />
            <TextField name="aviso_entregador" label="Aviso - entregador" value={site.avisos.entregador} />
          </div>
        </Section>

        <Section title="Jornada e chamada final">
          <TextField name="steps_title" label="Título dos passos" value={site.steps_title} />
          <CmsObjectListEditor name="steps" label="Passos" items={site.steps} fields={stepFields} emptyItem={{ title: "", desc: "" }} itemLabel="Passo" addLabel="Adicionar passo" titleKey="title" />
          <CmsObjectListEditor name="perfis" label="Cartões de perfil" items={site.perfis} fields={profileFields} emptyItem={{ tag: "", nome: "", desc: "" }} itemLabel="Perfil" addLabel="Adicionar perfil" titleKey="nome" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="cta_title" label="CTA - título" value={site.cta_title} />
            <TextField name="cta_text" label="CTA - texto" value={site.cta_text} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="cta_primary_label" label="Botão principal" value={site.cta_primary_label} />
            <TextField name="cta_primary_href" label="Link do botão principal" value={site.cta_primary_href} />
            <TextField name="cta_secondary_label" label="Botão secundário" value={site.cta_secondary_label} />
            <TextField name="cta_secondary_href" label="Link do botão secundário" value={site.cta_secondary_href} />
          </div>
        </Section>

        <Section title="Rodapé">
          <TextAreaField name="footer" label="Texto do rodapé" value={site.footer} rows={3} />
        </Section>

        <div className="sticky bottom-4 z-10 flex justify-end border-t border-campo-border bg-campo-bg/80 px-2 py-4 backdrop-blur">
          <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Salvar rascunho</button>
        </div>
      </form>
    </AppShell>
  );
}
