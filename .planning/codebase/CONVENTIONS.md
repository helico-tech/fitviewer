# Coding Conventions

**Analysis Date:** 2026-03-12

## Naming Patterns

**Files:**
- TypeScript source files: `.ts` extension
- React components: `.tsx` extension
- HTML files with bundled content: `.html` extension
- CSS files: `.css` extension (imported directly in TypeScript/TSX)
- Test files: `.test.ts` or `.test.tsx` suffix (co-located with source)
- Configuration files: `.json` extension (tsconfig.json, biome.json if used)
- Hooks and scripts: `.js` extension (Node.js utilities in `.claude/hooks/`)

**Functions:**
- Named functions use camelCase: `detectConfigDir()`, `buildProgressBar()`
- Private functions not prefixed with underscore (TypeScript visibility handles it)
- Event handlers use `on` prefix: `onEnd`, `onData`, `on('data', ...)`
- Async functions explicitly use `async` keyword

**Variables:**
- camelCase for all variables and constants: `stdinTimeout`, `SESSION_ID`, `usableRemaining`
- Constants defined with `const`, not `const ALL_CAPS` (capitalize by usage context, not naming)
- Boolean variables may use `is` or `has` prefix: `isGsdActive`, `hasError`
- Temporary variables in loops: single letters acceptable (`f`, `i`), but prefer descriptive names in tight scopes
- Block scope: use `const` by default, `let` only when reassignment needed, never `var`

**Types:**
- Interface/Type names use PascalCase: `MetricsData`, `WarningConfig`, `BridgeData`
- Generic type parameters: `T`, `U`, `V` for generic cases; `TItem`, `TKey` when context requires specificity
- Union types denote alternatives clearly: `type Status = 'warning' | 'critical'`
- Type-only imports: use `import type { Foo }` syntax (required by `verbatimModuleSyntax: true` in tsconfig)

## Code Style

**Formatting:**
- No linter/formatter enforced in project (no `.eslintrc`, `.prettierrc`, or `biome.json` present)
- TypeScript strict mode enabled in `tsconfig.json`
- Follow patterns shown in project hooks: 2-space indentation (observed in hook scripts)
- Line length: no hard limit observed, but keep functions readable

**Linting:**
- TypeScript compiler is the primary linter via strict mode settings
- Key enabled checks:
  - `strict: true` - Enables all strict type-checking options
  - `noFallthroughCasesInSwitch: true` - Prevents accidental fall-through in switch statements
  - `noUncheckedIndexedAccess: true` - Requires checks before accessing indexed properties
  - `noImplicitOverride: true` - Requires `override` keyword in subclasses
  - `skipLibCheck: true` - Skip type checking of declaration files
- No formatting rules enforced (no prettier/eslint)
- Type safety is the priority

## Import Organization

**Order:**
1. Node.js built-ins (`node:fs`, `node:path`, `node:crypto`)
2. Bun built-ins (`bun:test`, `bun:sqlite`)
3. External third-party imports (`react`, `react-dom`)
4. Project imports (relative or module-aliased)
5. CSS/asset imports (at bottom if present)

**Path Aliases:**
- No path aliases configured in `tsconfig.json` (using standard relative imports)
- Use relative imports: `../services/user.ts`, `./helpers.ts`
- HTML imports supported directly: `import index from "./index.html"`

**Import Examples from codebase:**
```typescript
// From gsd-statusline.js
const fs = require('fs');
const path = require('path');
const os = require('os');
```

## Error Handling

**Patterns:**
- Try-catch blocks with silent failure for non-critical operations:
  ```typescript
  try {
    // operation
  } catch (e) {
    // Silent fail -- [reason]. Don't break [system]
  }
  ```
- Non-critical failures (e.g., bridge files, cache reads) catch and continue without throwing
- Critical errors (parsing JSON, file access in main flow) propagate or log clearly
- Guard clauses for early exit: `if (!condition) { process.exit(0); }`
- Timeouts for async operations that might hang (e.g., stdin with 3-second timeout)

**From codebase:**
```typescript
// Silent failure pattern for optional operations
try {
  const bridgePath = path.join(os.tmpdir(), `claude-ctx-${session}.json`);
  fs.writeFileSync(bridgePath, bridgeData);
} catch (e) {
  // Silent fail -- bridge is best-effort, don't break statusline
}
```

## Logging

**Framework:** console (console.log/warn/error or silent when no output needed)

