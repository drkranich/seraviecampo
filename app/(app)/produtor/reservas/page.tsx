import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { RES_STATUS_LABEL, RES_STATUS_STYLE, type Reservation, type ReservationStatus } from "@/lib/reservations";
import { setReservationStatus } from "./actions";

export default async function ReservasProdutorPage({
  searchParams,
}: { searchParams: Promise<{ ok?: string }> }) {
  const { user } = await requireRole("produtor");
  const sp = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.from("harvest_reservations").select("*").eq("producer_id", user.id).order("created_at", { ascending: false });
  const reservas = (data ?? []) as Reservation[];

  const prodIds = [...new Set(reservas.map((r) => r.product_id))];
  const cliIds = [...new Set(reservas.map((r) => r.customer_id))];
  const { data: prods } = await supabase.from("products").select("id, name").in("id", prodIds.length ? prodIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data: clis } = await supabase.from("profiles").select("id, full_name, display_name").in("id", cliIds.length ? cliIds : ["00000000-0000-0000-0000-000000000000"]);
  const prodName = new Map((prods ?? []).map((p) => [p.id as string, p.name as string]));
  const cliName = new Map((clis ?? []).map((c) => [c.id as string, (c.full_name || c.display_name || "Cliente") as string]));

  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} title="Reservas de colheita" subtitle="Pedidos antecipados dos seus clientes.">
      {sp.ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Reserva atualizada.</div>}
      {reservas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">Nenhuma reserva recebida ainda.</div>
      ) : (
        <div className="space-y-3">
          {reservas.map((r) => {
            const confirmar = setReservationStatus.bind(null, r.id, "confirmado" as ReservationStatus);
            const concluir = setReservationStatus.bind(null, r.id, "concluido" as ReservationStatus);
            const cancelar = setReservationStatus.bind(null, r.id, "cancelado" as ReservationStatus);
            return (
              <div key={r.id} className="glass rounded-2xl border border-campo-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-forest-100">{prodName.get(r.product_id) ?? "Produto"} · <span className="text-stone-400">{cliName.get(r.customer_id) ?? "Cliente"}</span></p>
                    <p className="text-xs text-stone-500">Qtd: {r.quantity} · {new Date(r.created_at).toLocaleDateString("pt-BR")}{r.note ? ` · "${r.note}"` : ""}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs ${RES_STATUS_STYLE[r.status as ReservationStatus]}`}>{RES_STATUS_LABEL[r.status as ReservationStatus]}</span>
                </div>
                {r.status !== "concluido" && r.status !== "cancelado" && (
                  <div className="mt-3 flex gap-2">
                    {r.status === "reservado" && <form action={confirmar}><button className="rounded-lg border border-leaf-dark/60 px-3 py-1.5 text-xs text-leaf-light transition hover:bg-leaf-dark/20">Confirmar</button></form>}
                    <form action={concluir}><button className="rounded-lg border border-forest-700 px-3 py-1.5 text-xs text-forest-200 transition hover:bg-forest-900/40">Concluir</button></form>
                    <form action={cancelar}><button className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-950/40">Recusar</button></form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
