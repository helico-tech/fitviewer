# Codebase Concerns

**Analysis Date:** 2026-03-12

## Project State

This is a newly initialized Bun project with minimal code (single console.log in `index.ts`). The following concerns apply to the current trajectory and early architectural decisions.

## Tech Debt

**Placeholder Project State:**
- Issue: Main entry point (`index.ts`) contains only a trivial console.log statement with no actual application logic
- Files: `index.ts`
- Impact: No meaningful functionality exists yet; rapid scaffolding is needed to establish core patterns before too much code is written
- Fix approach: Follow the CLAUDE.md guidelines strictly when building out real features. Establish actual routes, data models, and service layers before expanding further

**Incomplete TypeScript Configuration:**
- Issue: Several strict TypeScript flags are disabled in `tsconfig.json` that should be enabled once codebase matures
- Files: `tsconfig.json`
- Current setting:
  - `noUnusedLocals: false` - Allows unused variables to pile up
  - `noUnusedParameters: false` - Unused parameters won't be caught
  - `noPropertyAccessFromIndexSignature: false` - Allows unsafe property access
- Impact: Code quality degrades as unused code accumulates; unsafe patterns become harder to detect later
- Fix approach: After initial scaffolding stabilizes, enable these flags incrementally to enforce quality standards

## Dependency Management Risk

**Peer Dependency Gap:**
- Issue: `typescript: ^5` is a peer dependency but not installed in devDependencies
- Files: `package.json`, `bun.lock`
- Impact: TypeScript IDE support depends on manual installation; some tooling may fail silently without clear errors
- Fix approach: Add `typescript@^5` to devDependencies in package.json once development tooling is configured

**Bun API Surface Exposure:**
- Issue: CLAUDE.md prescribes Bun-specific APIs (Bun.serve, bun:sqlite, Bun.sql, etc.) but the codebase has no existing patterns yet
- Files: CLAUDE.md (reference), to be implemented in future code
- Impact: When first routes/services are written, developers must strictly follow Bun APIs; mixing Node.js packages (express, pg, etc.) would violate constraints
- Fix approach: On first code implementation, establish clear examples in `index.ts` and core service files following the CLAUDE.md patterns. Add linting or comments to prevent accidental npm package choices

## Missing Scaffolding

**No Application Framework:**
- Issue: No web server structure exists yet; CLAUDE.md shows example but index.ts is empty
- Files: `index.ts`
- Impact: First developer to add features must decide routing strategy, request handling, error handling patterns
- Fix approach: Before expanding beyond trivial changes, establish baseline `index.ts` with Bun.serve() configured with empty routes

**No Testing Infrastructure:**
- Issue: No test files exist; no jest/vitest config, no test runner setup
- Files: No test files found
- Impact: Codebase can accumulate untested code; bugs won't be caught early
- Fix approach: Create first test file (e.g., `index.test.ts`) using `bun test` before adding significant logic; establish testing patterns in TESTING.md when codebase reaches ARCHITECTURE.md quality

**No Environment Configuration:**
- Issue: `.env` file exists in gitignore but no `.env.example` or documentation of required variables
- Files: `.gitignore` (references .env but no template exists)
- Impact: New developers won't know what environment variables are required; deployments will fail mysteriously
- Fix approach: Create `.env.example` with all required variables once any environment-dependent code is added

## Architectural Risks

**Single Entry Point Problem:**
- Issue: Only one executable entry point (`index.ts`) with no organized code structure
- Files: `index.ts`
- Impact: As features grow without a clear directory structure, codebase becomes monolithic; harder to maintain separation of concerns
- Fix approach: Before adding backend endpoints and frontend, establish STRUCTURE.md with guidance on where services, types, routes, and middleware belong

**No Explicit Frontend/Backend Split:**
- Issue: CLAUDE.md shows both HTML imports and API examples but project structure doesn't reflect this split
- Files: CLAUDE.md (reference), `index.ts` (will be affected)
- Impact: When first feature is added, developer must choose: server-rendered HTML with Bun.serve? Separate frontend build? This decision will cascade through all future code
- Fix approach: Create ARCHITECTURE.md with explicit frontend/backend boundary before adding first meaningful feature

## Early Warning Signs

**Framework Prescription Mismatch:**
- Issue: CLAUDE.md is very prescriptive about using Bun APIs exclusively, but no examples in actual codebase yet
- Files: CLAUDE.md, `index.ts`
- Current risk: Medium
- Future risk: High (after first 10+ files)
- Recommendation: Establish actual example code in `index.ts` that developers can reference; add ESLint rules to prevent importing disallowed packages

