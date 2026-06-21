import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ENTREGADOR_NAV } from "@/components/AppShell";
import { FancySelect } from "@/components/FancySelect";
import { ImageUpload } from "@/components/ImageUpload";
import { CountrySelect } from "@/components/CountrySelect";
import { DocumentUpload } from "@/components/DocumentUpload";
import { updateCourierProfile } from "./actions";

const inputCls = "w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold";
const labelCls = "mb-1 block text-sm text-stone-300";

export default async function PerfilEntregadorPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { user, profile } = await requireRole("entregador");
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, phone, city, state, country, vehicle_type, vehicle_plate, bio, avatar_url, document_url")
    .eq("id", user.id).single();
  const p = (data ?? {}) as Record<string, string | null>;

  return (
    <AppShell badge="Entregador" nav={ENTREGADOR_NAV} userName={profile?.full_name ?? "Entregador"} title="Meu perfil" subtitle="Seus dados e do seu veículo.">
      {ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Perfil atualizado.</div>}
      {error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</div>}

      <form action={updateCourierProfile} className="max-w-2xl space-y-4 rounded-2xl border border-campo-border glass p-6">
        <ImageUpload name="avatar_url" label="Foto de perfil" userId={user.id} currentUrl={p.avatar_url} folder="avatar" shape="square" />
        <DocumentUpload userId={user.id} label="Carteira de Motorista (CNH)" docType="cnh" currentPath={p.document_url} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelCls}>Nome completo</label><input name="full_name" defaultValue={p.full_name ?? ""} className={inputCls} /></div>
          <div><label className={labelCls}>Telefone / WhatsApp</label><input name="phone" defaultValue={p.phone ?? ""} className={inputCls} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelCls}>Cidade</label><input name="city" defaultValue={p.city ?? ""} className={inputCls} /></div>
          <div><label className={labelCls}>Estado / Região</label><input name="state" defaultValue={p.state ?? ""} className={inputCls} /></div>
        </div>
        <CountrySelect defaultValue={p.country} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Tipo de veículo</label>
            <FancySelect name="vehicle_type" defaultValue={p.vehicle_type ?? ""} placeholder="Selecione"
              options={[
                { value: "moto", label: "Moto" },
                { value: "carro", label: "Carro" },
                { value: "bicicleta", label: "Bicicleta" },
                { value: "van", label: "Van / Furgão" },
                { value: "caminhonete", label: "Caminhonete" },
              ]} />
          </div>
          <div><label className={labelCls}>Placa</label><input name="vehicle_plate" defaultValue={p.vehicle_plate ?? ""} className={inputCls} placeholder="ABC1D23" /></div>
        </div>
        <div>
          <label className={labelCls}>Sobre você</label>
          <textarea name="bio" defaultValue={p.bio ?? ""} rows={3} className={inputCls} placeholder="Sua experiência, regiões que atende..." />
        </div>
        <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Salvar perfil</button>
      </form>
    </AppShell>
  );
}
