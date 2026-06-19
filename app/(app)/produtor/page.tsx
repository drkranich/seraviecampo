import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { formatBRL, type Product } from "@/lib/catalog";

export default async function ProdutorPage() {
  const { user, profile } = await requireRole("produtor");
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("producer_id", user.id)
    .order("created_at", { ascending: false });

  const list = (products ?? []) as Product[];
  const total = list.length;
  const disponiveis = list.filter((p) => p.available && p.production_status === "pronto").length;
  const reservados = list.filter((p) => p.production_status === "reservado").length;
  const crescendo = list.filter(
    (p) => p.production_status === "plantado" || p.production_status === "crescendo"
  ).length;

  const firstName = profile?.full_name?.split(" ")[0] || "Produtor";

  return (
    <AppShell
      badge="Produtor Rural"
      title={`Bom dia, ${firstName}!`}
      subtitle="Aqui está o resumo da sua operação gourmet de hoje."
    >
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Produtos" value={total} />
        <Stat label="Disponíveis" value={disponiveis} accent />
        <Stat label="Crescendo" value={crescendo} />
        <Stat label="Reservados" value={reservados} />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-xl text-forest-100">Meus produtos</h2>
        <div className="flex items-center gap-3">
          <Link href="/produtor/perfil" className="text-sm text-stone-400 transition hover:text-gold">
            Meu perfil público
          </Link>
          <Link
            href="/produtor/produtos/novo"
            className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light"
          >
            + Novo produto
          </Link>
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border bg-campo-surface p-10 text-center">
          <p className="mx-auto max-w-md text-stone-400">
            Você ainda não cadastrou produtos. Comece pelo primeiro — adicione a foto
            e a história dele. Isso vende muito mais.
          </p>
          <Link
            href="/produtor/produtos/novo"
            className="mt-4 inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-campo-bg transition hover:bg-gold-light"
          >
            Cadastrar meu primeiro produto
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.slice(0, 6).map((p) => (
            <Link
              key={p.id}
              href={`/produtor/produtos/${p.id}`}
              className="rounded-2xl border border-campo-border bg-campo-surface p-5 transition hover:border-gold/50"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif text-lg text-forest-100">{p.name}</h3>
                {p.is_organic && (
                  <span className="rounded-full bg-forest-900 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-forest-200">
                    Orgânico
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gold">{formatBRL(p.price_cents)}</p>
              <p className="mt-2 text-xs text-stone-500">
                {p.available ? "Publicado" : "Rascunho"} · estoque {p.stock}
              </p>
            </Link>
          ))}
        </div>
      )}

      {total > 6 && (
        <div className="mt-6">
          <Link href="/produtor/produtos" className="text-sm text-gold hover:underline">
            Ver todos os {total} produtos →
          </Link>
        </div>
      )}
    </AppShell>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-campo-border bg-campo-surface p-5">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-2 font-serif text-3xl ${accent ? "text-gold" : "text-forest-100"}`}>
        {value}
      </p>
    </div>
  );
}
