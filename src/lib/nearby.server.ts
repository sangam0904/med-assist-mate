import type { GeoPoint, NearbyPlace, NearbyResult, PlaceCategory } from "@/lib/nearby-types";

const FILTERS: Record<PlaceCategory, string[]> = {
  hospital: ['["amenity"="hospital"]'],
  doctors: ['["amenity"="doctors"]', '["healthcare"="doctor"]'],
  clinic: ['["amenity"="clinic"]', '["healthcare"="clinic"]'],
  pharmacy: ['["amenity"="pharmacy"]'],
  emergency: ['["emergency"="yes"]["amenity"="hospital"]', '["healthcare"="emergency"]'],
};

export function buildOverpassQuery(
  lat: number,
  lon: number,
  radius: number,
  categories: PlaceCategory[],
): string {
  const around = `(around:${radius},${lat},${lon})`;
  const parts = categories.flatMap((cat) =>
    FILTERS[cat].flatMap((f) => [`node${f}${around};`, `way${f}${around};`]),
  );
  return `[out:json][timeout:25];(${parts.join("")});out center tags 200;`;
}

type OverpassElement = {
  id?: number;
  type?: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function haversine(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function categoryOf(tags: Record<string, string>): PlaceCategory {
  const amenity = tags["amenity"];
  const healthcare = tags["healthcare"];
  if (amenity === "pharmacy" || healthcare === "pharmacy") return "pharmacy";
  if (amenity === "hospital") return tags["emergency"] === "yes" ? "emergency" : "hospital";
  if (healthcare === "emergency") return "emergency";
  if (amenity === "doctors" || healthcare === "doctor") return "doctors";
  return "clinic";
}

function addressOf(tags: Record<string, string>): string | null {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:suburb"],
    tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"],
    tags["addr:postcode"],
  ].filter((v) => v && v.trim().length > 0);
  return parts.length ? parts.join(", ") : null;
}

function servicesOf(tags: Record<string, string>): string[] {
  const out = new Set<string>();
  const speciality = tags["healthcare:speciality"] ?? tags["speciality"];
  if (speciality) {
    for (const s of speciality.split(";")) out.add(s.replace(/_/g, " ").trim());
  }
  if (tags["emergency"] === "yes") out.add("emergency");
  if (tags["dispensing"] === "yes") out.add("dispensing");
  if (tags["wheelchair"] === "yes") out.add("wheelchair access");
  if (tags["operator:type"]) out.add(tags["operator:type"].replace(/_/g, " "));
  return [...out].filter(Boolean).slice(0, 6);
}

export function parseOverpassElements(
  elements: unknown,
  lat: number,
  lon: number,
  radius: number,
): NearbyResult {
  const list = Array.isArray(elements) ? (elements as OverpassElement[]) : [];
  const seen = new Set<string>();
  const places: NearbyPlace[] = [];

  for (const el of list) {
    const tags = el.tags ?? {};
    const name = tags["name"] ?? tags["operator"];
    if (!name) continue;
    const pLat = el.lat ?? el.center?.lat;
    const pLon = el.lon ?? el.center?.lon;
    if (typeof pLat !== "number" || typeof pLon !== "number") continue;

    const distanceMeters = Math.round(haversine(lat, lon, pLat, pLon));
    if (distanceMeters > radius) continue;

    const key = `${name.toLowerCase()}|${pLat.toFixed(4)}|${pLon.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    places.push({
      id: `${el.type ?? "node"}/${el.id ?? key}`,
      name,
      category: categoryOf(tags),
      lat: pLat,
      lon: pLon,
      distanceMeters,
      address: addressOf(tags),
      phone: tags["phone"] ?? tags["contact:phone"] ?? null,
      website: tags["website"] ?? tags["contact:website"] ?? null,
      openingHours: tags["opening_hours"] ?? null,
      emergency: tags["emergency"] === "yes" || tags["healthcare"] === "emergency",
      services: servicesOf(tags),
    });
  }

  places.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return { places: places.slice(0, 120), truncated: places.length > 120 };
}

/** Nominatim forward geocoding for the manual-location fallback. */
export async function geocodeQuery(query: string): Promise<GeoPoint[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "MedAssistAI/1.0 (healthcare finder)",
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("geocode failed");
    const rows = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    return rows.map((r) => ({
      lat: Number(r.lat),
      lon: Number(r.lon),
      label: r.display_name,
    }));
  } catch {
    throw new Error("Location search is unavailable right now. Please try again.");
  } finally {
    clearTimeout(timer);
  }
}
