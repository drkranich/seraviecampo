// Gráficos em SVG puro (renderizáveis no servidor, sem dependências)

export function Sparkline({
  data,
  color = "#C2A878",
  width = 120,
  height = 40,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) data = [0, 0];
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / span) * (height - 6) - 3;
    return [x, y];
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline points={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AreaChart({
  data,
  labels,
  height = 240,
}: {
  data: number[];
  labels: string[];
  height?: number;
}) {
  const width = 720;
  const padX = 36;
  const padY = 24;
  if (data.length < 2) data = [0, 0];
  const max = Math.max(...data, 1);
  const stepX = (width - padX * 2) / (data.length - 1);
  const yOf = (v: number) => height - padY - (v / max) * (height - padY * 2);
  const pts = data.map((v, i) => [padX + i * stepX, yOf(v)] as [number, number]);
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `M ${padX},${height - padY} L ${line.replace(/ /g, " L ")} L ${width - padX},${height - padY} Z`;

  const gridVals = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="w-full">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C2A878" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#C2A878" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridVals.map((g, i) => {
        const y = height - padY - g * (height - padY * 2);
        return (
          <line key={i} x1={padX} y1={y} x2={width - padX} y2={y} stroke="#2C2F22" strokeWidth={1} />
        );
      })}
      <path d={area} fill="url(#areaFill)" />
      <polyline points={line} fill="none" stroke="#C2A878" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={2.5} fill="#14160F" stroke="#C2A878" strokeWidth={1.5} />
      ))}
      {labels.map((lab, i) => {
        if (i % Math.ceil(labels.length / 6) !== 0 && i !== labels.length - 1) return null;
        return (
          <text key={i} x={padX + i * stepX} y={height - 4} textAnchor="middle" fontSize="10" fill="#8A8C7E">
            {lab}
          </text>
        );
      })}
    </svg>
  );
}

export type DonutSegment = { value: number; color: string; label: string };

export function Donut({
  segments,
  centerTop,
  centerBottom,
}: {
  segments: DonutSegment[];
  centerTop: string;
  centerBottom?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 60;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg width={160} height={160} viewBox="0 0 160 160">
        <g transform="translate(80,80) rotate(-90)">
          <circle r={r} fill="none" stroke="#2C2F22" strokeWidth={18} />
          {segments.map((s, i) => {
            const len = (s.value / total) * c;
            const dash = `${len} ${c - len}`;
            const el = (
              <circle
                key={i}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={18}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" fontSize="26" fontFamily="Georgia, serif" fill="#E7E9DB">
          {centerTop}
        </text>
        {centerBottom && (
          <text x="80" y="94" textAnchor="middle" fontSize="10" fill="#8A8C7E">
            {centerBottom}
          </text>
        )}
      </svg>
      <ul className="space-y-2 text-sm">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-stone-300">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-stone-400">{s.label}</span>
            <span className="ml-1 text-forest-100">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
