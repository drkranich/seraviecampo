"use client";

import { useState } from "react";

export function Carousel({ images, alt = "", className = "" }: { images: string[]; alt?: string; className?: string }) {
  const [i, setI] = useState(0);
  const imgs = images.filter(Boolean);
  if (imgs.length === 0) return null;
  const go = (d: number) => setI((p) => (p + d + imgs.length) % imgs.length);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-campo-surface2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgs[i]} alt={alt} className="h-full w-full object-cover" />
      {imgs.length > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Anterior"
            className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-campo-bg/70 px-2 py-1 text-stone-100 backdrop-blur hover:bg-campo-bg">‹</button>
          <button type="button" onClick={() => go(1)} aria-label="Próxima"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-campo-bg/70 px-2 py-1 text-stone-100 backdrop-blur hover:bg-campo-bg">›</button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {imgs.map((_, idx) => (
              <span key={idx} className={`h-1.5 w-1.5 rounded-full ${idx === i ? "bg-gold" : "bg-stone-100/40"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
