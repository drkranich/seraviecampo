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

const ACTIVE = ["active", "ativa", "ativo", "trialing"];

export default async function AdminPagamentosPage() {
  await requireRole("super_admin");
  const supabase = await createClient();
  const planList = await getPlans(supabase);
  const planMap = new Map(planList.map((p) => [p.id, p]));

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const [{ data: profsData }, { data: subsData }, { data: ordersData }, { data: webhookData }] = await Promise.all([
    supabase.from("profiles").select("id, role, full_name, display_name, farm_name, payout_mode"),
    supabase.from("subscriptions").select("account_id, plan, status"),
    supabase.from("orders").select("id, customer_id, producer_id, delivery_person_id, total_cents, delivery_fee_cents, payment_status")
      .neq("status", "cancelado").in("payment_status", ["pago", "na_entrega"]).gte("created_at", monthStart.toISOString()),
    supabase.from("stripe_webhook_events").select("id, type, object_id, status, error, livemode, created_at, processed_at")
      .order("created_at", { ascending: false }).limit(12),
  ]);

  const profs = (profsData ?? []) as Prof[];
  const subs = (subsData ?? []) as Sub[];
  const orders = (ordersData ?? []) as Ord[];
  const webhookEvents = (webhookData ?? []) as StripeWebhookEvent[];
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
        <Card label="Ultimo webhook" value={lastWebhook ? statusLabel(lastWebhook.status) : "Sem eventos"} />
      </div>

      <Table title="Webhooks Stripe (ultimos eventos)" cols={["Evento", "Status", "Objeto", "Criado", "Processado", "Erro"]} empty="Nenhum webhook Stripe registrado ainda.">
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
