"use client";
import { useState } from "react";
import { saveLocation } from "@/lib/actions/geo";

export function LocationCapture({ redirectTo, hasLocation }: { redirectTo: string; hasLocation?: boolean }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function detect() {
    setErr("");
    if (!("geolocation" in navigator)) { setErr("Geolocalização não suportada neste dispositivo."); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLoading(false); },
      () => { setErr("Não foi possível obter sua localização. Verifique as permissões do navegador."); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="rounded-2xl border border-campo-border glass p-5">
      <p className="font-serif text-lg text-forest-100">Minha localização (GPS)</p>
      <p className="mt-1 text-sm text-stone-400">
        Usada para calcular distância até os produtores e priorizar quem está perto de você.
        {hasLocation && <span className="text-forest-300"> Localização já cadastrada.</span>}
      </p>
      <button type="button" onClick={detect} disabled={loading}
        className="mt-3 rounded-lg border border-gold/40 px-4 py-2 text-sm text-gold transition hover:bg-gold/10 disabled:opacity-50">
        {loading ? "Obtendo..." : "Usar minha localização atual"}
      </button>
      {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
      {coords && (
        <form action={saveLocation} className="mt-3 flex items-center gap-3">
          <input type="hidden" name="lat" value={coords.lat} />
          <input type="hidden" name="lng" value={coords.lng} />
          <input type="hidden" name="redirect" value={redirectTo} />
          <span className="text-xs text-stone-400">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
          <button className="rounded-lg bg-gold px-4 py-1.5 text-sm font-medium text-campo-bg transition hover:bg-gold-light">
            Salvar localização
          </button>
        </form>
      )}
    </div>
  );
}
