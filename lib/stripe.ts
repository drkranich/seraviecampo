// Cliente Stripe via API REST (fetch) — roda nativo no Cloudflare Workers,
// sem SDK e sem dependências. A chave secreta vem dos secrets Stripe do servidor
// (secret no servidor — NUNCA NEXT_PUBLIC, NUNCA no repositório).

function readSecret(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

const SECRET = readSecret("STRIPE_SECRET_KEY") ?? readSecret("STRIPE_SANDBOX_API_KEY");

export function stripeEnabled(): boolean {
  return !!SECRET;
}

type Form = Record<string, string>;

async function stripeApi(path: string, form?: Form, method = "POST") {
  if (!SECRET) throw new Error("Stripe nao configurado (STRIPE_SECRET_KEY ou STRIPE_SANDBOX_API_KEY ausente).");
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
  metadata?: Record<string, string>;
}): Promise<string> {
  const form: Form = {
    mode: "subscription",
    "line_items[0][price]": opts.priceId,
    "line_items[0][quantity]": "1",
    customer_email: opts.customerEmail,
    client_reference_id: opts.clientReferenceId,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  };
  for (const [k, v] of Object.entries(opts.metadata ?? {})) {
    form[`metadata[${k}]`] = v;
    form[`subscription_data[metadata][${k}]`] = v;
  }
  const session = await stripeApi("checkout/sessions", form);
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

// ---------- Pagamento de EXPERIÊNCIA (cliente reserva uma vivência) ----------
export async function createExperienceCheckout(opts: {
  amountCents: number;
  currency: string;
  bookingId: string;
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
    "metadata[booking_id]": opts.bookingId,
    "payment_intent_data[metadata][booking_id]": opts.bookingId,
    customer_email: opts.customerEmail,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  });
  return session.url as string;
}

// ---------- Repasse (Transfer) para conta conectada do produtor/entregador ----------
export async function createTransfer(opts: {
  amountCents: number;
  currency: string;
  destinationAccountId: string;
  metadata?: Record<string, string>;
}): Promise<string> {
  const form: Form = {
    amount: String(opts.amountCents),
    currency: opts.currency.toLowerCase(),
    destination: opts.destinationAccountId,
  };
  for (const [k, v] of Object.entries(opts.metadata ?? {})) form[`metadata[${k}]`] = v;
  const t = await stripeApi("transfers", form);
  return t.id as string;
}

// ---------- Cliente Stripe + cartão salvo (IA Rural, cobrança por uso) ----------
export async function ensureCustomer(opts: { email: string; name?: string }): Promise<string> {
  const form: Form = { email: opts.email };
  if (opts.name) form.name = opts.name;
  const c = await stripeApi("customers", form);
  return c.id as string;
}

export async function createSetupCheckout(opts: {
  customerId: string;
  clientReferenceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const s = await stripeApi("checkout/sessions", {
    mode: "setup",
    customer: opts.customerId,
    client_reference_id: opts.clientReferenceId,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  });
  return s.url as string;
}

// ---------- Cobrança off-session (IA Rural por uso) ----------
export async function chargeOffSession(opts: {
  customerId: string;
  amountCents: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}): Promise<string> {
  const form: Form = {
    customer: opts.customerId,
    amount: String(opts.amountCents),
    currency: opts.currency.toLowerCase(),
    confirm: "true",
    off_session: "true",
    "automatic_payment_methods[enabled]": "true",
    "automatic_payment_methods[allow_redirects]": "never",
  };
  if (opts.description) form.description = opts.description;
  for (const [k, v] of Object.entries(opts.metadata ?? {})) form[`metadata[${k}]`] = v;
  const pi = await stripeApi("payment_intents", form);
  return pi.id as string;
}

// ---------- Preço recorrente (CMS de planos: gerar novo price ao alterar valor) ----------
export async function createRecurringPrice(opts: {
  productId?: string | null;
  productName: string;
  amountCents: number;
  currency: string;
}): Promise<{ priceId: string; productId: string }> {
  let productId = opts.productId || null;
  if (!productId) {
    const prod = await stripeApi("products", { name: opts.productName });
    productId = prod.id as string;
  }
  const price = await stripeApi("prices", {
    product: productId,
    unit_amount: String(opts.amountCents),
    currency: opts.currency.toLowerCase(),
    "recurring[interval]": "month",
  });
  return { priceId: price.id as string, productId };
}

// ---------- Verificação de webhook (Web Crypto, compatível com Workers) ----------
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyStripeSignature(payload: string, sigHeader: string | null, secret: string, toleranceSeconds = 300): Promise<boolean> {
  if (!sigHeader) return false;
  const entries = sigHeader.split(",").map((p) => {
    const [key, ...rest] = p.split("=");
    return [key, rest.join("=")] as const;
  });
  const t = entries.find(([key]) => key === "t")?.[1];
  const signatures = entries.filter(([key]) => key === "v1").map(([, value]) => value);
  const timestamp = Number(t);
  if (!t || signatures.length === 0 || !Number.isFinite(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`));
  const expected = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return signatures.some((value) => timingSafeEqual(expected, value));
}
