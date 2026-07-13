import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import { formatBRL, UNIT_LABEL, type Product } from "@/lib/catalog";
import { RES_STATUS_LABEL, RES_STATUS_STYLE, type Reservation, type ReservationStatus } from "@/lib/reservations";
import { producerName } from "@/lib/profile";
import { createReservation, cancelReservation } from "./actions";

export default async function ReservasClientePage({
  searchParams,
}: { searchParams: Promise<{ ok?: string; canc?: string; error?: string }> }) {
  const { user, profile } = await requireRole("cliente");
  const sp = await searchParams;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: prodData } = await supabase
    .from("products")
    .select("id, name, image_url, price_cents, unit, available_from, category, producer_id")
    .gte("available_from", today)
    .eq("available", true)
    .order("available_from", { ascending: true });
  const products = (prodData ?? []) as Product[];

  const { data: resData } = await supabase
    .from("harvest_reservations").select("*").eq("customer_id", user.id).order("created_at", { ascending: false });
  const reservas = (resData ?? []) as Reservation[];

  const pids = [...new Set([...products.map((p) => p.producer_id), ...reservas.map((r) => r.producer_id)])];
  const prodIds = [...new Set(reservas.map((r) => r.product_id))];
  const { data: profs } = await supabase.from("profiles").select("id, full_name, display_name, farm_name").in("id", pids.length ? pids : ["00000000-0000-0000-0000-000000000000"]);
  const nameOf = new Map((profs ?? []).map((p) => [p.id, producerName(p)]));
  const { data: prodNames } = await supabase.from("products").select("id, name").in("id", prodIds.length ? prodIds : ["00000000-0000-0000-0000-000000000000"]);
  const prodNameOf = new Map((prodNames ?? []).map((p) => [p.id as string, p.name as string]));

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} userName={profile?.full_name ?? "Cliente"} title="Reserva de colheita" subtitle="Garanta produtos que ainda estão sendo cultivados.">
      {sp.ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Reserva registrada! O produtor recebeu a solicitação e confirma pelo painel.</div>}
      {sp.canc && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Reserva cancelada.</div>}
      {sp.error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{decodeURIComponent(sp.error)}</div>}

      <h2 className="mb-3 font-serif text-xl text-forest-100">Pré-colheita disponível</h2>
      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-8 text-center text-stone-400">Nenhuma colheita futura anunciada no momento.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const reserve = createReservation.bind(null, p.id);
            return (
              <article key={p.id} className="glass rounded-2xl border border-campo-border p-5">
                <p className="font-serif text-lg text-forest-100">{p.name}</p>
                <p className="text-xs text-stone-500">{nameOf.get(p.producer_id) ?? "Produtor"}</p>
                <p className="mt-1 text-sm text-gold">{formatBRL(p.price_cents)} / {UNIT_LABEL[p.unit]}</p>
                <p className="mt-1 text-xs text-stone-400">Colheita prevista: {p.available_from ? new Date(p.available_from + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</p>
                <form action={reserve} className="mt-3 space-y-2">
                  <input name="quantity" type="number" min={1} defaultValue={1} className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-sm text-stone-100 outline-none focus:border-gold" />
                  <input name="note" placeholder="Observação (opcional)" className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-sm text-stone-100 outline-none focus:border-gold" />
                  <button className="w-full rounded-lg bg-gold py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Reservar</button>
                </form>
              </article>
            );
          })}
        </div>
      )}

      <h2 className="mb-3 mt-8 font-serif text-xl text-forest-100">Minhas reservas</h2>
      {reservas.length === 0 ? (
        <p className="text-sm text-stone-500">Você ainda não fez reservas.</p>
      ) : (
        <div className="space-y-3">
          {reservas.map((r) => {
            const canc = cancelReservation.bind(null, r.id);
            return (
              <div key={r.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-campo-border p-4">
                <div>
                  <p className="text-forest-100">{prodNameOf.get(r.product_id) ?? "Produto"} · <span className="text-stone-400">{nameOf.get(r.producer_id) ?? "Produtor"}</span></p>
                  <p className="text-xs text-stone-500">Qtd: {r.quantity} · {new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-xs ${RES_STATUS_STYLE[r.status as ReservationStatus]}`}>{RES_STATUS_LABEL[r.status as ReservationStatus]}</span>
                  {(r.status === "reservado" || r.status === "confirmado") && (
                    <form action={canc}><button className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-950/40">Cancelar</button></form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
