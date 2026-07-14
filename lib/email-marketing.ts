export type EmailAudienceKey = "cliente" | "produtor" | "parceiro" | "entregador" | "lead";

export type EmailTemplateBlock = {
  title?: string;
  text: string;
};

export type EmailMarketingTemplate = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  audience: string[];
  status: "draft" | "published" | "archived";
  subject: string;
  preheader: string;
  hero_title: string;
  hero_body: string;
  cta_label: string;
  cta_url: string;
  image_url: string | null;
  palette: Record<string, string>;
  blocks: EmailTemplateBlock[];
  footer_note: string;
  html_content: string;
  plain_text: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

export type EmailMarketingCampaign = {
  id: string;
  template_id: string | null;
  segment_id: string | null;
  name: string;
  status: "draft" | "queued" | "scheduled" | "sending" | "sent" | "paused" | "cancelled" | "archived";
  subject: string;
  preheader: string;
  from_name: string;
  reply_to_email: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  content_snapshot: Record<string, unknown>;
  stats: Record<string, number>;
  created_at: string;
  updated_at: string;
};

export type EmailMarketingDelivery = {
  id: string;
  campaign_id: string;
  subscriber_id: string | null;
  recipient_user_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  status: "queued" | "sending" | "sent" | "failed" | "skipped" | "cancelled";
  delivery_token: string;
  provider: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  attempts: number;
  queued_at: string;
  sending_at: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EmailMarketingSegment = {
  id: string;
  key: string;
  name: string;
  description: string;
  role_filter: string[];
  rules: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export const EMAIL_AUDIENCE_OPTIONS: Array<{ value: EmailAudienceKey; label: string }> = [
  { value: "cliente", label: "Clientes" },
  { value: "produtor", label: "Produtores rurais" },
  { value: "parceiro", label: "Parceiros e anfitriões" },
  { value: "entregador", label: "Entregadores" },
  { value: "lead", label: "Leads do site público" },
];

export const EMAIL_CATEGORY_OPTIONS = [
  { value: "boas-vindas", label: "Boas-vindas" },
  { value: "newsletter", label: "Newsletter" },
  { value: "destinos", label: "Destinos" },
  { value: "experiencias", label: "Experiências" },
  { value: "produtores", label: "Produtores" },
  { value: "sazonal", label: "Sazonal" },
  { value: "conversao", label: "Conversão" },
  { value: "retencao", label: "Retenção" },
  { value: "fornecedores", label: "Fornecedores" },
];

export const EMAIL_STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Pronto para usar" },
  { value: "archived", label: "Arquivado" },
];

export const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  queued: "Na fila",
  scheduled: "Agendada",
  sending: "Enviando",
  sent: "Enviada",
  paused: "Pausada",
  cancelled: "Cancelada",
  archived: "Arquivada",
};

export const DELIVERY_STATUS_LABEL: Record<string, string> = {
  queued: "Na fila",
  sending: "Enviando",
  sent: "Enviado",
  failed: "Falhou",
  skipped: "Ignorado",
  cancelled: "Cancelado",
};

export const EMAIL_BRAND_PALETTE = {
  background: "#14160F",
  surface: "#1F2318",
  glass: "#28331E",
  border: "#C2A878",
  accent: "#C2A878",
  text: "#E7E9DB",
  muted: "#C9BE93",
};

export function normalizeTemplateSlug(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function cleanTemplateBlocks(value: unknown): EmailTemplateBlock[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = typeof row.title === "string" ? row.title.trim() : "";
      const text = typeof row.text === "string" ? row.text.trim() : "";
      if (!text) return null;
      return { title, text };
    })
    .filter(Boolean) as EmailTemplateBlock[];
}

export function blocksToEditableText(blocks: EmailTemplateBlock[]) {
  return cleanTemplateBlocks(blocks)
    .map((block) => (block.title ? `${block.title}\n${block.text}` : block.text))
    .join("\n\n---\n\n");
}

export function editableTextToBlocks(raw: string): EmailTemplateBlock[] {
  return raw
    .split(/\n\s*---\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (lines.length <= 1) return { text: lines[0] ?? "" };
      return { title: lines[0], text: lines.slice(1).join(" ") };
    })
    .filter((block) => block.text);
}

export function audienceLabels(audience: string[]) {
  const labels = new Map(EMAIL_AUDIENCE_OPTIONS.map((item) => [item.value, item.label]));
  return audience.map((item) => labels.get(item as EmailAudienceKey) ?? item).join(", ");
}

