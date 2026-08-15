import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NearbyPlace } from "@/lib/nearby-types";
import { categoryLabel, formatDistance } from "@/lib/nearby-types";
import { useTheme } from "@/components/theme-provider";

function pin(color: string, pulse = false) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};box-shadow:0 0 0 4px ${color}33,0 2px 6px rgba(0,0,0,.35);${
      pulse ? "outline:2px solid #fff;outline-offset:-1px;" : ""
    }"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const COLORS: Record<string, string> = {
  hospital: "#0f766e",
  doctors: "#2563eb",
  clinic: "#7c3aed",
  pharmacy: "#059669",
  emergency: "#dc2626",
};

export default function NearbyMap({
  center,
  places,
  activeId,
  onSelect,
}: {
  center: { lat: number; lon: number };
  places: NearbyPlace[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const { theme } = useTheme();

  const tileUrl = useMemo(
    () =>
      theme === "dark"
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    [theme],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true });
    map.setView([center.lat, center.lon], 14);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tile layer (re-created on theme change)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map);
    tiles.bringToBack();
    return () => {
      tiles.remove();
    };
  }, [tileUrl]);

  // Markers
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    markersRef.current.clear();

    L.circleMarker([center.lat, center.lon], {
      radius: 7,
      color: "#0ea5e9",
      fillColor: "#0ea5e9",
      fillOpacity: 0.9,
      weight: 2,
    })
      .bindPopup("You are here")
      .addTo(layer);

    const bounds = L.latLngBounds([[center.lat, center.lon]]);

    for (const place of places) {
      const marker = L.marker([place.lat, place.lon], {
        icon: pin(COLORS[place.category] ?? "#0f766e"),
        title: place.name,
      })
        .bindPopup(
          `<strong>${place.name.replace(/</g, "&lt;")}</strong><br/>${categoryLabel(
            place.category,
          )} · ${formatDistance(place.distanceMeters)}`,
        )
        .on("click", () => onSelect(place.id))
        .addTo(layer);
      markersRef.current.set(place.id, marker);
      bounds.extend([place.lat, place.lon]);
    }

    if (places.length) map.fitBounds(bounds.pad(0.15), { maxZoom: 16 });
    else map.setView([center.lat, center.lon], 14);
  }, [places, center.lat, center.lon, onSelect]);

  // Focus selected place
  useEffect(() => {
    if (!activeId) return;
    const marker = markersRef.current.get(activeId);
    const map = mapRef.current;
    if (!marker || !map) return;
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15), { animate: true });
    marker.openPopup();
  }, [activeId]);

  return <div ref={containerRef} className="h-full w-full rounded-2xl" />;
}
