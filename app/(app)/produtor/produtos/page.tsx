import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { ConfirmButton } from "@/components/ConfirmButton";
import { formatBRL, CATEGORY_LABEL, STATUS_LABEL, UNIT_LABEL, type Product } from "@/lib/catalog";
import { archiveProduct, restoreProduct, deleteProduct } from "./actions";

export default async function ProdutosPage() {
  const { user } = await requireRole("produtor");
  const supabase = await createClient();

  const { data } = await supabase.from("products").select("*").eq("producer_id", user.id).order("created_at", { ascending: false });
  const all = (data ?? []) as Product[];
  const products = all.filter((p) => !p.archived);
  const archived = all.filter((p) => p.archived);

  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} title="Meus produtos" subtitle={`${products.length} ativo(s) · ${archived.length} arquivado(s)`}>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/produtor" className="text-sm text-stone-400 hover:text-gold">← Voltar</Link>
        <Link href="/produtor/produtos/novo" className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">+ Novo produto</Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">Nenhum produto ativo. Crie um novo ou restaure um arquivado.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-campo-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-campo-surface2 text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Estoque</th>
                <th className="px-4 py-3">Visível</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-campo-border glass">
              {products.map((p) => {
                const archive = archiveProduct.bind(null, p.id);
                const del = deleteProduct.bind(null, p.id);
                return (
                  <tr key={p.id} className="transition hover:bg-campo-surface2">
                    <td className="px-4 py-3">
                      <Link href={`/produtor/produtos/${p.id}`} className="font-medium text-forest-100 hover:text-gold">{p.name}</Link>
                      {p.is_organic && <span className="ml-2 rounded-full bg-forest-900 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-forest-200">Orgânico</span>}
                    </td>
                    <td className="px-4 py-3 text-stone-400">{CATEGORY_LABEL[p.category]}</td>
                    <td className="px-4 py-3 text-gold">{formatBRL(p.price_cents)}<span className="text-stone-500"> /{UNIT_LABEL[p.unit]}</span></td>
                    <td className="px-4 py-3 text-stone-400">{p.stock}</td>
                    <td className="px-4 py-3">{p.available ? <span className="text-forest-300">● Publicado</span> : <span className="text-stone-500">○ Rascunho</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/produtor/produtos/${p.id}`} className="rounded-lg border border-campo-border px-3 py-1.5 text-xs text-stone-200 transition hover:border-gold/50">Editar</Link>
                        <form action={archive}><button className="rounded-lg border border-campo-border px-3 py-1.5 text-xs text-stone-300 transition hover:border-gold/50">Arquivar</button></form>
                        <form action={del}><ConfirmButton message={`Excluir "${p.name}"? Esta ação não pode ser desfeita.`} className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-950/40">Excluir</ConfirmButton></form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {archived.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg text-stone-400">Arquivados</h2>
          <div className="space-y-2">
            {archived.map((p) => {
              const restore = restoreProduct.bind(null, p.id);
              const del = deleteProduct.bind(null, p.id);
              return (
                <div key={p.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl border border-campo-border p-3">
                  <span className="text-sm text-stone-300">{p.name} <span className="text-stone-500">· {formatBRL(p.price_cents)}</span></span>
                  <div className="flex items-center gap-2">
                    <form action={restore}><button className="rounded-lg border border-gold/40 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/10">Restaurar</button></form>
                    <form action={del}><ConfirmButton message={`Excluir "${p.name}" definitivamente?`} className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-950/40">Excluir</ConfirmButton></form>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </AppShell>
  );
}
