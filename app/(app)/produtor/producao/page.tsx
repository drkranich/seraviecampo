import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { STATUS_LABEL, STATUSES, formatBRL, type Product, type ProductionStatus } from "@/lib/catalog";

export default async function ProducaoPage() {
  const { user, profile } = await requireRole("produtor");
  const supabase = await createClient();

  const [{ data: prodData }, { count: reservas }] = await Promise.all([
    supabase.from("products").select("id, name, production_status, price_cents, stock, available_from").eq("producer_id", user.id),
    supabase.from("harvest_reservations").select("id", { count: "exact", head: true }).eq("producer_id", user.id).in("status", ["reservado", "confirmado"]),
  ]);
  const products = (prodData ?? []) as Product[];

  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil" title="Produção" subtitle="Do plantio à colheita reservada.">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/produtor/produtos/novo" className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">+ Novo produto</Link>
        <Link href="/produtor/reservas" className="rounded-lg border border-gold/40 px-4 py-2 text-sm text-gold transition hover:bg-gold/10">Reservas de colheita ({reservas ?? 0})</Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATUSES.map((st) => {
          const items = products.filter((p) => p.production_status === (st as ProductionStatus));
          return (
            <section key={st} className="glass rounded-2xl border border-campo-border p-4">
              <h2 className="mb-3 font-serif text-base text-forest-100">{STATUS_LABEL[st]} <span className="text-stone-500">({items.length})</span></h2>
              {items.length === 0 ? (
                <p className="text-xs text-stone-500">Nada aqui ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((p) => (
                    <li key={p.id}>
                      <Link href={`/produtor/produtos/${p.id}`} className="block rounded-lg border border-campo-border bg-campo-bg p-2.5 transition hover:border-gold/50">
                        <span className="block text-sm text-forest-100">{p.name}</span>
                        <span className="text-xs text-stone-500">{formatBRL(p.price_cents)} · estoque {p.stock ?? 0}{p.available_from ? ` · colheita ${new Date(p.available_from + "T00:00:00").toLocaleDateString("pt-BR")}` : ""}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