**Patterns:**
- Avoid logging in hooks (they run in background/ephemeral context)
- Statusline hook writes structured data to stdout for external processing
- Error monitoring hooks use silent fail (exit code 0) rather than stderr
- Debug info written to bridge files (`/tmp/claude-ctx-{session}.json`) for inter-process communication

**Examples:**
```typescript
// Structured output for pipe consumption
process.stdout.write(JSON.stringify(output));

// Silent failures in hooks (no logging)
try {
  // operation
} catch (e) {
  process.exit(0); // Exit silently
}
```

## Comments

**When to Comment:**
- Function purpose at the top: `/# What this does + key implementation notes`
- Complex logic blocks explaining the "why", not the "what"
- Thresholds and magic numbers: `const WARNING_THRESHOLD = 35;  // remaining_percentage <= 35%`
- Non-obvious guard clauses: `// If no metrics file, this is a subagent or fresh session -- exit silently`
- Integration points between systems (e.g., bridge files)

**JSDoc/TSDoc:**
- Not enforced in current codebase (minimal TypeScript files yet)
- Use JSDoc for public APIs when codebase grows
- Format: `/** Description. */` for inline, multi-line for complex functions

**Comment Examples from codebase:**
```typescript
// Check project directory first (local install), then global
let installed = '0.0.0';

// Context window display (shows USED percentage scaled to usable context)
// Claude Code reserves ~16.5% for autocompact buffer, so usable context
// is 83.5% of the total window. We normalize to show 100% at that point.
const AUTO_COMPACT_BUFFER_PCT = 16.5;
```

## Function Design

**Size:**
- Keep functions under 50 lines (hook scripts range 10-140 lines, but each handles a distinct concern)
- Single responsibility: one main task per function
- Extract utility functions for repeated logic

**Parameters:**
- Max 3-4 parameters; use object parameter for more:
  ```typescript
  function process(config: { dir: string; timeout: number; debug: boolean }) { }
  ```
- Use destructuring for object parameters
- No default parameters in critical paths (be explicit)

**Return Values:**
- Explicit return type annotations in TypeScript
- Early returns for guard clauses
- Void functions for side-effects (writing files, stdio)
- Return structured data (objects) rather than tuples for clarity

**Example from codebase:**
```typescript
function detectConfigDir(baseDir: string): string {
  // Check env override first
  const envDir = process.env.CLAUDE_CONFIG_DIR;
  if (envDir && fs.existsSync(path.join(envDir, 'get-shit-done', 'VERSION'))) {
    return envDir;
  }
  for (const dir of ['.config/opencode', '.opencode', '.gemini', '.claude']) {
    if (fs.existsSync(path.join(baseDir, dir, 'get-shit-done', 'VERSION'))) {
      return path.join(baseDir, dir);
    }
  }
  return envDir || path.join(baseDir, '.claude');
}
```

## Module Design

**Exports:**
- Named exports for functions and types: `export function foo() { }`
- Default exports for page/component files (React components, HTML)
- Type-only exports for TypeScript types: `export type { Foo }`

**Barrel Files:**
- Not used in current minimal codebase
- When needed, create `index.ts` with re-exports only (no logic)
- Example pattern (future):
  ```typescript
  export * from './models/user.js';
  export * from './services/auth.js';
  export type { User, AuthConfig } from './types.js';
  ```

## Frontend Conventions

**React Component Structure:**
- Functional components only (no class components)
- JSX in `.tsx` files
- Import React for JSX: `import React from 'react'` (required by `jsx: "react-jsx"` in tsconfig)
- Props interface: `interface ComponentProps { ... }`
- Component pattern:
  ```typescript
  interface FooProps { bar: string; }
  export function Foo({ bar }: FooProps) { return <div>{bar}</div>; }
  ```

**HTML & CSS:**
- HTML files can import `.tsx` directly: `<script type="module" src="./frontend.tsx"></script>`
- CSS imported as modules in TypeScript: `import './index.css'`
- No CSS-in-JS framework used (plain CSS or Tailwind via Bun bundler)

## Bun-Specific Conventions

**APIs:**
- Use Bun.serve() for servers (no Express)
- Use bun:sqlite for databases (no better-sqlite3)
- Use bun:redis for caching (no ioredis)
- Use bun:sql for Postgres (no pg/postgres.js)
- Use WebSocket built-in (no ws package)
- Use Bun.file for file operations (preferred over node:fs)
- Use Bun.$`` for shell commands (preferred over execa)

**Testing:**
- Use `bun:test` exclusively (no jest/vitest)
- Import: `import { test, expect } from "bun:test";`

---

*Convention analysis: 2026-03-12*
