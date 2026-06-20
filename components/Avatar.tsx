// Avatar com selo de verificação (componente de servidor).
export function Avatar({
  url,
  size = 48,
  verified = false,
  fallback = "🌾",
}: {
  url?: string | null;
  size?: number;
  verified?: boolean;
  fallback?: string;
}) {
  const sealSize = Math.max(14, Math.round(size * 0.32));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="h-full w-full overflow-hidden rounded-full border border-campo-border bg-campo-surface2">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ fontSize: size * 0.45 }}>
            {fallback}
          </div>
        )}
      </div>
      {verified && (
        <span
          title="Verificado"
          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full border-2 border-campo-bg bg-gold text-campo-bg"
          style={{ width: sealSize, height: sealSize }}
        >
          <svg width={sealSize * 0.6} height={sealSize * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 6" />
          </svg>
        </span>
      )}
    </div>
  );
}
