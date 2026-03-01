# Epic: Charts & Graphs

Build time-series charts for pace, heart rate, elevation, and cadence with shared controls and synchronized hover.

## Story: Build pace chart
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Build summary cards

#### Tasks
- [ ] Create `src/components/charts/PaceChart.tsx` using Recharts LineChart
- [ ] X-axis: distance (km or miles), Y-axis: pace (min/km or min/mile)
- [ ] Invert Y-axis (faster pace = higher, running convention)
- [ ] Smooth data with rolling average (default window size)
- [ ] Create `src/lib/smoothing.ts` with `rollingAverage(data, windowSize)` utility

#### Acceptance Criteria
- `src/components/charts/PaceChart.tsx` renders a Recharts LineChart
- X-axis shows distance (km or miles), Y-axis shows pace (min/km or min/mile)
- Y-axis is inverted (faster pace = higher on chart, running convention)
- Data is smoothed with a rolling average (default window size)
- Chart is responsive and resizes with its container

- **Technical Notes:** Create `src/lib/smoothing.ts` with `rollingAverage(data, windowSize)` utility.

## Story: Build heart rate chart
- **Status:** [~] in-progress
- **Priority:** high
- **Depends on:** Build pace chart

#### Tasks
- [ ] Create `src/components/charts/HeartRateChart.tsx` rendering HR as a line chart
- [ ] Match X-axis with pace chart (distance or time)
- [ ] Render zone background bands as colored rectangles behind the line (if zones configured)
- [ ] Apply same smoothing as other charts

#### Acceptance Criteria
- `src/components/charts/HeartRateChart.tsx` renders HR as a line chart
- X-axis matches the pace chart (distance or time)
- Zone background bands are rendered as colored rectangles behind the line (if zones are configured)
- Y-axis shows BPM
- Chart applies the same smoothing as other charts

## Story: Build elevation profile and cadence chart
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build pace chart

#### Tasks
- [ ] Create `ElevationChart.tsx` as a filled area chart over distance
- [ ] Create `CadenceChart.tsx` as a line chart over distance
- [ ] Share the same X-axis scale as pace and HR charts
- [ ] Make both charts responsive

#### Acceptance Criteria
- `ElevationChart.tsx` renders altitude as a filled area chart over distance
- `CadenceChart.tsx` renders cadence (spm) as a line chart over distance
- Both charts share the same X-axis scale as pace and HR charts
- Both charts are responsive

## Story: Add chart axis toggle and controls
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build elevation profile and cadence chart

#### Tasks
- [ ] Create `ChartControls.tsx` with X-axis toggle (distance vs elapsed time)
- [ ] Add smoothing slider to adjust rolling average window (1-30 data points)
- [ ] Place controls above the chart area
- [ ] Store X-axis preference and smoothing value in Zustand store

#### Acceptance Criteria
- Toggle switches X-axis between distance and elapsed time on all charts simultaneously
- Smoothing slider adjusts the rolling average window (e.g., 1-30 data points)
- Controls are placed above the chart area
- X-axis preference and smoothing value stored in Zustand store

- **Technical Notes:** Use the playwright-cli skill to verify that toggling the X-axis updates all charts and that the smoothing slider visually affects chart lines.

## Story: Implement crosshair sync across charts
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Add chart axis toggle and controls

#### Tasks
- [ ] Set `hoveredIndex` in Zustand store on chart hover
- [ ] Render vertical crosshair line and tooltip on all other charts at same index
- [ ] Include the value for each chart's metric at the hovered point
- [ ] Clear crosshair on all charts when mouse leaves

#### Acceptance Criteria
- Hovering one chart sets `hoveredIndex` in the store
- All other charts render a vertical crosshair line and tooltip at the same index
- Crosshair includes the value for that chart's metric at the hovered point
- Moving the mouse smoothly updates all charts without lag
- Moving the mouse off a chart clears the crosshair on all charts
