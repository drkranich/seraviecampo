import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { AppShell, PARCEIRO_NAV } from "@/components/AppShell";
import { ExperienceFormFields } from "@/components/ExperienceFormFields";
import { createExperience } from "../actions";

export default async function NovaExperienciaParceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole("parceiro");
  const { error } = await searchParams;

  return (
    <AppShell badge="Parceiro de Experiências" nav={PARCEIRO_NAV} title="Nova experiência" subtitle="Crie uma vivência para receber visitantes.">
      <Link href="/parceiro/experiencias" className="mb-6 inline-block text-sm text-stone-400 hover:text-gold">← Voltar para experiências</Link>

      {error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{decodeURIComponent(error)}</div>}

      <form action={createExperience} className="max-w-2xl rounded-2xl border border-campo-border glass p-6">
        <ExperienceFormFields />
        <div className="mt-6 flex gap-3">
          <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Salvar experiência</button>
          <Link href="/parceiro/experiencias" className="rounded-lg border border-campo-border px-6 py-2.5 text-stone-200 transition hover:border-gold/50">Cancelar</Link>
        </div>
      </form>
    </AppShell>
  );
}
