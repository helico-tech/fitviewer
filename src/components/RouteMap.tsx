import React from "react";
import { Map, Source, Layer } from "@vis.gl/react-maplibre";
import type { LayerSpecification } from "maplibre-gl";
import type { ActivityRecord } from "../types/activity";
import "./RouteMap.css";

/**
 * Filter records with valid GPS data and return [lng, lat] tuples (GeoJSON order).
 */
export function recordsToCoords(
  records: ActivityRecord[]
): [number, number][] {
  return records
    .filter(
      (r): r is ActivityRecord & { positionLat: number; positionLong: number } =>
        r.positionLat !== null && r.positionLong !== null
    )
    .map((r) => [r.positionLong, r.positionLat]);
}

/**
 * Compute bounding box from an array of [lng, lat] coordinates.
 */
export function computeBounds(
  coords: [number, number][]
): { minLng: number; minLat: number; maxLng: number; maxLat: number } {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return { minLng, minLat, maxLng, maxLat };
}

const routeLayerStyle: LayerSpecification = {
  id: "route-line",
  type: "line",
  source: "route",
  paint: {
    "line-color": "#00ffaa",
    "line-width": 2.5,
    "line-opacity": 0.85,
  },
};

export function RouteMap({ records }: { records: ActivityRecord[] }) {
  const coords = recordsToCoords(records);

  if (coords.length < 2) {
    return null;
  }

  const bounds = computeBounds(coords);

  const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: coords,
    },
  };

  return (
    <div className="route-map">
      <Map
        initialViewState={{
          bounds: [
            [bounds.minLng, bounds.minLat],
            [bounds.maxLng, bounds.maxLat],
          ],
          fitBoundsOptions: { padding: 30 },
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <Source id="route" type="geojson" data={geojson}>
          <Layer {...routeLayerStyle} />
        </Source>
      </Map>
    </div>
  );
}
