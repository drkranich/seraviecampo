import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { ImageUpload } from "@/components/ImageUpload";
import { DocumentUpload } from "@/components/DocumentUpload";
import { LocationCapture } from "@/components/LocationCapture";
import { CountrySelect } from "@/components/CountrySelect";
import { updateProducerProfile } from "./actions";

const inputCls =
  "w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold";
const labelCls = "mb-1 block text-sm text-stone-300";

export default async function PerfilProdutorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { user } = await requireRole("produtor");
  const { error, ok } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, farm_name, city, state, country, bio, avatar_url, cover_url, document_url, lat")
    .eq("id", user.id)
    .single();

  type ProfileForm = {
    full_name: string | null;
    farm_name: string | null;
    city: string | null;
    state: string | null;
    bio: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    document_url: string | null;
    lat: number | null;
    country: string | null;
  };
  const p = (data ?? {}) as Partial<ProfileForm>;

  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} title="Meu perfil público" subtitle="É isto que o cliente vê. Capriche na história.">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/produtor" className="text-sm text-stone-400 hover:text-gold">
          ← Voltar
        </Link>
        <Link href={`/cliente/produtor/${user.id}`} className="text-sm text-gold hover:underline">
          Ver como cliente →
        </Link>
      </div>

      {ok && (
        <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">
          Perfil atualizado.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <form action={updateProducerProfile} className="relative z-20 max-w-2xl space-y-4 rounded-2xl border border-campo-border glass p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Seu nome</label>
            <input name="full_name" defaultValue={p.full_name ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Nome da fazenda / sítio</label>
            <input name="farm_name" defaultValue={p.farm_name ?? ""} className={inputCls} placeholder="Ex: Fazenda São José" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Cidade</label>
            <input name="city" defaultValue={p.city ?? ""} className={inputCls} placeholder="Ex: Lavras Novas" />
          </div>
          <div>
            <label className={labelCls}>Estado / Região</label>
            <input name="state" defaultValue={p.state ?? ""} className={inputCls} placeholder="Ex: Minas Gerais" />
          </div>
        </div>
        <CountrySelect defaultValue={p.country} />

        <div>
          <label className={labelCls}>Nossa história</label>
          <textarea
            name="bio"
            defaultValue={p.bio ?? ""}
            rows={5}
            className={inputCls}
            placeholder="Conte quem você é, há quanto tempo produz, o que torna seus produtos especiais..."
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <ImageUpload name="avatar_url" label="Foto de perfil" userId={user.id} currentUrl={p.avatar_url} folder="avatar" shape="square" />
          <ImageUpload name="cover_url" label="Imagem de capa" userId={user.id} currentUrl={p.cover_url} folder="cover" shape="wide" />
        </div>
        <DocumentUpload userId={user.id} label="Carteira de identidade (RG) com foto" docType="rg" currentPath={p.document_url} />

        <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">
          Salvar perfil
        </button>
      </form>

      <div className="relative z-0 mt-6 max-w-2xl">
        <LocationCapture redirectTo="/produtor/perfil" hasLocation={p.lat != null} />
      </div>
    </AppShell>
  );
}
