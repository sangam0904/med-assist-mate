import { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";

type Coords = { lat: number; lng: number };

const FALLBACK: Coords = { lat: 28.6139, lng: 77.209 };

export function NearbyMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "denied">("locating");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
        [FALLBACK.lat, FALLBACK.lng],
        12,
      );
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      mapRef.current = map;
      locate();
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function place(next: Coords) {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    map.setView([next.lat, next.lng], 14);
    if (markerRef.current) {
      markerRef.current.setLatLng([next.lat, next.lng]);
    } else {
      markerRef.current = L.circleMarker([next.lat, next.lng], {
        radius: 9,
        color: "#0e7490",
        fillColor: "#22d3ee",
        fillOpacity: 0.9,
        weight: 3,
      })
        .addTo(map)
        .bindPopup("You are here");
    }
    setCoords(next);
  }

  function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus("idle");
        place({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const hospitalsUrl = coords
    ? `https://www.openstreetmap.org/search?query=hospital#map=15/${coords.lat}/${coords.lng}`
    : "https://www.openstreetmap.org/search?query=hospital";

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
        <div>
          <h2 className="text-base font-semibold">Your location</h2>
          <p className="text-xs text-muted-foreground">
            {status === "locating"
              ? "Finding your location…"
              : status === "denied"
                ? "Location blocked — showing a default area. Allow location access to pinpoint you."
                : coords
                  ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} — share this with emergency services.`
                  : "Live map of where you are right now."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={locate}>
            <Crosshair className="size-4" /> Locate me
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <a href={hospitalsUrl} target="_blank" rel="noreferrer">
              <MapPin className="size-4" /> Hospitals nearby
            </a>
          </Button>
        </div>
      </div>
      <div
        ref={containerRef}
        role="application"
        aria-label="Map showing your current location"
        className="h-72 w-full sm:h-80"
      />
    </section>
  );
}
