# Epic: Interactive Map

Display the GPS route on an interactive map with metric-based coloring and synchronized hover.

## Story: Render route polyline on MapLibre
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Build summary cards

#### Tasks
- [ ] Create `src/components/map/RunMap.tsx` using MapLibre GL JS
- [ ] Draw GPS records from the store as a polyline on the map
- [ ] Auto-zoom to fit entire route with padding on initial render
- [ ] Use OpenFreeMap or similar free tile source (no API key)

#### Acceptance Criteria
- `src/components/map/RunMap.tsx` renders a MapLibre map
- GPS records from the store are drawn as a polyline on the map
- Map auto-zooms to fit the entire route with padding on initial render
- Uses OpenFreeMap or similar free tile source (no API key)
- Map is interactive (pan, zoom)

- **Technical Notes:** Convert DataPoint lat/lon to GeoJSON LineString. Use `map.fitBounds()` for auto-fit.

## Story: Color route by metric
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Render route polyline on MapLibre

#### Tasks
- [ ] Create `src/components/map/MapControls.tsx` with metric selector dropdown
- [ ] Color route segments by selected metric using a gradient (green-yellow-red or similar)
- [ ] Add legend showing color scale with min/max values
- [ ] Default coloring to pace

#### Acceptance Criteria
- `src/components/map/MapControls.tsx` provides a metric selector dropdown
- Route segments are colored by the selected metric using a gradient (green-yellow-red or similar)
- A legend shows the color scale with min/max values
- Default coloring is by pace
- Changing the metric re-renders the route colors smoothly

## Story: Add start/finish markers and km markers
- **Status:** [x] done
- **Priority:** medium
- **Depends on:** Render route polyline on MapLibre

#### Tasks
- [ ] Add green marker at start point, red/checkered marker at finish point
- [ ] Place numbered km markers along the route at each kilometer
- [ ] Respect unit toggle (km vs mile markers)
- [ ] Prevent marker overlap/clutter at high zoom levels

#### Acceptance Criteria
- Green marker at start point, red/checkered marker at finish point
- Numbered km markers placed along the route at each kilometer
- Markers respect the unit toggle (km vs mile markers)
- Markers don't overlap or clutter at high zoom levels

## Story: Implement map-chart hover sync
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Color route by metric

#### Tasks
- [ ] Set `hoveredIndex` in Zustand store on route hover
- [ ] Show dot/marker on the map at hovered position
- [ ] Show crosshair on charts at corresponding data point
- [ ] Update map marker position on chart hover

#### Acceptance Criteria
- Hovering the route on the map sets `hoveredIndex` in the store
- A dot/marker appears on the map at the hovered position
- Charts show a crosshair at the corresponding data point
- Hovering a chart updates the map marker position
- Smooth performance with no visible lag

- **Technical Notes:** Throttle hover events to ~60fps. Use the playwright-cli skill to verify hover interaction between map and charts.
