import { useEffect, useMemo, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useRunStore } from "@/store/useRunStore"
import { buildLineGradient } from "@/lib/map-colors"

export function RunMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const records = useRunStore((state) => state.runData?.records)
  const mapMetric = useRunStore((state) => state.mapMetric)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Filter and prepare coordinates (stable across metric changes)
  const { validRecords, coordinates, bounds } = useMemo(() => {
    if (!records || records.length === 0)
      return { validRecords: [], coordinates: [] as [number, number][], bounds: null }

    const validRecords = records.filter(
      (r) =>
        r.lat != null &&
        r.lon != null &&
        isFinite(r.lat) &&
        isFinite(r.lon) &&
        r.lat !== 0 &&
        r.lon !== 0,
    )

    if (validRecords.length === 0)
      return { validRecords: [], coordinates: [] as [number, number][], bounds: null }

    const coordinates: [number, number][] = validRecords.map((r) => [r.lon, r.lat])

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

    const bounds = new maplibregl.LngLatBounds([minLon, minLat], [maxLon, maxLat])

    return { validRecords, coordinates, bounds }
  }, [records])

  // Create/destroy map when data changes
  useEffect(() => {
    if (!mapContainerRef.current || !coordinates.length || !bounds) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      bounds,
      fitBoundsOptions: { padding: 50 },
    })

    map.addControl(new maplibregl.NavigationControl(), "top-right")

    map.on("load", () => {
      setMapLoaded(true)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      setMapLoaded(false)
    }
  }, [coordinates, bounds])

  // Add/update route coloring when map loads or metric changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded || !coordinates.length) return

    // Remove existing route layer and source
    if (map.getLayer("route-line")) map.removeLayer("route-line")
    if (map.getSource("route")) map.removeSource("route")

    const gradient = buildLineGradient(validRecords, coordinates, mapMetric)

    map.addSource("route", {
      type: "geojson",
      lineMetrics: true,
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates,
        },
      },
    })

    const paint = gradient
      ? { "line-width": 4, "line-gradient": gradient as any }
      : { "line-color": "#3b82f6", "line-width": 4 }

    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint,
    })
  }, [mapLoaded, coordinates, validRecords, mapMetric])

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[500px] rounded-lg border border-border"
      data-testid="run-map"
    />
  )
}
