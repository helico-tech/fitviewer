# Epic: Dashboard Summary

Display key run statistics in summary cards with unit toggling and run metadata.

## Story: Build summary cards
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Implement tab navigation layout

#### Tasks
- [ ] Create `SummaryCards.tsx` with six shadcn Card components
- [ ] Display: Distance, Duration, Avg Pace, Avg Heart Rate, Calories, Elevation Gain
- [ ] Read data from the Zustand store's `runData.summary`
- [ ] Format values correctly (pace as "5:23 /km", distance as "10.2 km", duration as "52:14")

#### Acceptance Criteria
- Six cards rendered: Distance, Duration, Avg Pace, Avg Heart Rate, Calories, Elevation Gain
- Cards read data from the Zustand store's `runData.summary`
- Values are formatted correctly (e.g., pace as "5:23 /km", distance as "10.2 km", duration as "52:14")
- Cards use shadcn Card with clear labels and large values

## Story: Add run header with title and date
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build summary cards

#### Tasks
- [ ] Create `RunHeader.tsx` showing formatted date (e.g., "Saturday, March 1, 2026 — 7:32 AM")
- [ ] Add "Load new file" button that resets state and returns to drop zone
- [ ] Position header above the tab navigation

#### Acceptance Criteria
- Displays formatted date: e.g., "Saturday, March 1, 2026 — 7:32 AM"
- Shows a "Load new file" button that resets state and returns to drop zone
- Header is positioned above the tab navigation

## Story: Implement pace unit toggle
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build summary cards

#### Tasks
- [ ] Add toggle switch in the header for km/mi
- [ ] Create `src/lib/units.ts` with `formatPace()`, `formatDistance()`, `convertPace()` helpers
- [ ] Wire toggle to update all summary cards, charts, and split tables
- [ ] Store unit preference in the Zustand store

#### Acceptance Criteria
- Toggle switch in the header for km/mi
- `src/lib/units.ts` exports: `formatPace(secPerKm, unit)`, `formatDistance(meters, unit)`, `convertPace(secPerKm, unit)`
- Toggling updates all summary cards, charts, and split tables
- Unit preference is stored in the Zustand store

- **Technical Notes:** Use the playwright-cli skill to verify toggling the unit switch updates displayed values.

## Story: Add dark/light mode toggle
- **Status:** [ ] todo
- **Priority:** medium
- **Depends on:** Implement tab navigation layout

#### Tasks
- [ ] Add theme toggle button in the header
- [ ] Implement class-based dark mode with Tailwind and shadcn theming
- [ ] Ensure map and chart components adapt to the theme
- [ ] Persist theme preference via localStorage

#### Acceptance Criteria
- Toggle button in the header switches between light and dark mode
- All shadcn components respect the theme
- Map and chart components adapt to the theme
- Theme preference persists via localStorage

- **Technical Notes:** Use the playwright-cli skill to screenshot both themes and verify contrast.
