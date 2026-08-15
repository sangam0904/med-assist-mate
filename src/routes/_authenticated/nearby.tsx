import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertTriangle,
  Clock,
  Crosshair,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Search,
  Siren,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { geocodePlace, searchNearbyPlaces } from "@/lib/nearby.functions";
import {
  PLACE_CATEGORIES,
  RADIUS_OPTIONS,
  categoryLabel,
  directionsUrl,
  formatDistance,
  formatRadius,
  openStatus,
  type GeoPoint,
  type NearbyPlace,
  type PlaceCategory,
  type RadiusMeters,
} from "@/lib/nearby-types";

const NearbyMap = lazy(() => import("@/components/nearby/nearby-map"));

export const Route = createFileRoute("/_authenticated/nearby")({
  head: () => ({
    meta: [
      { title: "Find Care — Nearby Hospitals & Doctors | MedAssist AI" },
      {
        name: "description",
        content:
          "Find hospitals, doctors, clinics, pharmacies and emergency care near you on an interactive map, with distance, hours and directions.",
      },
      { property: "og:title", content: "Find Care — Nearby Hospitals & Doctors" },
      {
        property: "og:description",
        content:
          "Find hospitals, doctors, clinics, pharmacies and emergency care near you on an interactive map.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NearbyPage,
});

type LocState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "ready"; point: GeoPoint }
  | { status: "error"; message: string };

function NearbyPage() {
  const search = useServerFn(searchNearbyPlaces);
  const geocode = useServerFn(geocodePlace);

  const [loc, setLoc] = useState<LocState>({ status: "idle" });
  const [radius, setRadius] = useState<RadiusMeters>(5000);
  const [cats, setCats] = useState<PlaceCategory[]>(["hospital", "doctors", "clinic", "pharmacy"]);
  const [openOnly, setOpenOnly] = useState(false);
  const [places, setPlaces] = useState<NearbyPlace[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const reqRef = useRef(0);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLoc({ status: "error", message: "Your browser does not support location access." });
      return;
    }
    setLoc({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLoc({
          status: "ready",
          point: {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            label: "Your current location",
          },
        }),
      (err) =>
        setLoc({
          status: "error",
          message:
            err.code === err.PERMISSION_DENIED
              ? "Location permission was denied. Search for a city or area instead."
              : "We couldn't determine your location. Try searching for a city or area.",
        }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60_000 },
    );
  }, []);

  const point = loc.status === "ready" ? loc.point : null;

  // Debounced fetch whenever location / radius / categories change.
  useEffect(() => {
    if (!point || cats.length === 0) {
      if (cats.length === 0) setPlaces([]);
      return;
    }
    const id = ++reqRef.current;
    setLoading(true);
    setFetchError(null);
    const timer = setTimeout(() => {
      search({ data: { lat: point.lat, lon: point.lon, radius, categories: cats } })
        .then((result) => {
          if (reqRef.current !== id) return;
          setPlaces(result.places);
          if (result.truncated) toast.info("Showing the 120 closest results.");
        })
        .catch((error: unknown) => {
          if (reqRef.current !== id) return;
          const message =
            error instanceof Error ? error.message : "Could not load nearby healthcare.";
          setFetchError(message);
          setPlaces([]);
          toast.error(message);
        })
        .finally(() => {
          if (reqRef.current === id) setLoading(false);
        });
    }, 350);
    return () => clearTimeout(timer);
  }, [point?.lat, point?.lon, radius, cats, search]);

  async function handleManualSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      toast.error("Enter at least 2 characters to search for a place.");
      return;
    }
    setGeoBusy(true);
    try {
      const results = await geocode({ data: { query: q } });
      if (!results.length) {
        toast.error("No matching place found. Try a different city or area.");
        return;
      }
      const first = results[0]!;
      setLoc({ status: "ready", point: first });
      setActiveId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Location search failed.");
    } finally {
      setGeoBusy(false);
    }
  }

  const visible = useMemo(() => {
    const list = places ?? [];
    if (!openOnly) return list;
    return list.filter((p) => openStatus(p.openingHours)?.open === true);
  }, [places, openOnly]);

  const emergencyFirst = useMemo(
    () =>
      [...visible].sort((a, b) => {
        const ae = a.emergency || a.category === "emergency" ? 0 : 1;
        const be = b.emergency || b.category === "emergency" ? 0 : 1;
        return ae - be || a.distanceMeters - b.distanceMeters;
      }),
    [visible],
  );

  function toggleCat(id: PlaceCategory) {
    setCats((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Find care</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Nearby doctors & hospitals</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Your location is used only for this search — it is never saved to your account.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* LEFT: controls + results */}
        <div className="space-y-4">
          <section className="surface-card space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={requestLocation} disabled={loc.status === "locating"}>
                {loc.status === "locating" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Crosshair className="size-4" />
                )}
                Use my location
              </Button>
              {point && (
                <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-primary-soft px-3 py-1.5 text-xs text-primary">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{point.label ?? "Selected location"}</span>
                </span>
              )}
            </div>

            <form onSubmit={handleManualSearch} className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Or search a city, area or pincode"
                aria-label="Search a city, area or pincode"
                maxLength={120}
              />
              <Button type="submit" variant="outline" disabled={geoBusy}>
                {geoBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                <span className="sr-only sm:not-sr-only">Search</span>
              </Button>
            </form>

            {loc.status === "error" && (
              <p className="flex items-start gap-2 rounded-xl bg-risk-medium/15 px-3 py-2 text-xs text-foreground">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                {loc.message}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {PLACE_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCat(c.id)}
                  aria-pressed={cats.includes(c.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    cats.includes(c.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {c.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setOpenOnly((v) => !v)}
                aria-pressed={openOnly}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  openOnly
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                Open now
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Radius</span>
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadius(r)}
                  aria-pressed={radius === r}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                    radius === r
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {formatRadius(r)}
                </button>
              ))}
            </div>
          </section>

          <ResultList
            loading={loading}
            hasLocation={Boolean(point)}
            error={fetchError}
            places={emergencyFirst}
            activeId={activeId}
            onSelect={setActiveId}
            noCategories={cats.length === 0}
          />
        </div>

        {/* RIGHT: map */}
        <div className="surface-card order-first h-[320px] overflow-hidden p-1.5 sm:h-[420px] lg:order-none lg:sticky lg:top-6 lg:h-[calc(100vh-9rem)]">
          {point ? (
            <ClientOnly fallback={<MapSkeleton />}>
              <Suspense fallback={<MapSkeleton />}>
                <NearbyMap
                  center={point}
                  places={visible}
                  activeId={activeId}
                  onSelect={setActiveId}
                />
              </Suspense>
            </ClientOnly>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl bg-muted/40 p-6 text-center">
              <MapPin className="size-8 text-primary" />
              <p className="max-w-xs text-sm text-muted-foreground">
                Share your location or search for a place to see healthcare facilities on the map.
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Facility data from OpenStreetMap contributors. Details such as hours and phone numbers may
        be incomplete — always call ahead in an emergency.
      </p>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="flex h-full animate-pulse items-center justify-center rounded-2xl bg-muted/50">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}

function ResultList({
  loading,
  hasLocation,
  error,
  places,
  activeId,
  onSelect,
  noCategories,
}: {
  loading: boolean;
  hasLocation: boolean;
  error: string | null;
  places: NearbyPlace[];
  activeId: string | null;
  onSelect: (id: string) => void;
  noCategories: boolean;
}) {
  if (!hasLocation) return null;
  if (noCategories) {
    return (
      <p className="surface-card p-5 text-sm text-muted-foreground">
        Select at least one category to see results.
      </p>
    );
  }
  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="surface-card h-28 animate-pulse bg-muted/40 p-5" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <p className="surface-card flex items-start gap-2 p-5 text-sm text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-risk-high" />
        {error}
      </p>
    );
  }
  if (places.length === 0) {
    return (
      <p className="surface-card p-5 text-sm text-muted-foreground">
        No matching facilities found here. Try a larger radius, or turn off the “Open now” filter.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{places.length} places found</p>
      {places.map((place) => (
        <PlaceCard
          key={place.id}
          place={place}
          active={place.id === activeId}
          onSelect={() => onSelect(place.id)}
        />
      ))}
    </div>
  );
}

function PlaceCard({
  place,
  active,
  onSelect,
}: {
  place: NearbyPlace;
  active: boolean;
  onSelect: () => void;
}) {
  const status = openStatus(place.openingHours);
  const isEmergency = place.emergency || place.category === "emergency";

  return (
    <article
      onClick={onSelect}
      className={cn(
        "surface-card cursor-pointer p-4 transition-shadow hover:shadow-lift",
        active && "ring-2 ring-primary",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{place.name}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="capitalize">{categoryLabel(place.category)}</span>
            <span aria-hidden>·</span>
            <span>{formatDistance(place.distanceMeters)} away</span>
            {status && (
              <>
                <span aria-hidden>·</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    status.open ? "text-risk-low" : "text-risk-medium",
                  )}
                >
                  <Clock className="size-3" />
                  {status.text}
                </span>
              </>
            )}
          </p>
        </div>
        {isEmergency && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-risk-high px-2 py-1 text-[11px] font-semibold text-risk-high-foreground">
            <Siren className="size-3" /> Emergency
          </span>
        )}
      </div>

      {place.address && <p className="mt-2 text-xs text-muted-foreground">{place.address}</p>}

      {place.services.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {place.services.map((s) => (
            <li
              key={s}
              className="rounded-full bg-muted px-2 py-0.5 text-[11px] capitalize text-muted-foreground"
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" onClick={(e) => e.stopPropagation()}>
          <a href={directionsUrl(place)} target="_blank" rel="noopener noreferrer">
            <Navigation className="size-3.5" /> Directions
          </a>
        </Button>
        {place.phone && (
          <Button asChild size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
            <a href={`tel:${place.phone.replace(/\s+/g, "")}`}>
              <Phone className="size-3.5" /> Call
            </a>
          </Button>
        )}
        {place.website && (
          <Button asChild size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
            <a href={place.website} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" /> Website
            </a>
          </Button>
        )}
      </div>
    </article>
  );
}
