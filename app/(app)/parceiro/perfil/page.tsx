import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PARCEIRO_NAV } from "@/components/AppShell";
import { ImageUpload } from "@/components/ImageUpload";
import { DocumentUpload } from "@/components/DocumentUpload";
import { LocationCapture } from "@/components/LocationCapture";
import { CountrySelect } from "@/components/CountrySelect";
import { updateParceiroProfile } from "./actions";

const inputCls = "w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold";
const labelCls = "mb-1 block text-sm text-stone-300";

export default async function PerfilParceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { user } = await requireRole("parceiro");
  const { error, ok } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, farm_name, city, state, country, bio, avatar_url, cover_url, document_url, lat")
    .eq("id", user.id)
    .single();

  type ProfileForm = {
    full_name: string | null; farm_name: string | null; city: string | null; state: string | null;
    bio: string | null; avatar_url: string | null; cover_url: string | null; document_url: string | null;
    lat: number | null; country: string | null;
  };
  const p = (data ?? {}) as Partial<ProfileForm>;

  return (
    <AppShell badge="Parceiro de Experiências" nav={PARCEIRO_NAV} title="Meu perfil de anfitrião" subtitle="É isto que o visitante vê na página da experiência.">
      <div className="mb-6">
        <Link href="/parceiro" className="text-sm text-stone-400 hover:text-gold">← Voltar</Link>
      </div>

      {ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Perfil atualizado.</div>}
      {error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{decodeURIComponent(error)}</div>}

      <form action={updateParceiroProfile} className="relative z-20 max-w-2xl space-y-4 rounded-2xl border border-campo-border glass p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Seu nome</label>
            <input name="full_name" defaultValue={p.full_name ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Nome do negócio / marca</label>
            <input name="farm_name" defaultValue={p.farm_name ?? ""} className={inputCls} placeholder="Ex: Ateliê Raízes, Vinícola da Serra…" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Cidade</label>
            <input name="city" defaultValue={p.city ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Estado / Região</label>
            <input name="state" defaultValue={p.state ?? ""} className={inputCls} />
          </div>
        </div>
        <CountrySelect defaultValue={p.country} />

        <div>
          <label className={labelCls}>Sua história</label>
          <textarea name="bio" defaultValue={p.bio ?? ""} rows={5} className={inputCls}
            placeholder="Conte quem você é, o que oferece e o que torna suas experiências memoráveis..." />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <ImageUpload name="avatar_url" label="Foto de perfil" userId={user.id} currentUrl={p.avatar_url} folder="avatar" shape="square" />
          <ImageUpload name="cover_url" label="Imagem de capa" userId={user.id} currentUrl={p.cover_url} folder="cover" shape="wide" />
        </div>
        <DocumentUpload userId={user.id} label="Documento com foto (RG ou CNH)" docType="rg" currentPath={p.document_url} />

        <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Salvar perfil</button>
      </form>

      <div className="relative z-0 mt-6 max-w-2xl">
        <LocationCapture redirectTo="/parceiro/perfil" hasLocation={p.lat != null} />
      </div>
    </AppShell>
  );
}
