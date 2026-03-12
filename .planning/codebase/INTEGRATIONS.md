# External Integrations

**Analysis Date:** 2026-03-12

## APIs & External Services

**No external APIs detected** - Current codebase contains only minimal scaffolding (`index.ts` is a stub).

## Data Storage

**Databases:**
- SQLite available (via `bun:sqlite`)
  - Connection: No database configured yet
  - Client: `bun:sqlite` (built-in)

**File Storage:**
- Bun.file API available for file operations
- Local filesystem only (no cloud storage configured)

**Caching:**
- Redis available (via `Bun.redis`)
- Not currently configured

## Authentication & Identity

**Auth Provider:**
- Not configured
- No authentication implementation detected

## Monitoring & Observability

**Error Tracking:**
- Not configured

**Logs:**
- Console logging available via standard `console.*` methods
- No structured logging configured

## CI/CD & Deployment

**Hosting:**
- Not specified
- Project configured for Bun runtime deployment

**CI Pipeline:**
- Not configured

## Environment Configuration

**Required env vars:**
- None detected
- Bun automatically loads `.env`, `.env.local`, and environment-specific variants (per .gitignore)

**Secrets location:**
- `.env` files (automatic Bun loading)
- Development patterns: `.env.development.local`, `.env.test.local`, `.env.production.local`

## Webhooks & Callbacks

**Incoming:**
- Bun.serve() supports route handlers for any webhook endpoint
- Not currently configured

**Outgoing:**
- No outgoing webhooks configured

## Notable Constraints

**Per CLAUDE.md project instructions:**
- Do NOT use dotenv (Bun loads automatically)
- Do NOT use Express (use Bun.serve())
- Do NOT use node packages like pg, postgres.js, ioredis, better-sqlite3, ws, webpack, esbuild
- Use Bun built-in APIs exclusively: Bun.serve(), bun:sqlite, Bun.redis, bun:sql, WebSocket

---

*Integration audit: 2026-03-12*