**Code Organization Undefined:**
- Issue: No `src/` directory exists; no clear convention for where to put routes, services, components, types
- Files: Project root
- Impact: First feature will establish an informal pattern; second feature might follow a different pattern
- Fix approach: Before merging first real feature, write STRUCTURE.md with mandatory locations for each code type

## Known Issues

**None currently** - Project is too new to have accumulated runtime bugs.

## Security Considerations

**Secrets Management:**
- Risk: .env file referenced in gitignore but no secrets validation exists
- Files: `.gitignore`
- Current mitigation: File is in gitignore so committed by default
- Recommendations:
  1. Create `.env.example` with placeholder values
  2. Add pre-commit hook to verify no `.env` or `.env.local` files are staged
  3. Document which environment variables are secrets (API keys, database passwords) vs safe defaults

**Input Validation Not Yet Required:**
- Risk: Not applicable until routes are added, but will become critical
- Files: Will be in route handlers (not yet created)
- Recommendations: When adding API routes, establish validation middleware early using Bun's request handling; don't add validation later as a patch

## Performance Considerations

**No Metrics or Logging:**
- Issue: No structured logging, no error tracking, no performance instrumentation
- Files: N/A (no code yet)
- Impact: When deployed, debugging issues will be difficult; slow endpoints won't be discovered until users complain
- Fix approach: Add logging infrastructure early (consider Pino or similar) before adding business logic; make error tracking part of first route implementation

**Database Not Yet Chosen:**
- Issue: CLAUDE.md recommends `bun:sqlite` or `Bun.sql` (Postgres) but no database is configured
- Files: N/A
- Impact: First database-dependent feature will be slower if database choice isn't made; changing it later is costly
- Fix approach: Make database choice (SQLite for local development vs Postgres for production) before first model is written

## Test Coverage Gaps

**Zero Test Coverage:**
- What's not tested: Everything (no test files exist)
- Files: Project-wide
- Risk: Medium/High (standard for new projects, but risk increases rapidly as features are added)
- Priority: Low now, High after first 50 LOC of real logic

**No Test Patterns Established:**
- Issue: TESTING.md doesn't exist; developers will invent their own patterns
- Files: `.planning/codebase/` (missing TESTING.md)
- Risk: Inconsistent test style, poor maintainability
- Fix approach: When second test file is added, extract patterns into TESTING.md

## Fragile Areas

**No Error Handling Strategy:**
- Files: All route handlers (not yet created)
- Why fragile: Bun.serve() will have default error handling; without explicit patterns, errors will leak to stdout
- Safe modification: Before adding first route, establish error handling middleware or wrapper pattern
- Test coverage: N/A

**No Request Validation:**
- Files: Route handlers (not yet created)
- Why fragile: API routes will accept any input; data corruption or injection attacks possible
- Safe modification: Establish validation layer before first POST/PUT route
- Test coverage: N/A until validation exists

## Scaling Limits

**Single Process:**
- Current capacity: Limited by single Bun process
- Limit: Can't handle load of concurrent requests beyond what one process supports; no load balancing configured
- Scaling path: When deployed, configure Bun.serve() with proper port binding; add reverse proxy (nginx/Caddy) for load balancing

**No Database Connection Pool:**
- Current capacity: N/A (no database yet)
- Limit: When database is added, connection management must be configured
- Scaling path: Use bun:sqlite for local or Bun.sql with connection pooling for Postgres

## Dependencies at Risk

**TypeScript Version:**
- Risk: Peer dependency only; not enforced in lockfile
- Impact: Type checking may fail or be skipped if TypeScript isn't installed
- Migration plan: Add to devDependencies as soon as build tooling is configured

**Bun Runtime Lock-in:**
- Risk: Project is built exclusively on Bun APIs; no Node.js compatibility
- Impact: Cannot easily move to Node.js/Express if Bun proves problematic
- Migration plan: This is intentional per CLAUDE.md; acknowledge as a strategic decision rather than a bug

## Missing Critical Features

**No Build Output:**
- Problem: No build process defined; unclear how `index.ts` is run in production
- Blocks: Deployment strategy undecided
- Recommendation: Document whether production runs `bun index.ts` directly or requires `bun build`

**No Deployment Configuration:**
- Problem: No Dockerfile, no deployment script, no hosting target defined
- Blocks: Cannot deploy to production
- Recommendation: Decide deployment target (Docker? Vercel? Self-hosted?) and create setup documentation

**No Database Schema:**
- Problem: No schema, migrations, or models defined
- Blocks: Cannot persist user data
- Recommendation: Before adding any features that need data, design schema and establish migration/seed patterns

---

*Concerns audit: 2026-03-12*
