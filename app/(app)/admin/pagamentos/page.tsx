import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { formatBRL } from "@/lib/catalog";
import { DEFAULT_PRODUCER_PLAN } from "@/lib/plans";
import { getPlans } from "@/lib/plans-db";
import { platformShareCents, courierShareCents } from "@/lib/shipping";
import { producerName } from "@/lib/profile";

type Prof = { id: string; role: string; full_name: string | null; display_name: string | null; farm_name: string | null; payout_mode: string | null };
type Sub = { account_id: string; plan: string | null; status: string | null };
type Ord = { id: string; customer_id: string; producer_id: string; delivery_person_id: string | null; total_cents: number; delivery_fee_cents: number; payment_status: string };
type StripeWebhookEvent = {
  id: string;
  type: string;
  object_id: string | null;
  status: string;
  error: string | null;
  livemode: boolean | null;
  created_at: string;
  processed_at: string | null;
};
type PaymentRefund = {
  id: string;
  dispute_id: string | null;
  order_id: string | null;
  booking_id: string | null;
  stripe_refund_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  reason: string | null;
  failure_reason: string | null;
  created_at: string;
};
type PayoutTransfer = {
  id: string;
  source_type: "order" | "experience_booking";
  source_id: string;
  recipient_id: string | null;
  destination_account_id: string;
  stripe_transfer_id: string | null;
  stripe_reversal_id: string | null;
  kind: string;
  amount_cents: number;
  currency: string;
  status: string;
  error: string | null;
  created_at: string;
  reversed_at: string | null;
};
type StripeDisputeRow = {
  id: string;
  order_id: string | null;
  booking_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  reason: string | null;
  evidence_due_by: string | null;
  updated_at: string;
};

const ACTIVE = ["active", "ativa", "ativo", "trialing"];

