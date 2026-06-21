import { MultiImageUpload } from "@/components/MultiImageUpload";
import { FancySelect } from "@/components/FancySelect";
import {
  CATEGORIES,
  STATUSES,
  UNITS,
  CATEGORY_LABEL,
  STATUS_LABEL,
  UNIT_LABEL,
  type Product,
} from "@/lib/catalog";

const inputCls =
  "w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold";
const labelCls = "mb-1 block text-sm text-stone-300";

export function ProductFormFields({ product, userId }: { product?: Product; userId: string }) {
  const price = product ? (product.price_cents / 100).toFixed(2).replace(".", ",") : "";
  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Nome do produto *</label>
        <input name="name" defaultValue={product?.name ?? ""} required className={inputCls} placeholder="Ex: Queijo Minas Curado" />
      </div>

      <div>
        <label className={labelCls}>História / descrição</label>
        <textarea
          name="description"
          defaultValue={product?.description ?? ""}
          rows={3}
          className={inputCls}
          placeholder="Ex: Produzido há 40 anos pela nossa família, na serra da Mantiqueira..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Categoria</label>
          <FancySelect name="category" defaultValue={product?.category ?? "outros"} searchable
            options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))} />
        </div>
        <div>
          <label className={labelCls}>Status de produção</label>
          <FancySelect name="production_status" defaultValue={product?.production_status ?? "pronto"}
            options={STATUSES.map((st) => ({ value: st, label: STATUS_LABEL[st] }))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Preço (R$)</label>
          <input name="price" defaultValue={price} inputMode="decimal" className={inputCls} placeholder="0,00" />
        </div>
        <div>
          <label className={labelCls}>Unidade</label>
          <FancySelect name="unit" defaultValue={product?.unit ?? "unidade"}
            options={UNITS.map((u) => ({ value: u, label: UNIT_LABEL[u] }))} />
        </div>
        <div>
          <label className={labelCls}>Estoque</label>
          <input
            name="stock"
            type="number"
            step="any"
            min="0"
            defaultValue={product?.stock ?? 0}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Disponível a partir de (reserva de colheita)</label>
        <input
          name="available_from"
          type="date"
          defaultValue={product?.available_from ?? ""}
          className={inputCls}
        />
      </div>

      <MultiImageUpload
        name="images"
        label="Fotos do produto"
        folder="produto"
        currentImages={product?.images && product.images.length ? product.images : (product?.image_url ? [product.image_url] : [])}
      />

      <div className="flex flex-wrap gap-6 pt-1">
        <label className="flex items-center gap-2 text-sm text-stone-300">
          <input type="checkbox" name="is_organic" defaultChecked={product?.is_organic ?? false} className="accent-gold" />
          Produto orgânico
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-300">
          <input type="checkbox" name="available" defaultChecked={product?.available ?? true} className="accent-gold" />
          Publicar (visível para clientes)
        </label>
      </div>
    </div>
  );
}
