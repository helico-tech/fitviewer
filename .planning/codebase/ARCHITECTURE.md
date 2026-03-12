# Architecture

**Analysis Date:** 2026-03-12

## Pattern Overview

**Overall:** Single-server application built on Bun's native APIs

This is a greenfield project designed to use Bun's built-in capabilities rather than relying on traditional Node.js frameworks. The application follows a **direct server pattern** where `Bun.serve()` is the entry point, combined with **HTML import bundling** for frontend assets.

**Key Characteristics:**
- No external HTTP framework dependency (Bun.serve is native)
- HTML files import TypeScript/JSX directly for transpilation and bundling
- WebSocket support built into server routing
- Database access via `bun:sqlite`, `Bun.sql` (Postgres), or `Bun.redis`
- Development mode with HMR (Hot Module Reload) support

## Layers

**Server Layer:**
- Purpose: HTTP request handling, routing, WebSocket connections
- Location: `index.ts` (entry point) and future route handlers
- Contains: `Bun.serve()` configuration, route definitions, middleware
- Depends on: Native Bun APIs, route handlers
- Used by: HTTP clients, frontend

**Frontend Layer:**
- Purpose: Browser UI and client-side logic
- Location: `*.html` files and associated `.tsx`/`.jsx` files (not yet created)
- Contains: React components, styles, client-side state
- Depends on: React, server endpoints
- Used by: End users via browser

**Data Layer:**
- Purpose: Persistence and data storage
- Location: Separate from current codebase (to be implemented)
- Contains: Database drivers (`bun:sqlite`, `Bun.sql`, `Bun.redis`)
- Depends on: Database runtime
- Used by: Server layer

**Business Logic Layer:**
- Purpose: Core application functionality
- Location: `src/` (recommended, not yet created)
- Contains: Domain logic, request handlers, data access methods
- Depends on: Data layer
- Used by: Server layer routes

## Data Flow

**HTTP Request → Response:**

1. Client sends HTTP request
2. `Bun.serve()` receives request at configured route
3. Route handler processes request (may access database)
4. Response returned (JSON for API, HTML for pages)

**WebSocket Flow:**

1. Client initiates WebSocket upgrade
2. `Bun.serve()` `websocket` config handles `open`, `message`, `close` events
3. Messages exchanged bidirectionally
4. Connection lifecycle managed by browser/server

**Frontend Bundle:**

1. Browser loads `.html` file
2. `<script type="module" src="...">` imports `.tsx`
3. Bun bundler transpiles JSX, resolves imports, bundles assets
4. React hydrates the DOM
5. Frontend sends requests to server API

**State Management:**
- Server state: Immutable request handling (stateless by default)
- Client state: React component state (future implementation)
- Persistent state: Database (via `bun:sqlite`, `Bun.sql`, `Bun.redis`)

## Key Abstractions

**Route Handler:**
- Purpose: Encapsulate request handling logic for a specific endpoint
- Examples: `GET /api/users/:id`, `POST /api/data`
- Pattern: Define inline in `Bun.serve()` routes object or extract to handler functions in `src/handlers/`

**Component:**
- Purpose: Reusable UI logic (React components)
- Examples: `src/components/Header.tsx`, `src/components/FitChart.tsx`
- Pattern: `.tsx` files exporting React function components

**Service:**
- Purpose: Encapsulate business logic, data access, external API calls
- Examples: `src/services/fitAnalyzer.ts`, `src/services/userStore.ts`
- Pattern: `.ts` files exporting functions or classes

## Entry Points

**Server Entry:**
- Location: `index.ts`
- Triggers: `bun --hot index.ts` or `bun run index.ts`
- Responsibilities:
  - Configure `Bun.serve()` with routes, WebSocket handlers
  - Start development server with HMR if `--hot` flag used
  - Current state: Minimal logging only (placeholder)

**Frontend Entry (future):**
- Location: `*.html` file (e.g., `index.html`)
- Triggers: Browser GET request to server
- Responsibilities:
  - Serve HTML document
  - Import `.tsx` frontend code via `<script type="module">`
  - Trigger Bun bundler to transpile and bundle

## Error Handling

**Strategy:** Error responses with HTTP status codes and optional error details

**Patterns:**
- Return `new Response(error_message, { status: 400 })` for client errors
- Return `new Response(error_message, { status: 500 })` for server errors
- Log errors to console or logging system (not yet implemented)
- Validate request data before processing

## Cross-Cutting Concerns

**Logging:** Currently console-based (no structured logging)
- Future: Add logging service in `src/services/logger.ts` or use third-party library

**Validation:** Data validation should occur in request handlers
- Future: Create `src/validators/` directory for schema validation functions

**Authentication:** Not yet implemented
- Future: Add session/token validation middleware in `src/middleware/auth.ts`

**CORS:** Not configured (add headers in responses if needed for cross-origin requests)
- Set `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, etc. in response headers

---

*Architecture analysis: 2026-03-12*