export function categoryLabel(category: string) {
  return EMAIL_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function textToHtml(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function paletteOf(template: Pick<EmailMarketingTemplate, "palette">) {
  return { ...EMAIL_BRAND_PALETTE, ...(template.palette ?? {}) };
}

export function templateToPlainText(template: Pick<EmailMarketingTemplate, "subject" | "preheader" | "hero_title" | "hero_body" | "cta_label" | "cta_url" | "blocks" | "footer_note">) {
  const blocks = cleanTemplateBlocks(template.blocks);
  return [
    template.subject,
    template.preheader,
    "",
    template.hero_title,
    template.hero_body,
    "",
    ...blocks.flatMap((block) => [block.title ?? "", block.text, ""]),
    template.cta_label && template.cta_url ? `${template.cta_label}: ${template.cta_url}` : "",
    "",
    template.footer_note,
    "Descadastrar: {{unsubscribe_url}}",
  ].filter((line) => line != null).join("\n").trim();
}

export function renderEmailHtml(template: Pick<EmailMarketingTemplate, "subject" | "preheader" | "hero_title" | "hero_body" | "cta_label" | "cta_url" | "image_url" | "palette" | "blocks" | "footer_note">) {
  const palette = paletteOf(template);
  const blocks = cleanTemplateBlocks(template.blocks);
  const blockHtml = blocks
    .map((block) => `
      <tr>
        <td style="padding: 0 28px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid rgba(194,168,120,0.28); border-radius: 18px; background: ${palette.glass};">
            <tr>
              <td style="padding: 20px;">
                ${block.title ? `<p style="margin: 0 0 8px; color: ${palette.accent}; font: 700 12px Arial, sans-serif; letter-spacing: .12em; text-transform: uppercase;">${escapeHtml(block.title)}</p>` : ""}
                <p style="margin: 0; color: ${palette.text}; font: 400 15px/1.65 Arial, sans-serif;">${textToHtml(block.text)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `)
    .join("");

  const imageHtml = template.image_url ? `
    <tr>
      <td style="padding: 0;">
        <img src="${escapeHtml(template.image_url)}" width="640" alt="" style="display:block; width:100%; max-width:640px; height:auto; border:0;" />
      </td>
    </tr>
  ` : "";

  const ctaHtml = template.cta_label && template.cta_url ? `
    <tr>
      <td align="left" style="padding: 8px 28px 30px;">
        <a href="${escapeHtml(template.cta_url)}" style="display:inline-block; background:${palette.accent}; color:${palette.background}; font:700 14px Arial, sans-serif; text-decoration:none; padding: 13px 18px; border-radius: 12px;">
          ${escapeHtml(template.cta_label)}
        </a>
      </td>
    </tr>
  ` : "";

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(template.subject || "Seravie Campo")}</title>
  </head>
  <body style="margin:0; padding:0; background:${palette.background};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">${escapeHtml(template.preheader || "")}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${palette.background};">
      <tr>
        <td align="center" style="padding: 28px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%; max-width:640px; border:1px solid rgba(194,168,120,0.34); border-radius:24px; overflow:hidden; background:${palette.surface}; box-shadow:0 24px 80px rgba(0,0,0,.34);">
            <tr>
              <td style="padding: 24px 28px 18px;">
                <p style="margin:0; color:${palette.muted}; font:700 11px Arial, sans-serif; letter-spacing:.28em; text-transform:uppercase;">Seravie Campo</p>
              </td>
            </tr>
            ${imageHtml}
            <tr>
              <td style="padding: 28px 28px 12px;">
                <h1 style="margin:0; color:${palette.text}; font:400 34px/1.08 Georgia, Cambria, serif;">${escapeHtml(template.hero_title || template.subject || "Seravie Campo")}</h1>
                <p style="margin:16px 0 0; color:${palette.muted}; font:400 16px/1.7 Arial, sans-serif;">${textToHtml(template.hero_body || template.preheader || "")}</p>
              </td>
            </tr>
            ${blockHtml}
            ${ctaHtml}
            <tr>
              <td style="padding: 20px 28px 28px; border-top:1px solid rgba(194,168,120,0.18);">
                <p style="margin:0 0 10px; color:${palette.muted}; font:400 12px/1.6 Arial, sans-serif;">${textToHtml(template.footer_note || "Você recebeu este email por interagir com a Seravie Campo.")}</p>
                <p style="margin:0; color:${palette.muted}; font:400 12px/1.6 Arial, sans-serif;">
                  <a href="{{unsubscribe_url}}" style="color:${palette.accent}; text-decoration:underline;">Descadastrar</a>
                  <span style="color:${palette.muted};"> · Seravie Campo</span>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function templateSnapshot(template: EmailMarketingTemplate) {
  return {
    template_id: template.id,
    slug: template.slug,
    name: template.name,
    category: template.category,
    audience: template.audience,
    subject: template.subject,
    preheader: template.preheader,
    hero_title: template.hero_title,
    hero_body: template.hero_body,
    cta_label: template.cta_label,
    cta_url: template.cta_url,
    image_url: template.image_url,
    palette: paletteOf(template),
    blocks: cleanTemplateBlocks(template.blocks),
    footer_note: template.footer_note,
    html_content: template.html_content || renderEmailHtml(template),
    plain_text: template.plain_text || templateToPlainText(template),
  };
}

function snapshotString(snapshot: Record<string, unknown>, key: string) {
  const value = snapshot[key];
  return typeof value === "string" ? value : "";
}

function snapshotBlocks(snapshot: Record<string, unknown>) {
  return cleanTemplateBlocks(snapshot.blocks);
}

function snapshotPalette(snapshot: Record<string, unknown>) {
  const value = snapshot.palette;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, string>) : EMAIL_BRAND_PALETTE;
}

function snapshotToRenderable(snapshot: Record<string, unknown>) {
  return {
    subject: snapshotString(snapshot, "subject"),
    preheader: snapshotString(snapshot, "preheader"),
    hero_title: snapshotString(snapshot, "hero_title"),
    hero_body: snapshotString(snapshot, "hero_body"),
    cta_label: snapshotString(snapshot, "cta_label"),
    cta_url: snapshotString(snapshot, "cta_url"),
    image_url: snapshotString(snapshot, "image_url") || null,
    palette: snapshotPalette(snapshot),
    blocks: snapshotBlocks(snapshot),
    footer_note: snapshotString(snapshot, "footer_note"),
  };
}

function encodedUrl(path: string, baseUrl: string) {
  return new URL(path, baseUrl.replace(/\/$/, "")).toString();
}

function trackLinks(html: string, deliveryToken: string, baseUrl: string) {
  return html.replace(/href="([^"]+)"/g, (match, rawUrl: string) => {
    if (!rawUrl || rawUrl.includes("{{") || rawUrl.startsWith("#") || rawUrl.startsWith("mailto:") || rawUrl.startsWith("tel:")) {
      return match;
    }
    if (rawUrl.includes("/api/email-marketing/unsubscribe") || rawUrl.includes("/api/email-marketing/track/")) {
      return match;
    }
    const destination = new URL(rawUrl, baseUrl).toString();
    const tracked = encodedUrl(`/api/email-marketing/track/click?token=${encodeURIComponent(deliveryToken)}&url=${encodeURIComponent(destination)}`, baseUrl);
    return `href="${tracked}"`;
  });
}

