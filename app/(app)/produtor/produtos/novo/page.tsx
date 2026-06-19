import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { ProductFormFields } from "@/components/ProductFormFields";
import { createProduct } from "../actions";

export default async function NovoProdutoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole("produtor");
  const { error } = await searchParams;

  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} title="Novo produto" subtitle="Cadastre um item do seu catálogo.">
      <Link href="/produtor/produtos" className="mb-6 inline-block text-sm text-stone-400 hover:text-gold">
        ← Voltar para produtos
      </Link>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <form action={createProduct} className="max-w-2xl rounded-2xl border border-campo-border glass p-6">
        <ProductFormFields />
        <div className="mt-6 flex gap-3">
          <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">
            Salvar produto
          </button>
          <Link
            href="/produtor/produtos"
            className="rounded-lg border border-campo-border px-6 py-2.5 text-stone-200 transition hover:border-gold/50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </AppShell>
  );
}
