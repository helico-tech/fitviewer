# Epic: Splits & Laps

Display auto-splits and manual laps in tables with visual comparison.

## Story: Build auto splits table
- **Status:** [~] in-progress
- **Priority:** high
- **Depends on:** Build summary cards

#### Tasks
- [ ] Create `src/components/splits/SplitsTable.tsx` with shadcn Table
- [ ] Compute per-km (or per-mile) splits from record data based on cumulative distance
- [ ] Display columns: Split #, Distance, Pace, Avg HR, Avg Cadence, Elevation +/-, Time
- [ ] Add split computation logic to `src/lib/calculations.ts`
- [ ] Respect unit toggle (km vs mile splits)

#### Acceptance Criteria
- `src/components/splits/SplitsTable.tsx` renders a table of auto-computed splits
- Columns: Split #, Distance, Pace, Avg HR, Avg Cadence, Elevation +/-, Time
- Splits are computed from record data based on cumulative distance crossing km/mile boundaries
- Split computation logic lives in `src/lib/calculations.ts`
- Table respects the unit toggle (km vs mile splits)

## Story: Build manual laps table
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build auto splits table

#### Tasks
- [ ] Create `src/components/splits/LapsTable.tsx` rendering laps from `runData.laps`
- [ ] Use same columns as splits table
- [ ] Distinguish between auto and manual laps if both exist
- [ ] Show message if no manual laps are present

#### Acceptance Criteria
- `src/components/splits/LapsTable.tsx` renders laps from `runData.laps`
- Same columns as the splits table
- Distinguishes between auto and manual laps if both exist
- Shows a message if no manual laps are present

## Story: Add split comparison bar chart and best/worst badges
- **Status:** [ ] todo
- **Priority:** medium
- **Depends on:** Build auto splits table

#### Tasks
- [ ] Create `src/components/splits/SplitBarChart.tsx` with horizontal bars for each split's pace
- [ ] Highlight fastest split in green with "Fastest" badge
- [ ] Highlight slowest split in red with "Slowest" badge
- [ ] Make bar lengths relative to pace range
- [ ] Update chart on unit toggle change

#### Acceptance Criteria
- `src/components/splits/SplitBarChart.tsx` renders horizontal bars for each split's pace
- Fastest split highlighted in green with a "Fastest" badge
- Slowest split highlighted in red with a "Slowest" badge
- Bar lengths are relative to the pace range
- Chart updates when unit toggle changes