function addOpenPixel(html: string, deliveryToken: string, baseUrl: string) {
  const pixel = `<img src="${encodedUrl(`/api/email-marketing/track/open?token=${encodeURIComponent(deliveryToken)}`, baseUrl)}" width="1" height="1" alt="" style="display:none; width:1px; height:1px; opacity:0;" />`;
  return html.includes("</body>") ? html.replace("</body>", `${pixel}</body>`) : `${html}${pixel}`;
}

export function renderDeliveryContent(
  snapshot: Record<string, unknown>,
  deliveryToken: string,
  options: { baseUrl?: string } = {}
) {
  const baseUrl = (options.baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://seraviecampo.com").replace(/\/$/, "");
  const unsubscribeUrl = encodedUrl(`/api/email-marketing/unsubscribe?token=${encodeURIComponent(deliveryToken)}`, baseUrl);
  const renderable = snapshotToRenderable(snapshot);
  const html = snapshotString(snapshot, "html_content") || renderEmailHtml(renderable);
  const text = snapshotString(snapshot, "plain_text") || templateToPlainText(renderable);
  const htmlWithUnsubscribe = html.replaceAll("{{unsubscribe_url}}", unsubscribeUrl);
  const textWithUnsubscribe = text.replaceAll("{{unsubscribe_url}}", unsubscribeUrl);

  return {
    subject: renderable.subject,
    preheader: renderable.preheader,
    unsubscribeUrl,
    html: addOpenPixel(trackLinks(htmlWithUnsubscribe, deliveryToken, baseUrl), deliveryToken, baseUrl),
    text: textWithUnsubscribe,
  };
}