export default async function AdminPagamentosPage() {
  await requireRole("super_admin");
  const supabase = await createClient();
  const planList = await getPlans(supabase);
  const planMap = new Map(planList.map((p) => [p.id, p]));

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const [
    { data: profsData },
    { data: subsData },
    { data: ordersData },
    { data: webhookData },
    { data: refundsData },
    { data: transfersData },
    { data: stripeDisputesData },
  ] = await Promise.all([
    supabase.from("profiles").select("id, role, full_name, display_name, farm_name, payout_mode"),
    supabase.from("subscriptions").select("account_id, plan, status"),
    supabase.from("orders").select("id, customer_id, producer_id, delivery_person_id, total_cents, delivery_fee_cents, payment_status")
      .neq("status", "cancelado").in("payment_status", ["pago", "na_entrega"]).gte("created_at", monthStart.toISOString()),
    supabase.from("stripe_webhook_events").select("id, type, object_id, status, error, livemode, created_at, processed_at")
      .order("created_at", { ascending: false }).limit(12),
    supabase.from("payment_refunds").select("id, dispute_id, order_id, booking_id, stripe_refund_id, stripe_payment_intent_id, amount_cents, currency, status, reason, failure_reason, created_at")
      .order("created_at", { ascending: false }).limit(12),
    supabase.from("payout_transfers").select("id, source_type, source_id, recipient_id, destination_account_id, stripe_transfer_id, stripe_reversal_id, kind, amount_cents, currency, status, error, created_at, reversed_at")
      .order("created_at", { ascending: false }).limit(16),
    supabase.from("stripe_disputes").select("id, order_id, booking_id, amount_cents, currency, status, reason, evidence_due_by, updated_at")
      .order("updated_at", { ascending: false }).limit(12),
  ]);

  const profs = (profsData ?? []) as Prof[];
  const subs = (subsData ?? []) as Sub[];
  const orders = (ordersData ?? []) as Ord[];
  const webhookEvents = (webhookData ?? []) as StripeWebhookEvent[];
  const refunds = (refundsData ?? []) as PaymentRefund[];
  const transfers = (transfersData ?? []) as PayoutTransfer[];
  const stripeDisputes = (stripeDisputesData ?? []) as StripeDisputeRow[];
  const profMap = new Map(profs.map((p) => [p.id, p]));

  // Assinaturas ativas por papel
  let subProd = 0, subCli = 0, subEnt = 0;
  for (const s of subs) {
    if (!s.plan || !(s.status && ACTIVE.includes(s.status))) continue;
    const price = planMap.get(s.plan)?.price_cents ?? 0;
    const role = profMap.get(s.account_id)?.role;
    if (role === "produtor") subProd += price;
    else if (role === "cliente") subCli += price;
    else if (role === "entregador") subEnt += price;
  }

  // Plano vigente por produtor (para comissão)
  const prodPlan = new Map<string, string>();
  for (const s of subs) {
    if (s.plan && s.status && ACTIVE.includes(s.status)) {
      if (profMap.get(s.account_id)?.role === "produtor") prodPlan.set(s.account_id, s.plan);
    }
  }

  // Agregações por venda
  let commissionTotal = 0, deliveryPlatform = 0;
  const byProducer = new Map<string, { revenue: number; commission: number }>();
  const byCourier = new Map<string, number>();
  const byClient = new Map<string, number>();
  for (const o of orders) {
    const fee = o.delivery_fee_cents || 0;
    const productRev = o.total_cents - fee;
    const pct = planMap.get(prodPlan.get(o.producer_id) ?? DEFAULT_PRODUCER_PLAN)?.commission_pct ?? 12;
    const comm = Math.round((productRev * pct) / 100);
    commissionTotal += comm;
    deliveryPlatform += platformShareCents(fee);

    const bp = byProducer.get(o.producer_id) ?? { revenue: 0, commission: 0 };
    bp.revenue += productRev; bp.commission += comm; byProducer.set(o.producer_id, bp);

    if (o.delivery_person_id) byCourier.set(o.delivery_person_id, (byCourier.get(o.delivery_person_id) ?? 0) + courierShareCents(fee));
    byClient.set(o.customer_id, (byClient.get(o.customer_id) ?? 0) + o.total_cents);
  }

  const subsTotal = subProd + subCli + subEnt;
  const receitaPlataforma = subsTotal + commissionTotal + deliveryPlatform;

  const producers = [...byProducer.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
  const couriers = [...byCourier.entries()].sort((a, b) => b[1] - a[1]);
  const clients = [...byClient.entries()].sort((a, b) => b[1] - a[1]);
  const failedWebhooks = webhookEvents.filter((event) => event.status === "failed").length;
  const lastWebhook = webhookEvents[0];
  const refundedTotal = refunds
    .filter((refund) => refund.status === "succeeded")
    .reduce((total, refund) => total + refund.amount_cents, 0);
  const transferTotal = transfers
    .filter((transfer) => transfer.status === "created")
    .reduce((total, transfer) => total + transfer.amount_cents, 0);
  const failedTransfers = transfers.filter((transfer) => transfer.status === "failed").length;
  const openStripeDisputes = stripeDisputes.filter((dispute) => dispute.status && !["won", "lost"].includes(dispute.status)).length;

  return (
    <AppShell badge="Seravie Hub" nav={ADMIN_NAV} title="Pagamentos" subtitle="Receita da plataforma no mês corrente (pedidos pagos + assinaturas).">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Receita da plataforma" value={formatBRL(receitaPlataforma)} accent />
        <Card label="Assinaturas" value={formatBRL(subsTotal)} />
        <Card label="Comissões sobre vendas" value={formatBRL(commissionTotal)} />
        <Card label="Frete (fatia plataforma)" value={formatBRL(deliveryPlatform)} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card label="Webhooks Stripe registrados" value={String(webhookEvents.length)} />
        <Card label="Webhooks com falha" value={String(failedWebhooks)} accent={failedWebhooks > 0} />
        <Card label="Último webhook" value={lastWebhook ? statusLabel(lastWebhook.status) : "Sem eventos"} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Reembolsos Stripe" value={formatBRL(refundedTotal)} accent={refundedTotal > 0} />
        <Card label="Repasses enviados" value={formatBRL(transferTotal)} />
        <Card label="Repasses com falha" value={String(failedTransfers)} accent={failedTransfers > 0} />
        <Card label="Disputas Stripe abertas" value={String(openStripeDisputes)} accent={openStripeDisputes > 0} />
      </div>

      <Table title="Webhooks Stripe (últimos eventos)" cols={["Evento", "Status", "Objeto", "Criado", "Processado", "Erro"]} empty="Nenhum webhook Stripe registrado ainda.">
        {webhookEvents.map((event) => (
          <tr key={event.id} className="border-t border-campo-border">
            <td className="px-4 py-2">
              <p className="max-w-[220px] truncate font-mono text-xs text-forest-100">{event.type}</p>
              <p className="max-w-[220px] truncate font-mono text-[0.65rem] text-stone-500">{event.id}</p>
            </td>
            <td className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${statusClass(event.status)}`}>{statusLabel(event.status)}</td>
            <td className="px-4 py-2 font-mono text-xs text-stone-400">{event.object_id ?? "-"}</td>
            <td className="px-4 py-2 text-stone-400">{formatDateTime(event.created_at)}</td>
            <td className="px-4 py-2 text-stone-400">{formatDateTime(event.processed_at)}</td>
            <td className="px-4 py-2">
              <p className="max-w-[260px] truncate text-xs text-stone-400">{event.error ?? "-"}</p>
            </td>
          </tr>
        ))}
      </Table>

      <Table title="Repasses Stripe (últimas transferências)" cols={["Origem", "Destinatário", "Status", "Valor", "Transferência", "Erro"]} empty="Nenhum repasse Stripe registrado ainda.">
        {transfers.map((transfer) => (
          <tr key={transfer.id} className="border-t border-campo-border">
            <td className="px-4 py-2">
              <p className="text-forest-100">{sourceLabel(transfer.source_type)} · {kindLabel(transfer.kind)}</p>
              <p className="max-w-[220px] truncate font-mono text-[0.65rem] text-stone-500">{transfer.source_id}</p>
            </td>
            <td className="px-4 py-2">
              <p className="text-stone-300">{profileLabel(profMap.get(transfer.recipient_id ?? ""))}</p>
              <p className="max-w-[220px] truncate font-mono text-[0.65rem] text-stone-500">{transfer.destination_account_id}</p>
            </td>
            <td className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${transferStatusClass(transfer.status)}`}>{transferStatusLabel(transfer.status)}</td>
            <td className="px-4 py-2 text-gold">{formatBRL(transfer.amount_cents)}</td>
            <td className="px-4 py-2">
              <p className="max-w-[220px] truncate font-mono text-xs text-stone-400">{transfer.stripe_transfer_id ?? "-"}</p>
              {transfer.stripe_reversal_id && <p className="max-w-[220px] truncate font-mono text-[0.65rem] text-red-300">reversal {transfer.stripe_reversal_id}</p>}
            </td>
            <td className="px-4 py-2">
              <p className="max-w-[260px] truncate text-xs text-stone-400">{transfer.error ?? "-"}</p>
            </td>
          </tr>
        ))}
      </Table>

      <Table title="Reembolsos Stripe" cols={["Origem", "Status", "Valor", "Refund", "Criado", "Falha"]} empty="Nenhum reembolso Stripe registrado ainda.">
        {refunds.map((refund) => (
          <tr key={refund.id} className="border-t border-campo-border">
            <td className="px-4 py-2">
              <p className="text-forest-100">{refund.order_id ? "Pedido" : refund.booking_id ? "Experiência" : "Sem vínculo"}</p>
              <p className="max-w-[220px] truncate font-mono text-[0.65rem] text-stone-500">{refund.order_id ?? refund.booking_id ?? refund.dispute_id ?? "-"}</p>
            </td>
            <td className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${refundStatusClass(refund.status)}`}>{refundStatusLabel(refund.status)}</td>
            <td className="px-4 py-2 text-gold">{formatBRL(refund.amount_cents)}</td>
            <td className="px-4 py-2">
              <p className="max-w-[220px] truncate font-mono text-xs text-stone-400">{refund.stripe_refund_id ?? "-"}</p>
              {refund.stripe_payment_intent_id && <p className="max-w-[220px] truncate font-mono text-[0.65rem] text-stone-500">{refund.stripe_payment_intent_id}</p>}
            </td>
            <td className="px-4 py-2 text-stone-400">{formatDateTime(refund.created_at)}</td>
            <td className="px-4 py-2">
              <p className="max-w-[260px] truncate text-xs text-stone-400">{refund.failure_reason ?? "-"}</p>
            </td>
          </tr>
        ))}
      </Table>

      <Table title="Disputas Stripe" cols={["Stripe", "Origem", "Status", "Valor", "Motivo", "Evidencia"]} empty="Nenhuma disputa Stripe registrada ainda.">
        {stripeDisputes.map((dispute) => (
          <tr key={dispute.id} className="border-t border-campo-border">
            <td className="px-4 py-2 font-mono text-xs text-forest-100">{dispute.id}</td>
            <td className="px-4 py-2">
              <p className="text-stone-300">{dispute.order_id ? "Pedido" : dispute.booking_id ? "Experiência" : "Sem vínculo"}</p>
              <p className="max-w-[220px] truncate font-mono text-[0.65rem] text-stone-500">{dispute.order_id ?? dispute.booking_id ?? "-"}</p>
            </td>
            <td className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D9C68D]">{dispute.status ?? "-"}</td>
            <td className="px-4 py-2 text-gold">{dispute.amount_cents != null ? formatBRL(dispute.amount_cents) : "-"}</td>
            <td className="px-4 py-2 text-stone-400">{dispute.reason ?? "-"}</td>
            <td className="px-4 py-2 text-stone-400">{formatDateTime(dispute.evidence_due_by)}</td>
          </tr>
        ))}
      </Table>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card label="Assinaturas — Produtores" value={formatBRL(subProd)} />
        <Card label="Assinaturas — Clientes" value={formatBRL(subCli)} />
        <Card label="Assinaturas — Entregadores" value={formatBRL(subEnt)} />
      </div>

      <Table title="Produtores (vendas e comissão devida)" empty="Sem vendas pagas no mês.">
        {producers.map(([id, v]) => {
          const p = profMap.get(id);
          const mode = p?.payout_mode === "imediato" ? "Dia útil seguinte" : "Acumulado mensal";
          return (
            <tr key={id} className="border-t border-campo-border">
              <td className="px-4 py-2 text-forest-100">{producerName(p)}</td>
              <td className="px-4 py-2 text-stone-300">{formatBRL(v.revenue)}</td>
              <td className="px-4 py-2 text-gold">{formatBRL(v.commission)}</td>
              <td className="px-4 py-2 text-stone-400">{mode}</td>
            </tr>
          );
        })}
      </Table>

      <Table title="Entregadores (ganhos com frete)" cols={["Entregador", "Ganhos de frete"]} empty="Nenhuma entrega paga no mês.">
        {couriers.map(([id, v]) => (
          <tr key={id} className="border-t border-campo-border">
            <td className="px-4 py-2 text-forest-100">{profMap.get(id)?.full_name ?? "Entregador"}</td>
            <td className="px-4 py-2 text-gold">{formatBRL(v)}</td>
          </tr>
        ))}
      </Table>

      <Table title="Clientes (pago no mês)" cols={["Cliente", "Total pago"]} empty="Nenhum pagamento no mês.">
        {clients.map(([id, v]) => (
          <tr key={id} className="border-t border-campo-border">
            <td className="px-4 py-2 text-forest-100">{profMap.get(id)?.full_name ?? "Cliente"}</td>
            <td className="px-4 py-2 text-gold">{formatBRL(v)}</td>
          </tr>
        ))}
      </Table>
    </AppShell>
  );
}

function statusLabel(status: string): string {
  if (status === "processed") return "Processado";
  if (status === "failed") return "Falhou";
  if (status === "processing") return "Processando";
  return status || "Indefinido";
}

function statusClass(status: string): string {
  if (status === "processed") return "text-[#A9C875]";
  if (status === "failed") return "text-red-300";
  if (status === "processing") return "text-[#D9C68D]";
  return "text-stone-400";
}

function transferStatusLabel(status: string): string {
  if (status === "created") return "Enviado";
  if (status === "failed") return "Falhou";
  if (status === "reversed") return "Estornado";
  return status || "Indefinido";
}

function transferStatusClass(status: string): string {
  if (status === "created") return "text-[#A9C875]";
  if (status === "failed") return "text-red-300";
  if (status === "reversed") return "text-[#D9C68D]";
  return "text-stone-400";
}

function refundStatusLabel(status: string): string {
  if (status === "succeeded") return "Concluído";
  if (status === "pending") return "Pendente";
  if (status === "failed") return "Falhou";
  if (status === "canceled") return "Cancelado";
  return status || "Indefinido";
}

function refundStatusClass(status: string): string {
  if (status === "succeeded") return "text-[#A9C875]";
  if (status === "failed" || status === "canceled") return "text-red-300";
  if (status === "pending") return "text-[#D9C68D]";
  return "text-stone-400";
}

function sourceLabel(source: string): string {
  if (source === "order") return "Pedido";
  if (source === "experience_booking") return "Experiência";
  return source || "Origem";
}

function kindLabel(kind: string): string {
  if (kind === "producer") return "produtor";
  if (kind === "courier") return "entregador";
  if (kind === "producer_delivery") return "autoentrega";
  if (kind === "experience") return "experiência";
  return kind || "repasse";
}

function profileLabel(profile: Prof | undefined): string {
  if (!profile) return "Conta conectada";
  return producerName(profile);
}

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl border border-campo-border p-5">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-2 font-serif text-2xl ${accent ? "text-gold" : "text-forest-100"}`}>{value}</p>
    </div>
  );
}

function Table({ title, children, cols, empty }: { title: string; children: React.ReactNode; cols?: string[]; empty: string }) {
  const headers = cols ?? ["Produtor", "Vendas (produtos)", "Comissão", "Repasse"];
  const arr = Array.isArray(children) ? children : [children];
  const isEmpty = arr.flat().filter(Boolean).length === 0;
  return (
    <section className="mb-6">
      <h2 className="mb-3 font-serif text-lg text-forest-100">{title}</h2>
      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-6 text-center text-sm text-stone-500">{empty}</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-campo-border glass">
          <table className="w-full text-left text-sm">
            <thead className="bg-campo-surface2 text-xs uppercase tracking-wider text-stone-500">
              <tr>{headers.map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
