"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type DestinationOption = {
  id: string;
  label: string;
  value: string;
  subtitle?: string;
  lat?: number | null;
  lng?: number | null;
  source: "seravie" | "mapbox";
};

type PublicDestinationOption = {
  name: string;
  region?: string;
  city?: string;
  state?: string;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function samePlaceKey(option: Pick<DestinationOption, "value">) {
  return normalize(option.value);
}

function mergeSuggestions(local: DestinationOption[], remote: DestinationOption[]) {
  const seen = new Set<string>();
  return [...local, ...remote].filter((option) => {
    const key = samePlaceKey(option);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 7);
}

export function DestinationSearchField({ destinations }: { destinations: PublicDestinationOption[] }) {
  const inputId = useId();
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [value, setValue] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [remoteSuggestions, setRemoteSuggestions] = useState<DestinationOption[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const localOptions = useMemo(() => {
    const seen = new Set<string>();
    return destinations
      .map((destination) => {
        const subtitle = [destination.region, destination.state].filter(Boolean).join(" · ");
        return {
          id: `seravie-${destination.name}`,
          label: destination.name,
          value: [destination.name, destination.state].filter(Boolean).join(", "),
          subtitle,
          source: "seravie" as const,
        };
      })
      .filter((option) => {
        const key = samePlaceKey(option);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [destinations]);

  const localSuggestions = useMemo(() => {
    const q = normalize(value);
    if (!q) return localOptions.slice(0, 4);
    return localOptions
      .filter((option) => normalize(`${option.label} ${option.subtitle ?? ""} ${option.value}`).includes(q))
      .slice(0, 4);
  }, [localOptions, value]);

  const suggestions = useMemo(() => mergeSuggestions(localSuggestions, remoteSuggestions), [localSuggestions, remoteSuggestions]);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 3) {
      setRemoteSuggestions([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q });
        if (coords) {
          params.set("lat", String(coords.lat));
          params.set("lng", String(coords.lng));
        }
        const response = await fetch(`/api/places/search?${params.toString()}`, { signal: controller.signal });
        const json = (await response.json()) as { suggestions?: DestinationOption[] };
        setRemoteSuggestions(json.suggestions ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setRemoteSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 360);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [coords, value]);

  function selectSuggestion(option: DestinationOption) {
    setValue(option.value);
    setCoords(option.lat != null && option.lng != null ? { lat: option.lat, lng: option.lng } : null);
    setOpen(false);
    setActiveIndex(0);
    setError("");
  }

  function handleChange(nextValue: string) {
    setValue(nextValue);
    setCoords(null);
    setError("");
    setOpen(true);
    setActiveIndex(0);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex] ?? suggestions[0]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  async function detectLocation() {
    setError("");
    if (!("geolocation" in navigator)) {
      setError("GPS indisponível neste dispositivo.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCoords(nextCoords);
        try {
          const params = new URLSearchParams({ lat: String(nextCoords.lat), lng: String(nextCoords.lng) });
          const response = await fetch(`/api/places/reverse?${params.toString()}`);
          const json = (await response.json()) as { place?: DestinationOption | null };
          if (json.place?.value) {
            setValue(json.place.value);
          } else {
            setValue("Minha localização atual");
          }
        } catch {
          setValue("Minha localização atual");
        } finally {
          setLocating(false);
          setOpen(false);
        }
      },
      () => {
        setLocating(false);
        setError("Permita a localização no navegador para usar o GPS.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="relative flex min-w-0 flex-col rounded-md bg-white/[0.06] px-4 py-3">
      <label htmlFor={inputId} className="text-xs uppercase tracking-[0.18em] text-forest-100/60">
        Destino
      </label>
      <input type="hidden" name="lat" value={coords?.lat ?? ""} />
      <input type="hidden" name="lng" value={coords?.lng ?? ""} />
      <div className="mt-1 flex min-w-0 items-center gap-2">
        <input
          id={inputId}
          name="destino"
          value={value}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 120);
          }}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Lavras Novas, Toscana, Mendoza..."
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-forest-50 outline-none placeholder:text-forest-100/40"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={`${inputId}-suggestions`}
        />
        <button
          type="button"
          onClick={detectLocation}
          disabled={locating}
          title="Usar localização atual"
          aria-label="Usar localização atual"
          className="shrink-0 rounded-md border border-gold/35 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locating ? "..." : "GPS"}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-200">{error}</p>}
      {open && (suggestions.length > 0 || searching) && (
        <div
          id={`${inputId}-suggestions`}
          className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-30 overflow-hidden rounded-lg border border-white/15 bg-[#F5F0DE] py-1 text-campo-bg shadow-2xl shadow-black/35"
        >
          {suggestions.map((option, index) => (
            <button
              key={`${option.source}-${option.id}-${option.value}`}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(option)}
              className={`block w-full px-4 py-2 text-left text-sm transition ${index === activeIndex ? "bg-gold/30" : "hover:bg-gold/20"}`}
            >
              <span className="block font-semibold uppercase tracking-[0.08em]">{option.label}</span>
              {option.subtitle && <span className="mt-0.5 block text-xs text-campo-bg/65">{option.subtitle}</span>}
            </button>
          ))}
          {searching && <p className="px-4 py-2 text-xs text-campo-bg/60">Buscando destinos...</p>}
        </div>
      )}
    </div>
  );
}
