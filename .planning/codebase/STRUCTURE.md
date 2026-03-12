# Codebase Structure

**Analysis Date:** 2026-03-12

## Directory Layout

```
fitviewer/
├── index.ts              # Server entry point (Bun.serve configuration)
├── package.json          # Package metadata and dependencies
├── tsconfig.json         # TypeScript compiler configuration
├── bun.lock              # Lock file for Bun dependency management
├── .gitignore            # Git ignore rules
├── CLAUDE.md             # Project-specific instructions
├── README.md             # Project overview
├── src/                  # [To be created] Application source code
│   ├── handlers/         # Route handlers for API endpoints
│   ├── components/       # React components (frontend)
│   ├── services/         # Business logic, data access, utilities
│   ├── middleware/       # Request processing middleware
│   └── types/            # Shared TypeScript type definitions
├── public/               # [To be created] Static assets (if needed)
├── pages/                # [To be created] HTML entry points for different routes
└── .planning/            # GSD planning documents (auto-generated)
    └── codebase/         # Codebase analysis documents
        ├── ARCHITECTURE.md
        └── STRUCTURE.md
```

## Directory Purposes

**Root Directory:**
- Purpose: Project configuration, entry point, package metadata
- Contains: TypeScript config, package manifest, server entry point
- Key files: `index.ts`, `package.json`, `tsconfig.json`

**src/ (Recommended - not yet created):**
- Purpose: All application source code
- Contains: Handlers, components, services, types
- Key files: Application logic organized by responsibility
- Strategy: Keep source in `src/` to separate application code from config files

**src/handlers/ (Recommended - not yet created):**
- Purpose: API endpoint request handlers
- Contains: Handler functions for each route
- Naming: `{resource}.ts` (e.g., `users.ts`, `fitness.ts`, `files.ts`)
- Export pattern: Named exports for each handler function

**src/components/ (Recommended - not yet created):**
- Purpose: React components for the frontend
- Contains: `.tsx` files exporting React function components
- Naming: PascalCase (e.g., `Header.tsx`, `FitChart.tsx`)
- Directory structure: Organize by feature or page if many components exist

**src/services/ (Recommended - not yet created):**
- Purpose: Business logic, data access, external API integration
- Contains: Functions and classes that handle core functionality
- Naming: camelCase (e.g., `fitAnalyzer.ts`, `userStore.ts`, `csvParser.ts`)
- Pattern: Export functions or classes; avoid default exports

**src/middleware/ (Recommended - not yet created):**
- Purpose: Request/response processing middleware
- Contains: Functions that modify or validate requests before handlers
- Examples: Auth middleware, logging, request validation
- Pattern: Functions that take `Request` and return `Request` or `Response`

**src/types/ (Recommended - not yet created):**
- Purpose: Shared TypeScript type definitions
- Contains: Interfaces, types, type utilities
- Naming: `{domain}.types.ts` (e.g., `user.types.ts`, `fitness.types.ts`)
- Pattern: Export-only files (no implementations)

**pages/ (Optional - for HTML templates):**
- Purpose: HTML template files for different routes
- Contains: `.html` files that import their respective frontend modules
- Pattern: Simple HTML structure importing `.tsx` files via `<script type="module">`
- Example: `pages/index.html` imports `pages/index.tsx`

**public/ (Optional - for static files):**
- Purpose: Static assets served directly (CSS, images, fonts)
- Contains: Files not requiring processing
- Note: Bun can serve these via static routes if configured

## Key File Locations

**Entry Points:**
- `index.ts`: Server initialization, `Bun.serve()` configuration, route definitions

**Configuration:**
- `package.json`: Dependencies, scripts, project metadata
- `tsconfig.json`: TypeScript compiler options (already configured for Bun)
- `CLAUDE.md`: Project-specific instructions and conventions

**Core Logic:**
- `src/handlers/`: Route handlers (future)
- `src/services/`: Business logic and data access (future)

**Frontend:**
- `pages/*.html`: HTML templates (future)
- `src/components/`: React components (future)

**Testing:**
- Not yet implemented; recommended: `*.test.ts` or `*.spec.ts` co-located with source files

