# Technology Stack

**Analysis Date:** 2026-03-12

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code; configured with strict mode and bundler module resolution

## Runtime

**Environment:**
- Bun 1.3.9+ - All-in-one JavaScript runtime for development, testing, and production

**Package Manager:**
- Bun (default)
- Lockfile: `bun.lock` (present)

## Frameworks

**Core:**
- Bun.serve() - Server/routing framework (configured in `CLAUDE.md` as replacement for Express)

**Testing:**
- bun:test - Built-in test runner (configured in `CLAUDE.md`)

**Build/Dev:**
- Bun build - Bundler for HTML, TS, CSS (configured in `CLAUDE.md`)
- Bun bundler mode - Automatic transpiling and bundling via `moduleResolution: "bundler"` in TypeScript

## Key Dependencies

**Development Only:**
- @types/bun 1.3.10 - Type definitions for Bun API
- bun-types 1.3.10 - Bun runtime types
- typescript 5.9.3 - TypeScript compiler and language services

**Peer Dependencies:**
- typescript ^5 - Required for development

## Configuration

**TypeScript (`tsconfig.json`):**
- Target: ESNext
- Module: Preserve
- JSX: react-jsx (enabled)
- Module detection: force
- Bundler mode: enabled
- Strict mode: enabled
- Import TS extensions: allowed
- Key flags: skipLibCheck, noFallthroughCasesInSwitch, noUncheckedIndexedAccess, noImplicitOverride

**Environment:**
- Bun automatically loads `.env` files (no dotenv package needed)
- No environment configuration detected in current codebase

**Build:**
- Output directory: `dist/` (via .gitignore)
- Coverage: `coverage/` directory configured

## Platform Requirements

**Development:**
- Bun 1.3.9+
- TypeScript 5.x
- macOS, Linux, or Windows with Bun support

**Production:**
- Bun runtime (handles serving, database connections, WebSockets)
- No Node.js required

## Notable Patterns

**Per CLAUDE.md project instructions:**
- Use Bun APIs exclusively (Bun.serve, bun:sqlite, bun:redis, bun:sql)
- No Express, webpack, esbuild, jest, vitest, or vite
- Frontend: HTML imports with Bun.serve, React via JSX
- HTML imports bundled automatically (`.tsx` imports in HTML files)

---

*Stack analysis: 2026-03-12*
