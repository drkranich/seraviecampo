import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { GlassSelect } from "@/components/GlassSelect";
import { ImageUpload } from "@/components/ImageUpload";
import {
  CAMPAIGN_STATUS_LABEL,
  DELIVERY_STATUS_LABEL,
  EMAIL_AUDIENCE_OPTIONS,
  EMAIL_CATEGORY_OPTIONS,
  EMAIL_STATUS_OPTIONS,
  audienceLabels,
  blocksToEditableText,
  categoryLabel,
  cleanTemplateBlocks,
  renderEmailHtml,
  type EmailMarketingCampaign,
  type EmailMarketingDelivery,
  type EmailMarketingSegment,
  type EmailMarketingTemplate,
} from "@/lib/email-marketing";
import { marketingEmailProviderStatus } from "@/lib/email-marketing-send";
import {
  archiveTemplate,
  cancelQueuedCampaign,
  createCampaignDraft,
  duplicateTemplate,
  queueCampaign,
  retryFailedCampaign,
  saveTemplate,
  scheduleCampaign,
  sendQueuedCampaign,
  sendTemplateTest,
} from "./actions";

const inputCls = "w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-gold";
const labelCls = "mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-stone-500";

type ProfileRow = { id: string; role: string; full_name: string | null; display_name: string | null; farm_name: string | null; city: string | null; state: string | null };
type AdminEmailRow = { id: string; email: string };
type EmailMarketingEvent = {
  id: string;
  campaign_id: string | null;
  delivery_id: string | null;
  subscriber_id: string | null;
  recipient_user_id: string | null;
  recipient_email: string;
  event_type: string;
  provider_message_id: string | null;
  provider_payload: Record<string, unknown> | null;
  created_at: string;
};

const emptyTemplate: EmailMarketingTemplate = {
  id: "",
  slug: "",
  name: "",
  description: "",
  category: "newsletter",
  audience: ["cliente"],
  status: "draft",
  subject: "",
  preheader: "",
  hero_title: "",
  hero_body: "",
  cta_label: "Ver na Seravie Campo",
  cta_url: "https://seraviecampo.com",
  image_url: null,
  palette: {},
  blocks: [
    { title: "Origem e curadoria", text: "Apresente a história, o destino ou a oferta com linguagem direta e acolhedora." },
    { title: "Próximo passo", text: "Explique o que a pessoa pode fazer agora dentro da Seravie Campo." },
  ],
  footer_note: "Você recebeu este email por interagir com a Seravie Campo.",
  html_content: "",
  plain_text: "",
  is_system: false,
  created_at: "",
  updated_at: "",
};

