import { COUNTRIES } from "@/lib/countries";

export function CountrySelect({ defaultValue, className }: { defaultValue?: string | null; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm text-stone-300">País</label>
      <select name="country" defaultValue={defaultValue ?? "BR"}
        className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold">
        {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>)}
      </select>
    </div>
  );
}
