import { useEffect, useMemo, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useRunStore } from "@/store/useRunStore"
import { buildLineGradient } from "@/lib/map-colors"
import { computeDistanceMarkers } from "@/lib/map-markers"
import { computeSplits } from "@/lib/calculations"
import type { Lap } from "@/types/run"

const METERS_PER_KM = 1000
const METERS_PER_MILE = 1609.34

/** Cycling color palette for lap/split segments */
const SEGMENT_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#a855f7", // purple
  "#f97316", // orange
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#eab308", // yellow
]

export function RunMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const records = useRunStore((state) => state.runData?.records)
  const mapMetric = useRunStore((state) => state.mapMetric)
  const unitSystem = useRunStore((state) => state.unitSystem)
  const setHoveredIndex = useRunStore((state) => state.setHoveredIndex)
  const selectedSplitIndex = useRunStore((state) => state.selectedSplitIndex)
  const mapOverlayMode = useRunStore((state) => state.mapOverlayMode)
  const laps = useRunStore((state) => state.runData?.laps)
  const overlayMarkersRef = useRef<maplibregl.Marker[]>([])
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
      overlayMarkersRef.current.forEach((m) => m.remove())
      overlayMarkersRef.current = []
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

  // Highlight selected split segment on the map
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded || !records || records.length < 2) return

    // Remove previous highlight layer/source
    if (map.getLayer("highlight-line")) map.removeLayer("highlight-line")
    if (map.getSource("highlight")) map.removeSource("highlight")

    if (selectedSplitIndex == null) return

    const splits = computeSplits(records, unitSystem)
    const split = splits[selectedSplitIndex]
    if (!split) return

    // Extract coordinates for the split segment from records
    const segmentCoords: [number, number][] = []
    for (let i = split.startIndex; i <= split.endIndex; i++) {
      const r = records[i]
      if (
        r.lat != null &&
        r.lon != null &&
        isFinite(r.lat) &&
        isFinite(r.lon) &&
        r.lat !== 0 &&
        r.lon !== 0
      ) {
        segmentCoords.push([r.lon, r.lat])
      }
    }

    if (segmentCoords.length < 2) return

    map.addSource("highlight", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: segmentCoords,
        },
      },
    })

    map.addLayer({
      id: "highlight-line",
      type: "line",
      source: "highlight",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#f59e0b",
        "line-width": 8,
        "line-opacity": 0.8,
      },
    })

    // Pan/zoom to the selected segment
    let minLon = Infinity
    let maxLon = -Infinity
    let minLat = Infinity
    let maxLat = -Infinity
    for (const [lon, lat] of segmentCoords) {
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }
    const segmentBounds = new maplibregl.LngLatBounds(
      [minLon, minLat],
      [maxLon, maxLat],
    )
    map.fitBounds(segmentBounds, { padding: 80, maxZoom: 17 })

    return () => {
      if (map.getLayer("highlight-line")) map.removeLayer("highlight-line")
      if (map.getSource("highlight")) map.removeSource("highlight")
    }
  }, [mapLoaded, selectedSplitIndex, records, unitSystem])

  // Lap/split segment overlay
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded || !records || records.length < 2) return

    // Clean up previous overlay layers, sources, and markers
    const cleanupOverlay = () => {
      // Remove segment layers and sources
      let i = 0
      while (true) {
        const layerId = `overlay-segment-${i}`
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId)
          map.removeSource(layerId)
          i++
        } else {
          break
        }
      }
      // Remove boundary markers
      overlayMarkersRef.current.forEach((m) => m.remove())
      overlayMarkersRef.current = []
    }

    cleanupOverlay()

    if (mapOverlayMode === "none") return

    // Get segments based on overlay mode
    type Segment = { startIndex: number; endIndex: number; label: string }
    let segments: Segment[] = []

    if (mapOverlayMode === "splits") {
      const splits = computeSplits(records, unitSystem)
      segments = splits.map((s) => ({
        startIndex: s.startIndex,
        endIndex: s.endIndex,
        label: `${unitSystem === "metric" ? "km" : "mi"} ${s.number}`,
      }))
    } else if (mapOverlayMode === "laps" && laps && laps.length > 0) {
      segments = laps.map((lap: Lap, idx: number) => ({
        startIndex: lap.startIndex,
        endIndex: lap.endIndex,
        label: `Lap ${idx + 1}`,
      }))
    }

    if (segments.length === 0) return

    // Draw each segment as a colored line
    segments.forEach((seg, idx) => {
      const segCoords: [number, number][] = []
      for (let j = seg.startIndex; j <= seg.endIndex && j < records.length; j++) {
        const r = records[j]
        if (
          r.lat != null &&
          r.lon != null &&
          isFinite(r.lat) &&
          isFinite(r.lon) &&
          r.lat !== 0 &&
          r.lon !== 0
        ) {
          segCoords.push([r.lon, r.lat])
        }
      }
      if (segCoords.length < 2) return

      const layerId = `overlay-segment-${idx}`
      const color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length]

      map.addSource(layerId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: segCoords },
        },
      })

      map.addLayer({
        id: layerId,
        type: "line",
        source: layerId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": color, "line-width": 6, "line-opacity": 0.85 },
      })
    })

    // Add boundary markers at segment starts (skip the first since it's the route start)
    segments.forEach((seg, idx) => {
      if (idx === 0) return // skip first boundary (it's the start marker)
      const r = records[seg.startIndex]
      if (
        !r ||
        r.lat == null ||
        r.lon == null ||
        !isFinite(r.lat) ||
        !isFinite(r.lon) ||
        r.lat === 0 ||
        r.lon === 0
      )
        return

      const el = document.createElement("div")
      el.className = "lap-boundary-marker"
      el.setAttribute("data-testid", `boundary-marker-${idx}`)
      el.style.cssText =
        "width:10px;height:10px;border-radius:50%;background:white;border:2px solid #374151;box-shadow:0 1px 3px rgba(0,0,0,0.3);"

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([r.lon, r.lat])
        .setPopup(new maplibregl.Popup({ offset: 8 }).setText(seg.label))
        .addTo(map)

      overlayMarkersRef.current.push(marker)
    })

    return cleanupOverlay
  }, [mapLoaded, mapOverlayMode, records, laps, unitSystem])

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[500px] rounded-lg border border-border"
      data-testid="run-map"
    />
  )
}
