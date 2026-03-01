# Epic: UI Shell & Navigation

Build the app shell with tab navigation, responsive layout, and loading/empty states that frame all content.

## Story: Implement tab navigation layout
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Wire up drop zone to parser and store

#### Tasks
- [x] Create `src/components/dashboard/DashboardLayout.tsx` with shadcn Tabs
- [x] Add tabs: Overview, Map, Charts, Splits, Zones
- [x] Render corresponding view component per tab (stub placeholders initially)
- [x] Show run title/date in app header when data is loaded

#### Acceptance Criteria
- `src/components/dashboard/DashboardLayout.tsx` renders shadcn Tabs
- Tabs: Overview, Map, Charts, Splits, Zones
- Tab content area renders the corresponding view component (stub placeholders initially)
- Active tab is visually highlighted
- App header shows the run title/date when data is loaded

- **Technical Notes:** Use the playwright-cli skill to verify tab switching renders the correct content area.

## Story: Implement responsive layout
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Implement tab navigation layout

#### Tasks
- [x] Make dashboard layout responsive for desktop (1024px+) with full layout
- [x] Support tablet (768px-1023px) with stacked layout and full-width cards
- [x] Ensure no horizontal scrolling on tablet or desktop viewports
- [x] Make charts and map resize properly on window resize

#### Acceptance Criteria
- Desktop (1024px+): full layout with sidebar or wide cards
- Tablet (768px-1023px): stacked layout with full-width cards
- No horizontal scrolling on tablet or desktop viewports
- Charts and map resize properly on window resize

- **Technical Notes:** Use the playwright-cli skill to take screenshots at different viewport sizes and verify layout.

## Story: Add loading skeletons
- **Status:** [x] done
- **Priority:** medium
- **Depends on:** Implement tab navigation layout

#### Tasks
- [x] Add shadcn Skeleton placeholders for summary cards during loading
- [x] Add Skeleton placeholders for chart areas during loading
- [x] Add Skeleton placeholder for map during loading
- [x] Match skeleton dimensions to approximate real component sizes

#### Acceptance Criteria
- Skeleton placeholders render during the loading state for summary cards, chart areas, and map
- Skeletons match the approximate dimensions of the real components
- Skeletons disappear once data is loaded
