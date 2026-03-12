# Testing Patterns

**Analysis Date:** 2026-03-12

## Test Framework

**Runner:**
- bun:test (built-in to Bun runtime)
- Config: No separate config file needed (uses Bun defaults)
- Version: Bun 1.3.9+

**Assertion Library:**
- Built-in `expect()` API (compatible with Jest/Vitest matchers)

**Run Commands:**
```bash
bun test                          # Run all tests
bun test --watch                  # Watch mode
bun test --coverage               # Generate coverage report
bun test path/to/file.test.ts     # Run specific test file
bun test --timeout 5000           # Set timeout (ms)
```

## Test File Organization

**Location:**
- Co-located with source files (test files live in same directory as implementation)
- Alternative: `tests/` directory at project root (not yet established)

**Naming:**
- `.test.ts` suffix for test files: `user.ts` → `user.test.ts`
- `.test.tsx` suffix for component tests: `Button.tsx` → `Button.test.tsx`
- Descriptive test names using `test()` function

**Structure:**
```
src/
├── services/
│   ├── user.ts          # Implementation
│   └── user.test.ts     # Tests (co-located)
├── components/
│   ├── Button.tsx       # Component
│   └── Button.test.tsx  # Component tests (co-located)
└── index.ts             # Entry point
```

## Test Structure

**Suite Organization:**
```typescript
import { test, expect, describe, beforeEach, afterEach } from "bun:test";

describe("UserService", () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  afterEach(() => {
    // cleanup
  });

  test("creates a user with valid data", () => {
    const user = service.create({ name: "Alice" });
    expect(user.name).toBe("Alice");
  });

  test("throws on missing name", () => {
    expect(() => service.create({})).toThrow();
  });
});
```

**Patterns:**
- Use `describe()` for test suites (group related tests)
- Use `test()` for individual test cases
- Setup with `beforeEach()`, cleanup with `afterEach()` (or `beforeAll`/`afterAll` for expensive operations)
- Assertion-first: `expect(actual).toBe(expected)`
- One logical assertion per test (avoid multiple unrelated assertions)

## Mocking

**Framework:** bun:test built-in mocking (via `mock()`)

**Patterns:**
```typescript
import { test, expect, mock } from "bun:test";

test("calls database on save", () => {
  const db = {
    save: mock((data) => ({ id: 1, ...data }))
  };

  const service = new UserService(db);
  service.save({ name: "Bob" });

  expect(db.save).toHaveBeenCalledWith({ name: "Bob" });
  expect(db.save).toHaveBeenCalledTimes(1);
});
```

**Spy Pattern:**
```typescript
import { test, expect, spyOn } from "bun:test";

test("logs user creation", () => {
  const consoleSpy = spyOn(console, "log");
  const service = new UserService();

  service.create({ name: "Alice" });

  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Alice"));
  consoleSpy.mockRestore();
});
```

**What to Mock:**
- External services (APIs, databases) - use in-memory implementations or stubs
- File system operations - use temporary files or in-memory stubs
- Time-dependent code - use `mock` to control Date/setTimeout
- Network calls - mock Fetch or HTTP clients

**What NOT to Mock:**
- Core application logic (test it directly)
- Pure functions (no need to mock)
- Standard library utilities (fs, path, etc. can be tested as-is in unit tests)
- Business validation rules (test the actual implementation)

## Fixtures and Factories

**Test Data:**
```typescript
// user.factory.ts (helper file for creating test data)
export function createTestUser(overrides?: Partial<User>): User {
  return {
    id: "test-123",
    name: "Test User",
    email: "test@example.com",
    ...overrides
  };
}

// user.test.ts
import { test, expect } from "bun:test";
import { createTestUser } from "./user.factory";

test("user has valid email", () => {
  const user = createTestUser({ email: "custom@example.com" });
  expect(user.email).toBe("custom@example.com");
});
```

**Location:**
- Helper factories: `*.factory.ts` or `*.fixtures.ts` in same directory as tests
- Shared fixtures: `tests/fixtures/` directory at project root (if multiple test suites need same data)

