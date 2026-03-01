import { useEffect, useMemo, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useRunStore } from "@/store/useRunStore"
import { buildLineGradient } from "@/lib/map-colors"
import { computeDistanceMarkers } from "@/lib/map-markers"

const METERS_PER_KM = 1000
const METERS_PER_MILE = 1609.34

export function RunMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const records = useRunStore((state) => state.runData?.records)
  const mapMetric = useRunStore((state) => state.mapMetric)
  const unitSystem = useRunStore((state) => state.unitSystem)
  const setHoveredIndex = useRunStore((state) => state.setHoveredIndex)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Filter and prepare coordinates (stable across metric changes)
  const { validRecords, validRecordIndices, coordinates, bounds } = useMemo(() => {
    if (!records || records.length === 0)
      return { validRecords: [], validRecordIndices: [] as number[], coordinates: [] as [number, number][], bounds: null }

    const validRecords: typeof records = []
    const validRecordIndices: number[] = []

    for (let i = 0; i < records.length; i++) {
      const r = records[i]
      if (
        r.lat != null &&
        r.lon != null &&
        isFinite(r.lat) &&
        isFinite(r.lon) &&
        r.lat !== 0 &&
        r.lon !== 0
      ) {
        validRecords.push(r)
        validRecordIndices.push(i)
      }
    }

    if (validRecords.length === 0)
      return { validRecords: [], validRecordIndices: [] as number[], coordinates: [] as [number, number][], bounds: null }

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

    return { validRecords, validRecordIndices, coordinates, bounds }
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
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
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

  // Add start/finish markers and distance markers
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded || validRecords.length === 0) return

    // Remove previous markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    // Remove previous km marker layers/source
    if (map.getLayer("km-markers-text")) map.removeLayer("km-markers-text")
    if (map.getLayer("km-markers-circle")) map.removeLayer("km-markers-circle")
    if (map.getSource("km-markers")) map.removeSource("km-markers")

    const start = validRecords[0]
    const finish = validRecords[validRecords.length - 1]

    // Start marker (green circle)
    const startEl = document.createElement("div")
    startEl.className = "start-marker"
    startEl.setAttribute("data-testid", "start-marker")
    startEl.style.cssText =
      "width:16px;height:16px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);cursor:pointer;"
    const startMarker = new maplibregl.Marker({ element: startEl })
      .setLngLat([start.lon, start.lat])
      .setPopup(new maplibregl.Popup({ offset: 10 }).setText("Start"))
      .addTo(map)
    markersRef.current.push(startMarker)

    // Finish marker (red square / checkered flag style)
    const finishEl = document.createElement("div")
    finishEl.className = "finish-marker"
    finishEl.setAttribute("data-testid", "finish-marker")
    finishEl.style.cssText =
      "width:16px;height:16px;border-radius:2px;background:#ef4444;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);cursor:pointer;"
    const finishMarker = new maplibregl.Marker({ element: finishEl })
      .setLngLat([finish.lon, finish.lat])
      .setPopup(new maplibregl.Popup({ offset: 10 }).setText("Finish"))
      .addTo(map)
    markersRef.current.push(finishMarker)

    // Distance markers (km or mile)
    const interval = unitSystem === "imperial" ? METERS_PER_MILE : METERS_PER_KM
    const distanceMarkers = computeDistanceMarkers(validRecords, interval)

    if (distanceMarkers.length > 0) {
      const features = distanceMarkers.map((dm) => ({
        type: "Feature" as const,
        properties: { label: String(dm.number) },
        geometry: {
          type: "Point" as const,
          coordinates: [dm.lon, dm.lat],
        },
      }))

      map.addSource("km-markers", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features,
        },
      })

      // White circle background
      map.addLayer({
        id: "km-markers-circle",
        type: "circle",
        source: "km-markers",
        paint: {
          "circle-radius": 10,
          "circle-color": "#ffffff",
          "circle-stroke-color": "#6b7280",
          "circle-stroke-width": 1.5,
        },
      })

      // Number label
      map.addLayer({
        id: "km-markers-text",
        type: "symbol",
        source: "km-markers",
        layout: {
          "text-field": ["get", "label"],
          "text-size": 11,
          "text-font": ["Open Sans Bold"],
          "text-allow-overlap": false,
          "icon-allow-overlap": false,
        },
        paint: {
          "text-color": "#374151",
        },
      })
    }
  }, [mapLoaded, validRecords, unitSystem])

  // Hover interaction: mousemove on route sets hoveredIndex
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded || validRecords.length === 0) return

    const onRouteMouseMove = (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat
      let minDist = Infinity
      let nearestIdx = 0
      for (let i = 0; i < validRecords.length; i++) {
        const dlng = validRecords[i].lon - lng
        const dlat = validRecords[i].lat - lat
        const d = dlng * dlng + dlat * dlat
        if (d < minDist) {
          minDist = d
          nearestIdx = i
        }
      }
      setHoveredIndex(validRecordIndices[nearestIdx])
    }

    const onRouteMouseLeave = () => {
      setHoveredIndex(null)
    }

    const onRouteMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer"
    }

    const onRouteCursorLeave = () => {
      map.getCanvas().style.cursor = ""
    }

    map.on("mousemove", "route-line", onRouteMouseMove)
    map.on("mouseleave", "route-line", onRouteMouseLeave)
    map.on("mouseenter", "route-line", onRouteMouseEnter)
    map.on("mouseleave", "route-line", onRouteCursorLeave)

    return () => {
      map.off("mousemove", "route-line", onRouteMouseMove)
      map.off("mouseleave", "route-line", onRouteMouseLeave)
      map.off("mouseenter", "route-line", onRouteMouseEnter)
      map.off("mouseleave", "route-line", onRouteCursorLeave)
    }
  }, [mapLoaded, validRecords, validRecordIndices, setHoveredIndex])

  // Hover marker: imperatively update marker position from store
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded || !records) return

    let marker: maplibregl.Marker | null = null

    const unsub = useRunStore.subscribe((state) => {
      const idx = state.hoveredIndex
      if (idx != null && idx >= 0 && idx < records.length) {
        const r = records[idx]
        if (
          r.lat != null &&
          r.lon != null &&
          isFinite(r.lat) &&
          isFinite(r.lon) &&
          r.lat !== 0 &&
          r.lon !== 0
        ) {
          if (!marker) {
            const el = document.createElement("div")
            el.setAttribute("data-testid", "hover-marker")
            el.style.cssText =
              "width:12px;height:12px;border-radius:50%;background:white;border:2px solid #3b82f6;box-shadow:0 1px 4px rgba(0,0,0,0.3);pointer-events:none;"
            marker = new maplibregl.Marker({ element: el })
              .setLngLat([r.lon, r.lat])
              .addTo(map)
          } else {
            marker.setLngLat([r.lon, r.lat])
          }
          return
        }
      }
      // Clear marker
      if (marker) {
        marker.remove()
        marker = null
      }
    })

    return () => {
      unsub()
      if (marker) marker.remove()
    }
  }, [mapLoaded, records])

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[500px] rounded-lg border border-border"
      data-testid="run-map"
    />
  )
}
