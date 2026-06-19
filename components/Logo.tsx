export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="font-serif text-3xl font-semibold tracking-wide text-forest-100">
        Seravie <span className="text-gold">Campo</span>
      </span>
      <span className="mt-1 text-[0.65rem] uppercase tracking-[0.35em] text-stone-500">
        Agro Gourmet
      </span>
    </div>
  );
}
