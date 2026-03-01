# Epic: Heart Rate Zone Analysis

Allow users to configure HR zones and visualize time distribution across zones.

## Story: Implement zone configuration
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Build heart rate chart

#### Tasks
- [ ] Create `src/components/zones/ZoneConfig.tsx` with inputs for max HR and 5-zone boundaries
- [ ] Set default zones: Z1 (50-60%), Z2 (60-70%), Z3 (70-80%), Z4 (80-90%), Z5 (90-100%) of max HR
- [ ] Create `src/lib/calculations.ts` with `calculateZoneDistribution(records, zones)` returning time per zone
- [ ] Store zone config in Zustand store
- [ ] Assign standard colors: gray, blue, green, orange, red

#### Acceptance Criteria
- `src/components/zones/ZoneConfig.tsx` provides inputs for max HR and 5-zone boundaries
- Default zones: Z1 (50-60%), Z2 (60-70%), Z3 (70-80%), Z4 (80-90%), Z5 (90-100%) of max HR
- `src/lib/calculations.ts` exports `calculateZoneDistribution(records, zones)` returning time per zone
- Zone config stored in Zustand store
- Zones have standard colors (gray, blue, green, orange, red)

## Story: Build zone distribution bar and time table
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Implement zone configuration

#### Tasks
- [ ] Create `ZoneDistribution.tsx` rendering a horizontal stacked bar chart showing % time in each zone
- [ ] Color each zone segment with standard zone color
- [ ] Create `ZoneTimeTable.tsx` rendering table with zone name, HR range, time, and percentage
- [ ] Update both components when zone boundaries are changed

#### Acceptance Criteria
- `ZoneDistribution.tsx` renders a horizontal stacked bar chart showing % time in each zone
- Each zone segment is colored with the standard zone color
- `ZoneTimeTable.tsx` renders a table with zone name, HR range, time, and percentage
- Both components update when zone boundaries are changed

- **Technical Notes:** Use the playwright-cli skill to verify zone distribution renders correctly with sample data and that changing max HR updates the display.
