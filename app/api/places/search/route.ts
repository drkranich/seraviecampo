import { NextResponse } from "next/server";

export const runtime = "nodejs";

type MapboxFeature = {
  id?: string;
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    name_preferred?: string;
    full_address?: string;
    place_formatted?: string;
    context?: Record<string, { name?: string; country_code?: string } | undefined>;
  };
};

function geocoderToken() {
  return process.env.MAPBOX_ACCESS_TOKEN?.trim() || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() || "";
}

function compact(parts: Array<string | null | undefined>) {
  return parts.map((part) => String(part ?? "").trim()).filter(Boolean).join(", ");
}

function suggestionFrom(feature: MapboxFeature) {
  const props = feature.properties ?? {};
  const context = props.context ?? {};
  const place = props.name_preferred || props.name || context.place?.name || context.locality?.name || "";
  const region = context.region?.name;
  const country = context.country?.name;
  const fallback = props.full_address || props.place_formatted || place;
  const value = compact([place || fallback, region, country]) || fallback;
  const subtitle = compact([region, country]) || props.place_formatted || "";
  const coordinates = feature.geometry?.coordinates;

  if (!value) return null;

  return {
    id: feature.id || value,
    label: place || value,
    value,
    subtitle,
    lat: coordinates?.[1] ?? null,
    lng: coordinates?.[0] ?? null,
    source: "mapbox",
  };
}

export async function GET(request: Request) {
  const accessToken = geocoderToken();
  if (!accessToken) return NextResponse.json({ configured: false, suggestions: [] });

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") || "").trim().slice(0, 160);
  if (q.length < 2) return NextResponse.json({ configured: true, suggestions: [] });

  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const params = new URLSearchParams({
    q,
    access_token: accessToken,
    autocomplete: "true",
    language: "pt",
    limit: "6",
    types: "place,locality,region,country",
  });
  if (Number.isFinite(lat) && Number.isFinite(lng)) params.set("proximity", `${lng},${lat}`);

  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) return NextResponse.json({ configured: true, suggestions: [] });

  const json = (await response.json()) as { features?: MapboxFeature[] };
  const suggestions = (json.features ?? []).map(suggestionFrom).filter(Boolean).slice(0, 6);
  return NextResponse.json({ configured: true, suggestions });
}
