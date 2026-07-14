export type MarketingEmailMessage = {
  to: string;
  toName?: string | null;
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
  unsubscribeUrl?: string | null;
};

export type MarketingEmailSendResult = {
  ok: boolean;
  provider: string;
  messageId?: string | null;
  queued?: boolean;
  error?: string;
  payload?: Record<string, unknown>;
};

export type MarketingEmailProviderStatus = {
  ready: boolean;
  provider: "cloudflare-email-service" | "resend" | "none";
  label: string;
  from: string | null;
};

function cloudflareConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = process.env.CLOUDFLARE_EMAIL_API_TOKEN?.trim();
  const from = process.env.EMAIL_MARKETING_FROM?.trim();
  const fromName = process.env.EMAIL_MARKETING_FROM_NAME?.trim() || "Seravie Campo";
  const replyTo = process.env.EMAIL_MARKETING_REPLY_TO?.trim();
  if (!accountId || !token || !from) return null;
  return { accountId, token, from, fromName, replyTo };
}

function resendConfig() {
  const token = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_MARKETING_FROM?.trim() || process.env.RESEND_FROM?.trim() || process.env.EMAIL_FROM?.trim();
  const fromName = process.env.EMAIL_MARKETING_FROM_NAME?.trim() || "Seravie Campo";
  const replyTo = process.env.EMAIL_MARKETING_REPLY_TO?.trim();
  if (!token || !from) return null;
  return { token, from, fromName, replyTo };
}

function formattedFrom(from: string, fromName: string) {
  return from.includes("<") ? from : `${fromName} <${from}>`;
}

export function marketingEmailProviderReady() {
  return Boolean(cloudflareConfig() || resendConfig());
}

export function marketingEmailProviderStatus(): MarketingEmailProviderStatus {
  const cloudflare = cloudflareConfig();
  if (cloudflare) {
    return {
      ready: true,
      provider: "cloudflare-email-service",
      label: "Cloudflare Email Service",
      from: formattedFrom(cloudflare.from, cloudflare.fromName),
    };
  }

  const resend = resendConfig();
  if (resend) {
    return {
      ready: true,
      provider: "resend",
      label: "Resend",
      from: formattedFrom(resend.from, resend.fromName),
    };
  }

  return {
    ready: false,
    provider: "none",
    label: "Pendente",
    from: null,
  };
}

export async function sendMarketingEmail(message: MarketingEmailMessage): Promise<MarketingEmailSendResult> {
  const config = cloudflareConfig();
  if (!config) return sendWithResend(message);

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/email/sending/send`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify({
      from: { address: config.from, name: config.fromName },
      to: [{ address: message.to, name: message.toName || undefined }],
      reply_to: message.replyTo || config.replyTo || undefined,
      subject: message.subject,
      html: message.html,
      text: message.text,
      headers: message.unsubscribeUrl ? { "List-Unsubscribe": `<${message.unsubscribeUrl}>` } : undefined,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    result?: { message_id?: string; queued?: string[]; delivered?: string[]; permanent_bounces?: string[] };
  };
  const error = payload.errors?.map((item) => item.message).filter(Boolean).join("; ");
  const queued = Boolean(payload.result?.queued?.length);
  const delivered = Boolean(payload.result?.delivered?.length);

  if (!response.ok || !payload.success || error) {
    return {
      ok: false,
      provider: "cloudflare-email-service",
      error: error || `Cloudflare Email Service respondeu ${response.status}.`,
      payload: payload as Record<string, unknown>,
    };
  }

  return {
    ok: delivered || queued,
    provider: "cloudflare-email-service",
    messageId: payload.result?.message_id ?? null,
    queued,
    payload: payload as Record<string, unknown>,
  };
}

async function sendWithResend(message: MarketingEmailMessage): Promise<MarketingEmailSendResult> {
  const config = resendConfig();
  if (!config) {
    return {
      ok: false,
      provider: "none",
      error: "Configure Cloudflare Email Service ou RESEND_API_KEY com EMAIL_MARKETING_FROM.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify({
      from: formattedFrom(config.from, config.fromName),
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo || config.replyTo || undefined,
      headers: message.unsubscribeUrl ? { "List-Unsubscribe": `<${message.unsubscribeUrl}>` } : undefined,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    name?: string;
    message?: string;
    error?: string;
  };

  if (!response.ok || !payload.id) {
    return {
      ok: false,
      provider: "resend",
      error: payload.message || payload.error || `Resend respondeu ${response.status}.`,
      payload: payload as Record<string, unknown>,
    };
  }

  return {
    ok: true,
    provider: "resend",
    messageId: payload.id,
    queued: false,
    payload: payload as Record<string, unknown>,
  };
}
