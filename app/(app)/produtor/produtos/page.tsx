import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import {
  formatBRL,
  CATEGORY_LABEL,
  STATUS_LABEL,
  UNIT_LABEL,
  type Product,
} from "@/lib/catalog";

export default async function ProdutosPage() {
  const { user } = await requireRole("produtor");
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("producer_id", user.id)
    .order("created_at", { ascending: false });

  const products = (data ?? []) as Product[];

  return (
    <AppShell badge="Produtor Rural" title="Meus produtos" subtitle={`${products.length} item(ns) no catálogo`}>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/produtor" className="text-sm text-stone-400 hover:text-gold">
          ← Voltar
        </Link>
        <Link
          href="/produtor/produtos/novo"
          className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light"
        >
          + Novo produto
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border bg-campo-surface p-10 text-center text-stone-400">
          Nenhum produto cadastrado ainda.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-campo-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-campo-surface2 text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Estoque</th>
                <th className="px-4 py-3">Visível</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-campo-border bg-campo-surface">
              {products.map((p) => (
                <tr key={p.id} className="transition hover:bg-campo-surface2">
                  <td className="px-4 py-3">
                    <Link href={`/produtor/produtos/${p.id}`} className="font-medium text-forest-100 hover:text-gold">
                      {p.name}
                    </Link>
                    {p.is_organic && (
                      <span className="ml-2 rounded-full bg-forest-900 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-forest-200">
                        Orgânico
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-400">{CATEGORY_LABEL[p.category]}</td>
                  <td className="px-4 py-3 text-stone-400">{STATUS_LABEL[p.production_status]}</td>
                  <td className="px-4 py-3 text-gold">
                    {formatBRL(p.price_cents)}
                    <span className="text-stone-500"> /{UNIT_LABEL[p.unit]}</span>
                  </td>
                  <td className="px-4 py-3 text-stone-400">{p.stock}</td>
                  <td className="px-4 py-3">
                    {p.available ? (
                      <span className="text-forest-300">● Publicado</span>
                    ) : (
                      <span className="text-stone-500">○ Rascunho</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
