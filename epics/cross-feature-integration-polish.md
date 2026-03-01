# Epic: Cross-Feature Integration & Polish

Wire up cross-cutting interactions, synchronization, and visual polish across all features.

## Story: Implement highlight split on map
- **Status:** [x] done
- **Priority:** medium
- **Depends on:** Build auto splits table, Render route polyline on MapLibre

#### Tasks
- [ ] Highlight corresponding route segment on split row click with distinct color/thickness
- [ ] Pan/zoom map to show the selected segment
- [ ] Support changing highlight by clicking another row
- [ ] Clear highlight when switching away from the Splits tab

#### Acceptance Criteria
- Clicking a split row highlights the corresponding route segment on the map with a distinct color/thickness
- Map pans/zooms to show the selected segment
- Clicking again or clicking another row changes the highlight
- Highlight clears when switching away from the Splits tab

## Story: Add lap segments on map
- **Status:** [~] in-progress
- **Priority:** medium
- **Depends on:** Render route polyline on MapLibre, Build manual laps table

#### Tasks
- [ ] Show lap boundaries as markers or segment breaks on the route
- [ ] Make each lap segment visually distinguishable
- [ ] Toggle between auto splits and manual laps to update map markers

#### Acceptance Criteria
- Lap boundaries are shown as markers or segment breaks on the route
- Each lap segment is visually distinguishable
- Toggling between auto splits and manual laps updates the map markers

## Story: End-to-end UI testing with Playwright
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build zone distribution bar and time table, Add split comparison bar chart and best/worst badges, Implement crosshair sync across charts

#### Tasks
- [ ] Test: load sample file via "Try with sample data" button, verify summary cards render
- [ ] Test: navigate all tabs and verify content renders
- [ ] Test: toggle unit system and verify values update
- [ ] Test: toggle dark/light mode and verify theme changes
- [ ] Test: verify charts render with data (check for SVG elements)
- [ ] Test: verify map renders with a route (check for canvas element)
- [ ] Ensure all tests pass in CI-compatible headless mode

#### Acceptance Criteria
- Test: load sample file via "Try with sample data" button, verify summary cards render with valid values
- Test: navigate all tabs (Overview, Map, Charts, Splits, Zones) and verify content renders
- Test: toggle unit system and verify values update
- Test: toggle dark/light mode and verify theme changes
- Test: verify charts render with data (check for SVG elements)
- Test: verify map renders with a route (check for canvas element)
- All tests pass in CI-compatible headless mode

- **Technical Notes:** Use the playwright-cli skill for all test creation and execution.
