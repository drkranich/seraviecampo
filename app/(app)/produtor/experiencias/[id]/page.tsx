import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { ExperienceFormFields } from "@/components/ExperienceFormFields";
import { type Experience } from "@/lib/experiences";
import { updateExperience } from "../actions";

export default async function EditarExperienciaPage({
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

  const { data } = await supabase.from("experiences").select("*").eq("id", id).eq("producer_id", user.id).maybeSingle();
  if (!data) notFound();
  const exp = data as Experience;
  const update = updateExperience.bind(null, id);

  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} title="Editar experiência" subtitle={exp.title}>
      <Link href="/produtor/experiencias" className="mb-6 inline-block text-sm text-stone-400 hover:text-gold">← Voltar para experiências</Link>

      {error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{decodeURIComponent(error)}</div>}

      <form action={update} className="max-w-2xl rounded-2xl border border-campo-border glass p-6">
        <ExperienceFormFields exp={exp} />
        <div className="mt-6 flex gap-3">
          <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Salvar alterações</button>
          <Link href="/produtor/experiencias" className="rounded-lg border border-campo-border px-6 py-2.5 text-stone-200 transition hover:border-gold/50">Cancelar</Link>
        </div>
      </form>
    </AppShell>
  );
}
