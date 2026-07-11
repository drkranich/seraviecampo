import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicInstitutionalPage } from "@/components/PublicInstitutionalPage";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { findInstitutionalPage, getSiteCmsState } from "@/lib/site";

export default async function InstitutionalPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireRole("super_admin");
  const { slug } = await params;
  const supabase = await createClient();
  const cms = await getSiteCmsState(supabase);
  const page = findInstitutionalPage(cms.draft, slug);
  if (!page) notFound();

  return (
    <div className="min-h-screen bg-campo-bg">
      <div className="sticky top-0 z-50 border-b border-campo-border bg-campo-bg/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-gold">Preview do rascunho</p>
            <p className="text-sm text-stone-300">
              Pagina institucional: {page.title}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/site" className="rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">
              Voltar ao CMS
            </Link>
            <Link href={`/${page.slug}`} target="_blank" className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">
              Ver publicado
            </Link>
          </div>
        </div>
      </div>
      <PublicInstitutionalPage site={cms.draft} page={page} />
    </div>
  );
}
