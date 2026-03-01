import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useRunStore } from "@/store/useRunStore"

export function RunMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const records = useRunStore((state) => state.runData?.records)

  useEffect(() => {
    if (!mapContainerRef.current || !records || records.length === 0) return

    // Filter out records with invalid coordinates
    const validRecords = records.filter(
      (r) =>
        r.lat != null &&
        r.lon != null &&
        isFinite(r.lat) &&
        isFinite(r.lon) &&
        r.lat !== 0 &&
        r.lon !== 0
    )

    if (validRecords.length === 0) return

    const coordinates: [number, number][] = validRecords.map((r) => [
      r.lon,
      r.lat,
    ])

    // Compute bounds
    let minLon = Infinity
    let maxLon = -Infinity
    let minLat = Infinity
    let maxLat = -Infinity
    for (const [lon, lat] of coordinates) {
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }

    const bounds = new maplibregl.LngLatBounds(
      [minLon, minLat],
      [maxLon, maxLat]
    )

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      bounds,
      fitBoundsOptions: { padding: 50 },
    })

    map.addControl(new maplibregl.NavigationControl(), "top-right")

    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        },
      })

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 4,
        },
      })
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [records])

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[500px] rounded-lg border border-border"
      data-testid="run-map"
    />
  )
}
