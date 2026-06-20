import { formatBRL } from "@/lib/catalog";

const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// dayMap: dia(1..31) -> { count, total_cents }
export function OrdersCalendar({
  year,
  month, // 1-12
  dayMap,
}: {
  year: number;
  month: number;
  dayMap: Map<number, { count: number; total: number }>;
}) {
  const first = new Date(year, month - 1, 1);
  const startWeekday = first.getDay(); // 0=Dom
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <p className="mb-3 font-serif text-lg text-forest-100">{MONTHS[month - 1]} de {year}</p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEK.map((w, i) => (
          <div key={i} className="pb-1 text-[0.65rem] uppercase tracking-wider text-stone-500">{w}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const info = dayMap.get(d);
          return (
            <div
              key={i}
              className={`aspect-square rounded-lg border p-1 text-xs ${
                info ? "border-gold/40 bg-gold/10" : "border-campo-border bg-campo-surface2/40"
              }`}
            >
              <div className="text-stone-400">{d}</div>
              {info && (
                <div className="mt-0.5 leading-tight">
                  <div className="text-[0.6rem] text-gold">{info.count} ped.</div>
                  <div className="text-[0.55rem] text-stone-400">{formatBRL(info.total)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
