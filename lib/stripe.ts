// Cliente Stripe via API REST (fetch) — roda nativo no Cloudflare Workers,
// sem SDK e sem dependências. A chave secreta vem de STRIPE_SECRET_KEY
// (secret no servidor — NUNCA NEXT_PUBLIC, NUNCA no repositório).

const SECRET = process.env.STRIPE_SECRET_KEY;

export function stripeEnabled(): boolean {
  return !!SECRET;
}

type Form = Record<string, string>;

async function stripeApi(path: string, form?: Form, method = "POST") {
  if (!SECRET) throw new Error("Stripe não configurado (STRIPE_SECRET_KEY ausente).");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const data = (await res.json()) as Record<string, unknown> & { error?: { message?: string } };
  if (!res.ok) throw new Error(data?.error?.message || "Erro na API do Stripe");
  return data;
}

// ---------- Stripe Connect (produtor recebe dos clientes) ----------
export async function createConnectAccount(email: string): Promise<string> {
  const acc = await stripeApi("accounts", {
    type: "express",
    email,
    "capabilities[card_payments][requested]": "true",
    "capabilities[transfers][requested]": "true",
    "business_type": "individual",
  });
  return acc.id as string;
}

export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<string> {
  const link = await stripeApi("account_links", {
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return link.url as string;
}

export async function getAccount(accountId: string) {
  const acc = await stripeApi(`accounts/${accountId}`, undefined, "GET");
  return { charges_enabled: !!acc.charges_enabled, details_submitted: !!acc.details_submitted };
}

// ---------- Assinatura do SaaS (produtor paga a Seravie Campo) ----------
export async function createSubscriptionCheckout(opts: {
  priceId: string;
  customerEmail: string;
  clientReferenceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await stripeApi("checkout/sessions", {
    mode: "subscription",
    "line_items[0][price]": opts.priceId,
    "line_items[0][quantity]": "1",
    customer_email: opts.customerEmail,
    client_reference_id: opts.clientReferenceId,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  });
  return session.url as string;
}

// ---------- Pagamento de PEDIDO (cliente paga a cesta) ----------
export async function createOrderCheckout(opts: {
  amountCents: number;
  currency: string;
  orderId: string;
  description: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await stripeApi("checkout/sessions", {
    mode: "payment",
    "line_items[0][price_data][currency]": opts.currency.toLowerCase(),
    "line_items[0][price_data][product_data][name]": opts.description,
    "line_items[0][price_data][unit_amount]": String(opts.amountCents),
    "line_items[0][quantity]": "1",
    "metadata[order_id]": opts.orderId,
    "payment_intent_data[metadata][order_id]": opts.orderId,
    customer_email: opts.customerEmail,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  });
  return session.url as string;
}

// ---------- Verificação de webhook (Web Crypto, compatível com Workers) ----------
export async function verifyStripeSignature(payload: string, sigHeader: string | null, secret: string): Promise<boolean> {
  if (!sigHeader) return false;
  const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=")));
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`));
  const expected = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return expected === v1;
}
