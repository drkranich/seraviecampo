import Link from "next/link";
import { PublicHome } from "@/components/PublicHome";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { getSiteCmsState } from "@/lib/site";

export default async function SitePreviewPage() {
  await requireRole("super_admin");
  const supabase = await createClient();
  const cms = await getSiteCmsState(supabase);

  return (
    <div className="min-h-screen bg-campo-bg">
      <div className="sticky top-0 z-50 border-b border-campo-border bg-campo-bg/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-gold">Preview do rascunho</p>
            <p className="text-sm text-stone-300">
              {cms.hasDraftChanges ? "Você está vendo alterações ainda não publicadas." : "O rascunho está igual à versão publicada."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/site" className="rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">
              Voltar ao CMS
            </Link>
            <Link href="/" target="_blank" className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">
              Ver publicado
            </Link>
          </div>
        </div>
      </div>
      <PublicHome site={cms.draft} />
    </div>
  );
}
