/** Browser-safe types + helpers for the Find Care (nearby healthcare) feature. */

export const PLACE_CATEGORIES = [
  { id: "hospital", label: "Hospitals" },
  { id: "doctors", label: "Doctors" },
  { id: "clinic", label: "Clinics" },
  { id: "pharmacy", label: "Pharmacies" },
  { id: "emergency", label: "Emergency" },
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number]["id"];

export const RADIUS_OPTIONS = [1000, 5000, 10000, 25000] as const;
export type RadiusMeters = (typeof RADIUS_OPTIONS)[number];

export type NearbyPlace = {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lon: number;
  distanceMeters: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  emergency: boolean;
  services: string[];
};

export type NearbyResult = {
  places: NearbyPlace[];
  truncated: boolean;
};

export type GeoPoint = { lat: number; lon: number; label?: string };

export function formatDistance(meters: number): string {
  if (meters < 950) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

export function formatRadius(meters: number): string {
  return `${meters / 1000} km`;
}

export function categoryLabel(id: PlaceCategory): string {
  return PLACE_CATEGORIES.find((c) => c.id === id)?.label.replace(/s$/, "") ?? id;
}

/**
 * Best-effort "open now" check for OSM `opening_hours` strings.
 * Returns null when the value is absent or too complex to parse safely.
 */
export function openStatus(
  openingHours: string | null,
  now: Date = new Date(),
): { open: boolean; text: string } | null {
  if (!openingHours) return null;
  const value = openingHours.trim().toLowerCase();
  if (value === "24/7") return { open: true, text: "Open 24/7" };

  const days = ["su", "mo", "tu", "we", "th", "fr", "sa"];
  const today = days[now.getDay()]!;
  const minutes = now.getHours() * 60 + now.getMinutes();

  let matched = false;
  let open = false;

  for (const rule of value.split(";")) {
    const part = rule.trim();
    if (!part) continue;
    const m = part.match(
      /^((?:[a-z]{2}(?:-[a-z]{2})?)(?:,[a-z]{2}(?:-[a-z]{2})?)*)?\s*([0-9:,\s-]+)$/,
    );
    if (!m) continue;
    const [, dayspec, timespec] = m;

    if (dayspec) {
      const inDays = dayspec.split(",").some((token) => {
        if (token.includes("-")) {
          const [a, b] = token.split("-");
          const ai = days.indexOf(a!);
          const bi = days.indexOf(b!);
          const ti = days.indexOf(today);
          if (ai < 0 || bi < 0) return false;
          return ai <= bi ? ti >= ai && ti <= bi : ti >= ai || ti <= bi;
        }
        return token === today;
      });
      if (!inDays) continue;
    }

    for (const span of timespec!.split(",")) {
      const t = span.trim().match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
      if (!t) continue;
      matched = true;
      const from = Number(t[1]) * 60 + Number(t[2]);
      const toRaw = Number(t[3]) * 60 + Number(t[4]);
      const to = toRaw <= from ? toRaw + 1440 : toRaw;
      if (minutes >= from && minutes <= to) open = true;
    }
  }

  if (!matched) return null;
  return { open, text: open ? "Open now" : "Closed now" };
}

export function directionsUrl(place: { lat: number; lon: number; name: string }): string {
  return `https://www.openstreetmap.org/directions?to=${place.lat}%2C${place.lon}`;
}
