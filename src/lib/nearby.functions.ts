import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildOverpassQuery,
  parseOverpassElements,
  geocodeQuery,
} from "@/lib/nearby.server";

const CATEGORY = z.enum(["hospital", "doctors", "clinic", "pharmacy", "emergency"]);

const SearchInput = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  radius: z.number().int().min(500).max(25000),
  categories: z.array(CATEGORY).min(1).max(5),
});

/**
 * Nearby healthcare search via OpenStreetMap Overpass API.
 * Coordinates are used for this request only — nothing is persisted server-side.
 */
export const searchNearbyPlaces = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SearchInput.parse(input))
  .handler(async ({ data }) => {
    const query = buildOverpassQuery(data.lat, data.lon, data.radius, data.categories);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "MedAssistAI/1.0 (healthcare finder)",
        },
        body: new URLSearchParams({ data: query }).toString(),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Map data service returned ${res.status}`);
      const json = (await res.json()) as { elements?: unknown };
      return parseOverpassElements(json.elements, data.lat, data.lon, data.radius);
    } catch {
      throw new Error("Could not reach the map data service. Please try again.");
    } finally {
      clearTimeout(timer);
    }
  });

const GeocodeInput = z.object({ query: z.string().trim().min(2).max(120) });

/** Manual place lookup (fallback when location permission is denied). */
export const geocodePlace = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GeocodeInput.parse(input))
  .handler(async ({ data }) => geocodeQuery(data.query));
