"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";

export type RunMapPoint = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: number;
};

function routeData(points: RunMapPoint[]) {
  const coordinates = points.map((point) => [point.longitude, point.latitude]);
  return {
    type: "FeatureCollection" as const,
    features: coordinates.length > 1 ? [{
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates },
    }] : [],
  };
}

export function LiveRunMap({ latestPoint, routePoints }: { latestPoint: RunMapPoint | null; routePoints: RunMapPoint[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const hasCentered = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let disposed = false;

    void import("maplibre-gl").then((maplibregl) => {
      if (disposed || !containerRef.current || mapRef.current) return;
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: [0, 18],
        zoom: 1.4,
        attributionControl: false,
        cooperativeGestures: false,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        if (disposed) return;
        map.addSource("runner-route", {
          type: "geojson",
          lineMetrics: true,
          data: routeData([]),
        });
        map.addLayer({
          id: "runner-route-glow",
          type: "line",
          source: "runner-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#ffffff", "line-width": 10, "line-opacity": 0.9 },
        });
        map.addLayer({
          id: "runner-route",
          type: "line",
          source: "runner-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-width": 6,
            "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "#2AABEE", 1, "#31D7A4"],
          },
        });
        setMapReady(true);
        setMapError(false);
        map.resize();
      });
      map.on("error", (event) => {
        console.error("[stride-map] map renderer failed", event.error ?? event);
        if (!map.isStyleLoaded()) setMapError(true);
      });
    }).catch((error) => {
      console.error("[stride-map] failed to load MapLibre", error);
      if (!disposed) setMapError(true);
    });

    return () => {
      disposed = true;
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource<GeoJSONSource>("runner-route");
    source?.setData(routeData(routePoints));
    if (!latestPoint) return;

    const position: [number, number] = [latestPoint.longitude, latestPoint.latitude];
    if (!markerRef.current) {
      const markerNode = document.createElement("div");
      markerNode.className = "runner-map-marker";
      markerNode.setAttribute("aria-label", "Current runner location");
      void import("maplibre-gl").then((maplibregl) => {
        if (!mapRef.current || markerRef.current) return;
        markerRef.current = new maplibregl.Marker({ element: markerNode }).setLngLat(position).addTo(mapRef.current);
      });
    } else {
      markerRef.current.setLngLat(position);
    }
    map.easeTo({ center: position, zoom: hasCentered.current ? Math.max(map.getZoom(), 15.5) : 16, duration: 700 });
    hasCentered.current = true;
  }, [latestPoint, routePoints, mapReady]);

  function recenter() {
    const map = mapRef.current;
    if (!map || !latestPoint) return;
    map.easeTo({ center: [latestPoint.longitude, latestPoint.latitude], zoom: 16, duration: 600 });
  }

  return <div className="live-run-map-shell">
    <div ref={containerRef} className="live-run-map-canvas" aria-label="Live running map" />
    {!mapReady && !mapError && <div className="map-state-card"><span className="map-state-spinner" />Loading live map…</div>}
    {mapReady && !latestPoint && <div className="map-state-card map-ready-card"><span className="map-ready-dot" />Map ready · waiting for GPS</div>}
    {mapError && <div className="map-state-card map-error-card">Map tiles unavailable · GPS tracking continues</div>}
    <button className="map-recenter" onClick={recenter} disabled={!latestPoint} aria-label="Recenter map on your location">⌖</button>
  </div>;
}