export default async function EmailMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{
    template?: string;
    error?: string;
    saved?: string;
    created?: string;
    archived?: string;
    test?: string;
    campaign?: string;
    campaign_created?: string;
    queued?: string;
    scheduled?: string;
    cancelled?: string;
    processed?: string;
    sent?: string;
    failed?: string;
    retried?: string;
  }>;
}) {
  const { profile, user } = await requireRole("super_admin");
  const sp = await searchParams;
  const supabase = await createClient();

  const [
    templatesResult,
    campaignsResult,
    segmentsResult,
    subscribersResult,
    suppressionsResult,
    deliveriesResult,
    eventsResult,
    selectedDeliveriesResult,
    selectedEventsResult,
    queuedDeliveriesResult,
    profilesResult,
    adminEmailsResult,
    leadsResult,
  ] = await Promise.all([
    supabase.from("email_marketing_templates").select("*").order("updated_at", { ascending: false }),
    supabase.from("email_marketing_campaigns").select("*").order("updated_at", { ascending: false }).limit(8),
    supabase.from("email_marketing_segments").select("*").eq("active", true).order("name", { ascending: true }),
    supabase.from("email_marketing_subscribers").select("id", { count: "exact", head: true }),
    supabase.from("email_marketing_suppressions").select("id", { count: "exact", head: true }),
    supabase.from("email_marketing_deliveries").select("*").order("created_at", { ascending: false }).limit(12),
    supabase.from("email_marketing_events").select("*").order("created_at", { ascending: false }).limit(24),
    sp.campaign
      ? supabase.from("email_marketing_deliveries").select("*").eq("campaign_id", sp.campaign).order("created_at", { ascending: false }).limit(300)
      : Promise.resolve({ data: [], error: null }),
    sp.campaign
      ? supabase.from("email_marketing_events").select("*").eq("campaign_id", sp.campaign).order("created_at", { ascending: false }).limit(80)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("email_marketing_deliveries").select("id", { count: "exact", head: true }).eq("status", "queued"),
    supabase.from("profiles").select("id, role, full_name, display_name, farm_name, city, state"),
    supabase.rpc("admin_emails"),
    supabase.from("public_support_threads").select("id", { count: "exact", head: true }).not("visitor_email", "is", null),
  ]);

  const templates = (templatesResult.data ?? []) as EmailMarketingTemplate[];
  const campaigns = (campaignsResult.data ?? []) as EmailMarketingCampaign[];
  const segments = (segmentsResult.data ?? []) as EmailMarketingSegment[];
  const deliveries = (deliveriesResult.data ?? []) as EmailMarketingDelivery[];
  const events = (eventsResult.data ?? []) as EmailMarketingEvent[];
  const selectedDeliveries = (selectedDeliveriesResult.data ?? []) as EmailMarketingDelivery[];
  const selectedEvents = (selectedEventsResult.data ?? []) as EmailMarketingEvent[];
  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const emails = (adminEmailsResult.data ?? []) as AdminEmailRow[];
  const hasSchemaError = Boolean(
    templatesResult.error ||
      campaignsResult.error ||
      segmentsResult.error ||
      deliveriesResult.error ||
      eventsResult.error ||
      selectedDeliveriesResult.error ||
      selectedEventsResult.error
  );

  const selected =
    sp.template === "new"
      ? null
      : templates.find((item) => item.id === sp.template || item.slug === sp.template) ?? templates[0] ?? null;
  const template = selected ?? emptyTemplate;
  const activeTemplateId = selected?.id ?? "new";
  const publishedTemplates = templates.filter((item) => item.status === "published");
  const draftCampaigns = campaigns.filter((item) => item.status === "draft");
  const providerStatus = marketingEmailProviderStatus();
  const providerReady = providerStatus.ready;
  const selectedCampaign = (sp.campaign ? campaigns.find((item) => item.id === sp.campaign) : campaigns[0]) ?? null;
  const campaignDeliveries = sp.campaign ? selectedDeliveries : selectedCampaign ? deliveries.filter((item) => item.campaign_id === selectedCampaign.id) : [];
  const campaignEvents = sp.campaign ? selectedEvents : selectedCampaign ? events.filter((item) => item.campaign_id === selectedCampaign.id) : [];
  const emailById = new Map(emails.map((item) => [item.id, item.email]));
  const mailableProfiles = profiles.filter((item) => emailById.has(item.id));
  const roleCounts = new Map<string, number>();
  for (const row of mailableProfiles) roleCounts.set(row.role, (roleCounts.get(row.role) ?? 0) + 1);
  const leadsCount = leadsResult.count ?? 0;

  return (
    <AppShell
      badge="Seravie Hub"
      nav={ADMIN_NAV}
      userName={profile?.full_name ?? "Administrador"}
      title="Email marketing"
      subtitle="Templates, segmentos e campanhas da Seravie Campo, restritos ao super admin."
    >
      {hasSchemaError && (
        <div className="mb-5 rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          A base de email marketing ainda não respondeu. Aplique a migration mais recente do Supabase antes de usar este módulo.
        </div>
      )}
      {sp.error && <Alert tone="error">{decodeURIComponent(sp.error)}</Alert>}
      {sp.saved && <Alert>Template salvo.</Alert>}
      {sp.created && <Alert>Novo template criado.</Alert>}
      {sp.archived && <Alert>Template arquivado.</Alert>}
      {sp.test && <Alert>Email de teste enviado para o seu usuário.</Alert>}
      {sp.campaign_created && <Alert>Campanha criada como rascunho.</Alert>}
      {sp.queued && <Alert>{Number(sp.queued) > 0 ? `${sp.queued} destinatários entraram na fila da campanha.` : "Fila revisada, sem novos destinatários."}</Alert>}
      {sp.scheduled && <Alert>Campanha agendada. O cron só dispara quando chegar o horário escolhido.</Alert>}
      {sp.retried && <Alert>{`${sp.retried} entregas com falha voltaram para a fila.`}</Alert>}
      {sp.cancelled && <Alert>Fila da campanha cancelada.</Alert>}
      {sp.processed && <Alert>{`${sp.processed} entregas processadas: ${sp.sent ?? 0} enviadas e ${sp.failed ?? 0} falhas.`}</Alert>}

      <section className="mb-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="glass rounded-2xl border border-campo-border p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-gold">Super admin</p>
          <h2 className="mt-2 max-w-2xl font-serif text-3xl text-forest-100">Campanhas com a voz e o visual da Seravie Campo.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-400">
            Crie modelos prontos para clientes, produtores, anfitriões, entregadores e leads do site público. Os emails usam uma versão segura do glassmorphism da marca, com descadastro e texto puro preparados para entrega.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/admin/email-marketing?template=new" className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">
              Novo template
            </Link>
            <a href="#editor" className="rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/60">
              Editar selecionado
            </a>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Stat label="Templates" value={String(templates.length)} />
          <Stat label="Prontos para usar" value={String(publishedTemplates.length)} accent />
          <Stat label="Campanhas em rascunho" value={String(draftCampaigns.length)} />
          <Stat label="Entregas na fila" value={String(queuedDeliveriesResult.count ?? 0)} accent />
          <Stat label="Descadastros/bloqueios" value={String(suppressionsResult.count ?? 0)} />
          <Stat label="Provedor de envio" value={providerStatus.label} accent={providerReady} hint={providerStatus.from ?? "Configure o provedor antes de enviar."} />
        </div>
      </section>

      <section className="mb-6 grid gap-3 md:grid-cols-5">
        <Audience label="Clientes" value={String(roleCounts.get("cliente") ?? 0)} />
        <Audience label="Produtores" value={String(roleCounts.get("produtor") ?? 0)} />
        <Audience label="Anfitriões" value={String(roleCounts.get("parceiro") ?? 0)} />
        <Audience label="Entregadores" value={String(roleCounts.get("entregador") ?? 0)} />
        <Audience label="Leads do site" value={String(leadsCount)} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.25fr]">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl text-forest-100">Biblioteca de templates</h2>
              <p className="text-sm text-stone-500">Escolha, duplique ou crie um modelo da marca.</p>
            </div>
          </div>
          <div className="space-y-3">
            {templates.map((item) => (
              <TemplateCard key={item.id} template={item} active={item.id === activeTemplateId} />
            ))}
            {templates.length === 0 && (
              <div className="rounded-xl border border-campo-border bg-campo-surface2/35 p-5 text-sm text-stone-400">
                Nenhum template encontrado. Use "Novo template" ou aplique a migration para carregar os modelos iniciais.
              </div>
            )}
          </div>

          <section className="mt-6 rounded-2xl border border-campo-border bg-campo-surface2/35 p-5">
            <h2 className="font-serif text-xl text-forest-100">Campanhas recentes</h2>
            <div className="mt-4 space-y-2">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-lg border border-campo-border bg-campo-bg/45 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-forest-100">{campaign.name}</p>
                      <p className="truncate text-xs text-stone-500">{campaign.subject}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-gold/30 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-gold">
                      {CAMPAIGN_STATUS_LABEL[campaign.status]}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                    <span>{Number(campaign.stats?.queued ?? 0)} na fila · {Number(campaign.stats?.sent ?? 0)} enviados · {Number(campaign.stats?.unsubscribed ?? 0)} descadastros</span>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/email-marketing?campaign=${campaign.id}`} className="rounded-lg border border-campo-border px-3 py-1.5 text-[0.72rem] font-medium text-stone-300 transition hover:border-gold/60">
                        Ver dados
                      </Link>
                      {["draft", "queued", "scheduled", "paused"].includes(campaign.status) && (
                        <form action={queueCampaign}>
                          <input type="hidden" name="id" value={campaign.id} />
                          <button className="rounded-lg border border-gold/45 px-3 py-1.5 text-[0.72rem] font-medium text-gold transition hover:bg-gold/10">
                            Montar fila
                          </button>
                        </form>
                      )}
                      {campaign.status === "queued" && (
                        <form action={sendQueuedCampaign}>
                          <input type="hidden" name="id" value={campaign.id} />
                          <button
                            disabled={!providerReady}
                            className="rounded-lg border border-forest-600 px-3 py-1.5 text-[0.72rem] font-medium text-forest-100 transition hover:border-gold/60 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            Enviar agora
                          </button>
                        </form>
                      )}
                      {campaign.status === "queued" && (
                        <form action={cancelQueuedCampaign}>
                          <input type="hidden" name="id" value={campaign.id} />
                          <button className="rounded-lg border border-red-900/50 px-3 py-1.5 text-[0.72rem] font-medium text-red-300 transition hover:border-red-500/70">
                            Cancelar fila
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && <p className="py-3 text-sm text-stone-500">Nenhuma campanha em rascunho ainda.</p>}
            </div>
          </section>

          <CampaignInsights
            campaign={selectedCampaign}
            deliveries={campaignDeliveries}
            events={campaignEvents}
            providerReady={providerReady}
          />

          <section className="mt-6 rounded-2xl border border-campo-border bg-campo-surface2/35 p-5">
            <h2 className="font-serif text-xl text-forest-100">Fila preparada</h2>
            <p className="mt-2 text-sm text-stone-500">Últimas entregas materializadas para auditoria antes do envio real.</p>
            <div className="mt-4 space-y-2">
              {deliveries.map((delivery) => (
                <div key={delivery.id} className="rounded-lg border border-campo-border bg-campo-bg/45 px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-forest-100">{delivery.recipient_name || delivery.recipient_email}</p>
                      <p className="truncate text-xs text-stone-500">{delivery.recipient_email}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-gold/30 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-gold">
                      {DELIVERY_STATUS_LABEL[delivery.status]}
                    </span>
                  </div>
                </div>
              ))}
              {deliveries.length === 0 && <p className="py-3 text-sm text-stone-500">Nenhuma entrega entrou na fila ainda.</p>}
            </div>
          </section>
        </section>

        <section id="editor" className="space-y-6">
          <div className="glass rounded-2xl border border-campo-border p-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">{selected ? "Editar template" : "Novo template"}</p>
                <h2 className="mt-1 font-serif text-2xl text-forest-100">{selected?.name ?? "Criar modelo da Seravie"}</h2>
              </div>
              {selected && (
                <div className="flex flex-wrap gap-2">
                  <form action={sendTemplateTest}>
                    <input type="hidden" name="id" value={selected.id} />
                    <button disabled={!providerReady} className="rounded-lg border border-gold/50 px-3 py-2 text-xs font-medium text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-45">Enviar teste</button>
                  </form>
                  <form action={duplicateTemplate}>
                    <input type="hidden" name="id" value={selected.id} />
                    <button className="rounded-lg border border-campo-border px-3 py-2 text-xs text-stone-200 transition hover:border-gold/60">Duplicar</button>
                  </form>
                  <form action={archiveTemplate}>
                    <input type="hidden" name="id" value={selected.id} />
                    <button className="rounded-lg border border-red-900/50 px-3 py-2 text-xs text-red-300 transition hover:border-red-500/70">Arquivar</button>
                  </form>
                </div>
              )}
            </div>

            <form action={saveTemplate} className="space-y-5">
              <input type="hidden" name="id" value={selected?.id ?? ""} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome">
                  <input name="name" defaultValue={template.name} className={inputCls} placeholder="Newsletter de destinos" />
                </Field>
                <Field label="Slug">
                  <input name="slug" defaultValue={template.slug} className={inputCls} placeholder="newsletter-destinos" />
                </Field>
                <Field label="Categoria">
                  <GlassSelect name="category" defaultValue={template.category} options={EMAIL_CATEGORY_OPTIONS} buttonClassName="rounded-lg bg-campo-bg text-stone-100" />
                </Field>
                <Field label="Status">
                  <GlassSelect name="status" defaultValue={template.status} options={EMAIL_STATUS_OPTIONS} buttonClassName="rounded-lg bg-campo-bg text-stone-100" />
                </Field>
              </div>

              <Field label="Descrição interna">
                <textarea name="description" defaultValue={template.description} rows={2} className={inputCls} placeholder="Quando este template deve ser usado." />
              </Field>

              <fieldset className="rounded-xl border border-campo-border bg-campo-bg/35 p-4">
                <legend className="px-1 text-xs uppercase tracking-[0.14em] text-stone-500">Público</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {EMAIL_AUDIENCE_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 rounded-lg border border-campo-border bg-campo-surface/55 px-3 py-2 text-sm text-stone-300">
                      <input type="checkbox" name="audience" value={option.value} defaultChecked={template.audience.includes(option.value)} className="accent-gold" />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Assunto">
                  <input name="subject" defaultValue={template.subject} className={inputCls} placeholder="Seu próximo destino no campo" />
                </Field>
                <Field label="Preheader">
                  <input name="preheader" defaultValue={template.preheader} className={inputCls} placeholder="Texto curto que aparece na caixa de entrada." />
                </Field>
              </div>

              <div className="rounded-xl border border-campo-border bg-campo-bg/35 p-4">
                <ImageUpload name="image_url" label="Imagem principal do email" userId={user.id} currentUrl={template.image_url} folder="email-marketing/templates" shape="wide" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Título principal">
                  <input name="hero_title" defaultValue={template.hero_title} className={inputCls} placeholder="O campo mudou desde sua última visita" />
                </Field>
                <Field label="Botão">
                  <input name="cta_label" defaultValue={template.cta_label} className={inputCls} placeholder="Ver novidades" />
                </Field>
              </div>

              <Field label="Texto principal">
                <textarea name="hero_body" defaultValue={template.hero_body} rows={4} className={inputCls} />
              </Field>

              <Field label="Link do botão">
                <input name="cta_url" defaultValue={template.cta_url} className={inputCls} placeholder="https://seraviecampo.com/experiencias" />
              </Field>

              <Field label="Blocos do email">
                <textarea name="blocks_text" defaultValue={blocksToEditableText(template.blocks)} rows={10} className={`${inputCls} font-mono text-xs leading-relaxed`} />
                <p className="mt-2 text-xs text-stone-500">Use uma linha com o título, depois o texto. Separe blocos com uma linha contendo apenas ---.</p>
              </Field>

              <Field label="Rodapé legal">
                <textarea name="footer_note" defaultValue={template.footer_note} rows={3} className={inputCls} />
              </Field>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-campo-border pt-4">
                <p className="text-xs text-stone-500">O HTML salvo inclui link de descadastro por variável <code className="text-gold">{"{{unsubscribe_url}}"}</code>.</p>
                <button className="rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Salvar template</button>
              </div>
            </form>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
            <section className="rounded-2xl border border-campo-border bg-campo-surface2/35 p-5">
              <h2 className="font-serif text-xl text-forest-100">Criar campanha</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">
                A campanha nasce como rascunho com o snapshot do template selecionado. Depois, use "Montar fila" em campanhas recentes para materializar destinatários, descadastros e tokens antes do envio real.
              </p>
              <form action={createCampaignDraft} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={selected?.id ?? ""} />
                <Field label="Segmento">
                  <GlassSelect
                    name="segment_id"
                    defaultValue={segments[0]?.id ?? ""}
                    options={segments.map((segment) => ({ value: segment.id, label: segment.name }))}
                    placeholder="Escolha um segmento"
                    buttonClassName="rounded-lg bg-campo-bg text-stone-100"
                  />
                </Field>
                <button disabled={!selected} className="w-full rounded-lg border border-gold/50 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40">
                  Criar rascunho de campanha
                </button>
              </form>
            </section>

            <EmailPreview template={template} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Alert({ children, tone = "success" }: { children: React.ReactNode; tone?: "success" | "error" }) {
  return (
    <div className={`mb-4 rounded-lg border px-3 py-2 text-sm ${tone === "error" ? "border-red-900/50 bg-red-950/40 text-red-300" : "border-forest-700 bg-forest-900/40 text-forest-200"}`}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value, accent, hint }: { label: string; value: string; accent?: boolean; hint?: string }) {
  return (
    <div className="rounded-2xl border border-campo-border bg-campo-surface2/45 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className={`mt-2 font-serif text-2xl ${accent ? "text-gold" : "text-forest-100"}`}>{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

function Audience({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-campo-border bg-campo-surface2/35 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-stone-500">{label}</p>
      <p className="mt-1 font-serif text-xl text-forest-100">{value}</p>
    </div>
  );
}

function countDeliveries(deliveries: EmailMarketingDelivery[], status: EmailMarketingDelivery["status"]) {
  return deliveries.filter((delivery) => delivery.status === status).length;
}

function campaignNumber(campaign: EmailMarketingCampaign, key: string) {
  return Number(campaign.stats?.[key] ?? 0);
}

function campaignMetrics(campaign: EmailMarketingCampaign, deliveries: EmailMarketingDelivery[]) {
  const queued = Math.max(campaignNumber(campaign, "queued"), deliveries.length);
  const sent = Math.max(campaignNumber(campaign, "sent"), countDeliveries(deliveries, "sent"));
  const failed = Math.max(campaignNumber(campaign, "failed"), countDeliveries(deliveries, "failed"));
  const opened = Math.max(campaignNumber(campaign, "opened"), deliveries.filter((delivery) => Boolean(delivery.opened_at)).length);
  const clicked = Math.max(campaignNumber(campaign, "clicked"), deliveries.filter((delivery) => Boolean(delivery.clicked_at)).length);
  const unsubscribed = Math.max(campaignNumber(campaign, "unsubscribed"), deliveries.filter((delivery) => Boolean(delivery.unsubscribed_at)).length);
  return { queued, sent, failed, opened, clicked, unsubscribed };
}

function percent(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function formatDateTime(value: string | null) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function defaultScheduleInput() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function eventLabel(type: string) {
  const labels: Record<string, string> = {
    queued: "Entrou na fila",
    sent: "Enviado",
    delivered: "Entregue",
    opened: "Aberto",
    clicked: "Clique",
    bounced: "Bounce",
    complained: "Reclamação",
    unsubscribed: "Descadastro",
    failed: "Falha",
  };
  return labels[type] ?? type;
}

function CampaignInsights({
  campaign,
  deliveries,
  events,
  providerReady,
}: {
  campaign: EmailMarketingCampaign | null;
  deliveries: EmailMarketingDelivery[];
  events: EmailMarketingEvent[];
  providerReady: boolean;
}) {
  if (!campaign) {
    return (
      <section className="mt-6 rounded-2xl border border-campo-border bg-campo-surface2/35 p-5">
        <h2 className="font-serif text-xl text-forest-100">Operação da campanha</h2>
        <p className="mt-2 text-sm text-stone-500">Crie uma campanha a partir de um template para acompanhar fila, envios e eventos.</p>
      </section>
    );
  }

  const metrics = campaignMetrics(campaign, deliveries);
  const failedDeliveries = deliveries.filter((delivery) => delivery.status === "failed");
  const canQueue = ["draft", "queued", "scheduled", "paused"].includes(campaign.status);
  const canSend = ["queued", "scheduled", "sending"].includes(campaign.status);
  const canCancel = ["queued", "scheduled", "sending"].includes(campaign.status);

  return (
    <section className="mt-6 rounded-2xl border border-campo-border bg-campo-surface2/35 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Operação da campanha</p>
          <h2 className="mt-1 truncate font-serif text-xl text-forest-100">{campaign.name}</h2>
          <p className="mt-1 text-xs text-stone-500">
            {CAMPAIGN_STATUS_LABEL[campaign.status]} · {campaign.scheduled_at ? `agendada para ${formatDateTime(campaign.scheduled_at)}` : `atualizada em ${formatDateTime(campaign.updated_at)}`}
          </p>
        </div>
        <span className="rounded-full border border-gold/30 px-3 py-1 text-xs uppercase tracking-[0.12em] text-gold">
          {CAMPAIGN_STATUS_LABEL[campaign.status]}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniMetric label="Fila" value={String(metrics.queued)} detail={`${metrics.sent} enviados`} />
        <MiniMetric label="Abertura" value={percent(metrics.opened, metrics.sent)} detail={`${metrics.opened} aberturas`} accent />
        <MiniMetric label="Cliques" value={percent(metrics.clicked, metrics.sent)} detail={`${metrics.clicked} cliques`} />
        <MiniMetric label="Falhas" value={String(metrics.failed)} detail={`${failedDeliveries.length} visíveis`} danger={metrics.failed > 0} />
        <MiniMetric label="Descadastros" value={String(metrics.unsubscribed)} detail="por campanha" />
        <MiniMetric label="Eventos" value={String(events.length)} detail="últimas interações" />
      </div>

      <div className="mt-5 space-y-2">
        <Progress label="Envio" value={metrics.sent} total={metrics.queued} />
        <Progress label="Engajamento" value={metrics.opened + metrics.clicked} total={Math.max(metrics.sent * 2, 1)} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {canQueue && (
          <form action={queueCampaign}>
            <input type="hidden" name="id" value={campaign.id} />
            <button className="rounded-lg border border-gold/45 px-3 py-2 text-xs font-medium text-gold transition hover:bg-gold/10">Montar fila</button>
          </form>
        )}
        {canSend && (
          <form action={sendQueuedCampaign}>
            <input type="hidden" name="id" value={campaign.id} />
            <button disabled={!providerReady} className="rounded-lg border border-forest-600 px-3 py-2 text-xs font-medium text-forest-100 transition hover:border-gold/60 disabled:cursor-not-allowed disabled:opacity-45">
              Enviar agora
            </button>
          </form>
        )}
        <form action={retryFailedCampaign}>
          <input type="hidden" name="id" value={campaign.id} />
          <button disabled={failedDeliveries.length === 0} className="rounded-lg border border-campo-border px-3 py-2 text-xs font-medium text-stone-200 transition hover:border-gold/60 disabled:cursor-not-allowed disabled:opacity-40">
            Reenfileirar falhas
          </button>
        </form>
        {canCancel && (
          <form action={cancelQueuedCampaign}>
            <input type="hidden" name="id" value={campaign.id} />
            <button className="rounded-lg border border-red-900/50 px-3 py-2 text-xs font-medium text-red-300 transition hover:border-red-500/70">Cancelar fila</button>
          </form>
        )}
      </div>

      <form action={scheduleCampaign} className="mt-5 grid gap-3 rounded-xl border border-campo-border bg-campo-bg/35 p-3 sm:grid-cols-[1fr_auto]">
        <input type="hidden" name="id" value={campaign.id} />
        <Field label="Agendar envio">
          <input type="datetime-local" name="scheduled_at" defaultValue={defaultScheduleInput()} className={inputCls} />
        </Field>
        <div className="flex items-end">
          <button disabled={!canQueue} className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-medium text-campo-bg transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-45">
            Agendar
          </button>
        </div>
      </form>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-xs uppercase tracking-[0.16em] text-stone-500">Eventos recentes</h3>
          <div className="mt-3 space-y-2">
            {events.slice(0, 6).map((event) => (
              <div key={event.id} className="rounded-lg border border-campo-border bg-campo-bg/45 px-3 py-2">
                <p className="text-sm text-forest-100">{eventLabel(event.event_type)}</p>
                <p className="mt-1 truncate text-xs text-stone-500">{event.recipient_email} · {formatDateTime(event.created_at)}</p>
              </div>
            ))}
            {events.length === 0 && <p className="py-2 text-sm text-stone-500">Ainda não há eventos para esta campanha.</p>}
          </div>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-[0.16em] text-stone-500">Falhas recentes</h3>
          <div className="mt-3 space-y-2">
            {failedDeliveries.slice(0, 6).map((delivery) => (
              <div key={delivery.id} className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2">
                <p className="truncate text-sm text-red-200">{delivery.recipient_email}</p>
                <p className="mt-1 line-clamp-2 text-xs text-red-200/70">{delivery.error_message || "Falha sem mensagem do provedor."}</p>
              </div>
            ))}
            {failedDeliveries.length === 0 && <p className="py-2 text-sm text-stone-500">Nenhuma falha registrada nessa campanha.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniMetric({ label, value, detail, accent, danger }: { label: string; value: string; detail: string; accent?: boolean; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-campo-border bg-campo-bg/35 px-3 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-stone-500">{label}</p>
      <p className={`mt-1 font-serif text-2xl ${danger ? "text-red-300" : accent ? "text-gold" : "text-forest-100"}`}>{value}</p>
      <p className="mt-1 text-xs text-stone-500">{detail}</p>
    </div>
  );
}

function Progress({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-stone-500">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-campo-bg">
        <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TemplateCard({ template, active }: { template: EmailMarketingTemplate; active: boolean }) {
  const blocks = cleanTemplateBlocks(template.blocks);
  return (
    <Link
      href={`/admin/email-marketing?template=${template.id}`}
      className={`block rounded-2xl border p-4 transition ${active ? "border-gold/70 bg-gold/10" : "border-campo-border bg-campo-surface2/35 hover:border-gold/50"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-serif text-lg text-forest-100">{template.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gold">{categoryLabel(template.category)}</p>
        </div>
        <span className="shrink-0 rounded-full border border-campo-border px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-stone-400">
          {EMAIL_STATUS_OPTIONS.find((item) => item.value === template.status)?.label ?? template.status}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone-400">{template.description || template.preheader}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <span>{audienceLabels(template.audience)}</span>
        <span>·</span>
        <span>{blocks.length} blocos</span>
      </div>
    </Link>
  );
}

