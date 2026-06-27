import { MultiImageUpload } from "@/components/MultiImageUpload";
import { FancySelect } from "@/components/FancySelect";
import { EXP_CATEGORIES, EXP_CATEGORY_LABEL, type Experience } from "@/lib/experiences";

const inputCls =
  "w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold";
const labelCls = "mb-1 block text-sm text-stone-300";

export function ExperienceFormFields({ exp }: { exp?: Experience }) {
  const price = exp ? (exp.price_cents / 100).toFixed(2).replace(".", ",") : "";
  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Título da experiência *</label>
        <input name="title" defaultValue={exp?.title ?? ""} required className={inputCls} placeholder="Ex: Café da manhã colonial na fazenda" />
      </div>

      <div>
        <label className={labelCls}>Resumo (aparece nos cards)</label>
        <input name="summary" defaultValue={exp?.summary ?? ""} className={inputCls} placeholder="Uma frase que desperta o desejo de viver isso." />
      </div>

      <div>
        <label className={labelCls}>História / descrição completa</label>
        <textarea name="description" defaultValue={exp?.description ?? ""} rows={5} className={inputCls}
          placeholder="Conte a história, o que o visitante vai viver, o ambiente, a refeição, o passo a passo..." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Categoria</label>
          <FancySelect name="category" defaultValue={exp?.category ?? "gastronomia"} searchable
            options={EXP_CATEGORIES.map((c) => ({ value: c, label: EXP_CATEGORY_LABEL[c] }))} />
        </div>
        <div>
          <label className={labelCls}>Local (cidade / endereço)</label>
          <input name="location" defaultValue={exp?.location ?? ""} className={inputCls} placeholder="Ex: Serra da Mantiqueira, Cunha-SP" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Preço por pessoa (R$)</label>
          <input name="price" defaultValue={price} inputMode="decimal" className={inputCls} placeholder="0,00" />
        </div>
        <div>
          <label className={labelCls}>Duração (minutos)</label>
          <input name="duration_min" type="number" min="15" step="15" defaultValue={exp?.duration_min ?? 120} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Capacidade (pessoas)</label>
          <input name="capacity" type="number" min="1" defaultValue={exp?.capacity ?? 10} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>O que está incluso (1 por linha)</label>
        <textarea name="includes" defaultValue={(exp?.includes ?? []).join("\n")} rows={4} className={`${inputCls} text-sm`}
          placeholder={"Café da manhã completo\nVisita guiada ao pomar\nDegustação de queijos\nCertificado de participação"} />
      </div>

      <MultiImageUpload
        name="images"
        label="Fotos da experiência"
        folder="experiencia"
        currentImages={exp?.images?.length ? exp.images : []}
      />

      <label className="flex items-center gap-2 pt-1 text-sm text-stone-300">
        <input type="checkbox" name="active" defaultChecked={exp?.active ?? true} className="accent-gold" />
        Publicar (visível na vitrine pública)
      </label>
    </div>
  );
}
