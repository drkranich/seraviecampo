import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { ProductFormFields } from "@/components/ProductFormFields";
import { type Product } from "@/lib/catalog";
import { updateProduct, deleteProduct } from "../actions";

export default async function EditarProdutoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { user } = await requireRole("produtor");
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("producer_id", user.id)
    .single();

  if (!data) notFound();
  const product = data as Product;

  const updateAction = updateProduct.bind(null, id);
  const deleteAction = deleteProduct.bind(null, id);

  return (
    <AppShell badge="Produtor Rural" title="Editar produto" subtitle={product.name}>
      <Link href="/produtor/produtos" className="mb-6 inline-block text-sm text-stone-400 hover:text-gold">
        ← Voltar para produtos
      </Link>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <form action={updateAction} className="max-w-2xl rounded-2xl border border-campo-border bg-campo-surface p-6">
        <ProductFormFields product={product} />
        <div className="mt-6 flex gap-3">
          <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">
            Salvar alterações
          </button>
          <Link
            href="/produtor/produtos"
            className="rounded-lg border border-campo-border px-6 py-2.5 text-stone-200 transition hover:border-gold/50"
          >
            Cancelar
          </Link>
        </div>
      </form>

      <form action={deleteAction} className="mt-6 max-w-2xl">
        <button className="text-sm text-red-400 transition hover:text-red-300">
          Excluir este produto
        </button>
      </form>
    </AppShell>
  );
}