function EmailPreview({ template }: { template: EmailMarketingTemplate }) {
  const blocks = cleanTemplateBlocks(template.blocks);
  return (
    <section className="rounded-2xl border border-campo-border bg-campo-surface2/35 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Preview</p>
          <h2 className="font-serif text-xl text-forest-100">Email glassmorphism</h2>
        </div>
        <span className="rounded-full border border-gold/30 px-3 py-1 text-xs text-gold">Email-safe</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gold/30 bg-[#14160F] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="border-b border-gold/15 px-5 py-4">
          <p className="text-[0.65rem] uppercase tracking-[0.28em] text-cream">Seravie Campo</p>
        </div>
        {template.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={template.image_url} alt="" className="h-40 w-full object-cover" />
        )}
        <div className="bg-gradient-to-b from-[#1F2318]/95 to-[#191C13]/95 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-gold">{template.subject || "Assunto do email"}</p>
          <h3 className="mt-3 font-serif text-3xl leading-tight text-forest-100">{template.hero_title || "Título principal do email"}</h3>
          <p className="mt-3 text-sm leading-relaxed text-cream">{template.hero_body || template.preheader || "Texto principal da campanha."}</p>
        </div>
        <div className="space-y-3 p-4">
          {blocks.map((block, index) => (
            <div key={index} className="rounded-xl border border-gold/20 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              {block.title && <p className="text-xs uppercase tracking-[0.16em] text-gold">{block.title}</p>}
              <p className="mt-2 text-sm leading-relaxed text-stone-300">{block.text}</p>
            </div>
          ))}
        </div>
        <div className="px-4 pb-5">
          <span className="inline-block rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-campo-bg">{template.cta_label || "Botão da campanha"}</span>
        </div>
        <div className="border-t border-gold/15 px-5 py-4">
          <p className="text-xs leading-relaxed text-stone-500">{template.footer_note || "Rodapé legal e descadastro."}</p>
        </div>
      </div>

      <details className="mt-4 rounded-xl border border-campo-border bg-campo-bg/40 p-3">
        <summary className="cursor-pointer text-xs uppercase tracking-[0.16em] text-stone-500">Ver HTML gerado</summary>
        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-[0.68rem] leading-relaxed text-stone-400">{renderEmailHtml(template)}</pre>
      </details>
    </section>
  );
}