## Naming Conventions

**Files:**
- **Server/handler files:** camelCase (e.g., `users.ts`, `fitParser.ts`)
- **Component files:** PascalCase (e.g., `Header.tsx`, `FitChart.tsx`)
- **Type definition files:** `{domain}.types.ts` (e.g., `user.types.ts`)
- **Configuration files:** lowercase or kebab-case (e.g., `tsconfig.json`, `.prettierrc`)

**Directories:**
- **Feature directories:** plural, lowercase (e.g., `handlers/`, `components/`, `services/`)
- **Organization:** Group by responsibility, not by file type (avoid `utils/`, `types/` at root unless truly shared)

**Functions:**
- camelCase (e.g., `getUserById()`, `parseFitFile()`)
- Verbs for functions that do work (e.g., `process`, `fetch`, `validate`)

**Variables:**
- camelCase (e.g., `userId`, `fitData`, `isValid`)
- PascalCase for React components (e.g., `<Header />`, `<FitChart />`)

**Types:**
- PascalCase (e.g., `User`, `FitRecord`, `ApiResponse`)
- Suffix `Props` for component prop types (e.g., `HeaderProps`)
- Suffix `Type` only if the distinction is needed (e.g., `UserType` vs. a concrete `User` interface)

## Where to Add New Code

**New API Endpoint:**
1. Create handler in `src/handlers/{resource}.ts`
2. Define types in `src/types/{resource}.types.ts`
3. Add business logic in `src/services/{service}.ts` if needed
4. Register route in `index.ts` under `Bun.serve()` routes
5. Add tests in `src/handlers/{resource}.test.ts`

**New React Component:**
1. Create file in `src/components/{ComponentName}.tsx`
2. Export function component
3. Define prop types in `src/types/{ComponentName}.types.ts` or inline if simple
4. Import in parent component or HTML file
5. Add tests in `src/components/{ComponentName}.test.tsx` if complex

**New Business Logic:**
1. Create service in `src/services/{service}.ts`
2. Export functions or class
3. Import in handlers or components as needed
4. Add tests in `src/services/{service}.test.ts`

**New Shared Type:**
1. Create in `src/types/{domain}.types.ts`
2. Export types/interfaces only (no implementations)
3. Import where needed

**Utilities:**
- Small, specific utilities: Co-locate with their usage (same file or same directory)
- Widely reused utilities: Create `src/services/utils.ts` or domain-specific `src/services/{domain}Utils.ts`
- Avoid generic `utils/` directories; organize by domain instead

## Special Directories

**.planning/codebase/:**
- Purpose: GSD codebase analysis documents
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, INTEGRATIONS.md, CONCERNS.md
- Generated: Yes (by GSD mapper)
- Committed: Yes (version control)

**node_modules/:**
- Purpose: Installed dependencies
- Generated: Yes (by `bun install`)
- Committed: No (git-ignored)

**.git/:**
- Purpose: Version control
- Generated: Yes (by `git init`)
- Committed: No (system directory)

## Recommended Project Structure (Complete)

After initial setup, the project should grow like this:

```
fitviewer/
├── index.ts
├── package.json
├── tsconfig.json
├── bun.lock
├── src/
│   ├── handlers/
│   │   ├── fitness.ts
│   │   ├── users.ts
│   │   └── files.ts
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── FitChart.tsx
│   │   └── Upload.tsx
│   ├── services/
│   │   ├── fitAnalyzer.ts
│   │   ├── userStore.ts
│   │   ├── csvParser.ts
│   │   └── logger.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   └── types/
│       ├── fitness.types.ts
│       ├── user.types.ts
│       └── api.types.ts
├── pages/
│   ├── index.html
│   ├── index.tsx
│   └── styles.css
├── public/
│   └── favicon.ico
└── .planning/
    └── codebase/
        ├── ARCHITECTURE.md
        ├── STRUCTURE.md
        ├── CONVENTIONS.md
        ├── TESTING.md
        ├── STACK.md
        ├── INTEGRATIONS.md
        └── CONCERNS.md
```

---

*Structure analysis: 2026-03-12*
