import { NextResponse } from "next/server";

export const runtime = "nodejs";

type MapboxFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    name_preferred?: string;
    full_address?: string;
    place_formatted?: string;
    context?: Record<string, { name?: string } | undefined>;
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
  if (!accessToken) return NextResponse.json({ configured: false, place: null });

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ configured: true, place: null }, { status: 400 });
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    access_token: accessToken,
    language: "pt",
    limit: "1",
    types: "place,locality,region,country",
  });

  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?${params.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) return NextResponse.json({ configured: true, place: null });

  const json = (await response.json()) as { features?: MapboxFeature[] };
  const place = suggestionFrom((json.features ?? [])[0] ?? {});
  return NextResponse.json({ configured: true, place });
}