## Coverage

**Requirements:** None enforced in current codebase

**View Coverage:**
```bash
bun test --coverage
```

**Coverage output:**
- Generates coverage reports in `coverage/` directory (added to .gitignore)
- Compatible with common CI/CD coverage reporting tools

## Test Types

**Unit Tests:**
- Scope: Single function or class method
- Approach: Test inputs → outputs, no external dependencies
- Location: Co-located with source (`service.test.ts` next to `service.ts`)
- Example: Test UserService.create() in isolation with mocked database

**Integration Tests:**
- Scope: Multiple components working together
- Approach: Test workflows across services, use test database/fixtures
- Location: Can be separate file `*.integration.test.ts` or in same test file with `describe("Integration")`
- Example: Test full user creation flow from API → Service → Database

**E2E Tests:**
- Framework: Not yet configured (Bun doesn't have built-in E2E runner)
- Can use external tools when needed: Playwright, Cypress, etc.
- When added, tests would live in `e2e/` directory with separate runner

## Common Patterns

**Async Testing:**
```typescript
import { test, expect } from "bun:test";

test("fetches user data", async () => {
  const service = new UserService();
  const user = await service.fetchUser(123);

  expect(user.id).toBe(123);
});

// With timeout
test("fetches within timeout", async () => {
  const service = new UserService();
  const user = await Promise.race([
    service.fetchUser(123),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 5000)
    )
  ]);

  expect(user).toBeDefined();
});
```

**Error Testing:**
```typescript
import { test, expect } from "bun:test";

test("throws ValidationError on invalid email", () => {
  const service = new UserService();

  expect(() => {
    service.create({ email: "invalid" });
  }).toThrow(ValidationError);
});

// Test error message
test("error message includes field name", () => {
  const service = new UserService();

  expect(() => {
    service.create({ email: "invalid" });
  }).toThrow(/email/i);
});
```

**Testing React Components:**
```typescript
import { test, expect } from "bun:test";
import { createRoot } from "react-dom/client";
import { Button } from "./Button";

test("Button renders with label", () => {
  const container = document.createElement("div");
  const root = createRoot(container);

  root.render(<Button label="Click me" />);

  expect(container.textContent).toContain("Click me");
});

// With click event
test("Button calls onClick handler", () => {
  let clicked = false;
  const container = document.createElement("div");
  const root = createRoot(container);

  root.render(<Button label="Click" onClick={() => { clicked = true; }} />);

  const button = container.querySelector("button");
  button?.click();

  expect(clicked).toBe(true);
});
```

**Database Testing (bun:sqlite):**
```typescript
import { test, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { UserRepository } from "./user.repository";

let db: Database;
let repo: UserRepository;

beforeEach(() => {
  // Use in-memory database for tests
  db = new Database(":memory:");
  repo = new UserRepository(db);

  // Create schema
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL
    )
  `);
});

test("saves and retrieves user", () => {
  repo.save({ name: "Alice", email: "alice@example.com" });
  const user = repo.findByEmail("alice@example.com");

  expect(user?.name).toBe("Alice");
});
```

## Test Execution Context

**Node.js compatibility:** Tests run in Bun runtime (not Node.js)

**Global Variables Available:**
- `describe`, `test`, `it`, `expect` - From `bun:test`
- `console` - Standard console API
- `fetch` - Built-in Fetch API
- File system access via `Bun.file()` or `node:fs`

**Environment Variables:**
- Loaded automatically from `.env` file (Bun behavior)
- Access via `process.env.VAR_NAME`

## Debugging Tests

**Run single test:**
```bash
bun test user.test.ts
```

**Verbose output:**
```bash
bun test --verbose
```

**Inspect with console:**
```typescript
test("debug example", () => {
  const result = complexFunction();
  console.log("Result:", result); // Visible with --verbose
  expect(result).toBeDefined();
});
```

---

*Testing analysis: 2026-03-12*
