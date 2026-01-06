# Copilot Instructions - Ignition

## Project Context

Ignition is a Next.js 16 + React 19 full-stack application deployed to Cloudflare Workers via OpenNext.

**What Ignition Is:**
- A starter engine that helps users begin with minimal friction
- Momentum-oriented, not productivity-focused
- Calm, direct, non-guilting

**What Ignition Is NOT:**
- Not a planner
- Not a habit tracker
- Not a "do more" system

**Stack:**
- Next.js 16 (App Router)
- React 19
- TypeScript 5.7
- Auth.js (NextAuth v5) with D1 adapter
- Cloudflare D1 (SQLite database)
- Cloudflare R2 (blob storage)
- Vitest (unit tests) + Playwright (E2E tests)

---

## Prime Directives

- Preserve functionality; no regressions.
- Optimize for safety and efficiency; prefer incremental, reversible changes.
- Online-first architecture; D1 is source of truth.
- No additional storage systems beyond D1 and R2.
- Suspected un-surfaced features must be quarantined behind feature flags; do not delete them.

---

## Strict Quality Gate (Non-negotiable)

Before any "execution" step (tests, builds, deploy, migrations, CI run commands, or any step that produces artifacts used for release):
- There must be zero errors.
- There must be zero warnings in:
    - TypeScript typecheck
    - lint
    - unit tests
    - E2E tests
    - build outputs

If warnings cannot be eliminated due to external tool noise, explicitly document:
- the exact warning text
- why it is unavoidable
- the plan to remove it
  and treat this as an exception requiring explicit user approval.

---

## Repo Policy: Markdown Locations (REQUIRED)

- Outside of `/docs` and `/agent`, the ONLY allowed `.md` file is `/README.md`.
- Any `*.md` file outside `/docs`, `/agent`, or `/README.md` must be moved into `/docs` or `/agent` (or removed if redundant).
- Add/maintain a lightweight check to prevent future violations.

---

## Work Discipline: Branch and State Tracking (REQUIRED)

For any cleanup/optimization work:
1) Create a dedicated branch first:
    - `chore/cleanup-optimization-<YYYYMMDD>`
2) Maintain state tracking files throughout the work:
    - `agent/CURRENT_STATE.md` (always-current baseline and final state)
    - `agent/PROGRESS.md` (live checklist)
3) When acceptance criteria are satisfied:
    - archive `agent/PROGRESS.md` to `agent/archive/progress-<YYYYMMDD-HHMM>.md`
    - reset `agent/PROGRESS.md` to a short completion summary with pointers to archives and snapshots

---

## Regression Safety: Snapshots and Validation (REQUIRED)

For optimization/cleanup tasks:
- Create a pre-change screenshot snapshot with Playwright:
    - Save to `docs/snapshots/pre/<YYYYMMDD-HHMM>/*.png`
- Run validations pre-change and record results in `agent/CURRENT_STATE.md`.
- After changes:
    - Re-run validations (zero warnings/errors requirement applies)
    - Create post-change screenshots:
        - `docs/snapshots/post/<YYYYMMDD-HHMM>/*.png`
    - Compare against baseline and record results.

---

## Terminal / Execution Rules (Non-negotiable)

- Complete all intended code changes before running any terminal command.
- You cannot read terminal output. Treat terminal output as inaccessible.
- For any command execution:
    - Redirect stdout+stderr to a log file: `> .tmp/<name>.log 2>&1`
    - Read the log file directly (via file viewer/editor API).
- Never use `cat` (or equivalents like `type`, `more`, `less`, `tail`, `head`) to read logs.
- Do not run commands "to see what happens" mid-edit. Edit first, then validate.

---

## Style Rules

- No emojis in code, UI, comments, tests, docs.
- Use Unicode symbols for simple marks: `->`, `<-`, `*`, `-`
- Use SVG for complex icons matching project style.

---

## Code Conventions

### File Organization

```
src/
  app/           # Next.js App Router pages
  components/    # React components
    shell/       # Layout (Header, Sidebar, AppShell)
    ui/          # Base components (Button, Card)
  lib/           # Shared utilities
    auth/        # Auth.js config
    db/          # D1 repositories
    storage/     # R2 client
    data/        # Static data
    theme/       # Theme provider
  styles/        # CSS tokens
```

### Component Patterns

- Server Components by default (no "use client" unless needed)
- Client Components for interactivity (theme, forms, timers)
- CSS Modules for styling (`Component.module.css`)
- Use design tokens from `src/styles/tokens.css`

### CSS Design Tokens (REQUIRED)

All CSS must use the correct token names from `src/styles/tokens.css`.

#### Spacing (use `--space-*`, NOT `--spacing-*`)
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
```

#### Colors (use full names, NOT shorthand)
```css
/* Backgrounds */
--color-bg-primary
--color-bg-secondary
--color-bg-tertiary

/* Text */
--color-text-primary
--color-text-secondary
--color-text-muted
--color-text-inverse

/* Borders */
--color-border-primary
--color-border-secondary

/* Accents */
--color-accent-primary
--color-accent-primary-hover

/* Semantic */
--color-success, --color-success-bg
--color-warning, --color-warning-bg
--color-error, --color-error-bg
--color-info, --color-info-bg
```

#### Typography
```css
--font-size-xs, --font-size-sm, --font-size-base, --font-size-lg, --font-size-xl, --font-size-2xl, --font-size-3xl
--font-weight-normal, --font-weight-medium, --font-weight-semibold, --font-weight-bold
--line-height-tight, --line-height-normal, --line-height-relaxed
```

#### Border Radius
```css
--radius-sm, --radius-md, --radius-lg, --radius-xl, --radius-full
```

#### Transitions
```css
--transition-fast
```

### API Routes

- Edge runtime compatible (no Node.js APIs)
- Validate inputs with Zod or manual guards
- Return typed JSON responses
- Handle errors gracefully
- Never leak secrets in logs or responses

### Database

- Use repository pattern in `src/lib/db/repositories/`
- Validate inputs before database operations
- Use parameterized queries (no string interpolation)
- Type all entities in `src/lib/db/types.ts`

---

## Cleanup/Optimization Classification (REQUIRED)

When removing or changing code during cleanup:
- Classify each candidate as one of:
    - Remove
    - Deprecate
    - Quarantine
    - Keep
- "Remove" requires evidence:
    - no references in code
    - not part of documented or likely un-surfaced feature
    - not referenced by tests or scripts
- "Deprecate" must:
    - keep behavior unchanged
    - include a clear comment and planned removal criteria
- "Quarantine" must:
    - add an explicit feature flag gate
    - default OFF unless currently ON
    - document the flag in `/docs/feature-flags.md`

---

## Duplicate Code Extraction (REQUIRED)

During cleanup/optimization, actively look for duplication and consolidate safely:
- repeated validation logic -> shared validators
- repeated D1 query patterns -> shared query helpers
- repeated response shaping -> shared response helpers
- repeated client-side utilities -> shared utilities

If dedup risks subtle behavioral differences, prefer Deprecate/Quarantine and document the rationale.

---

## Testing Requirements

### Unit Tests (Vitest)

- Colocate in `__tests__/` directories
- Test pure functions and utilities
- Mock external dependencies (D1, R2)

### E2E Tests (Playwright)

- Place in `tests/*.spec.ts`
- Test user flows and page behavior
- Use test helpers from `tests/helpers/`

---

## Security Defaults

- No secrets in code; use environment variables
- Validate all external inputs
- Use parameterized database queries
- Set secure cookie options
- Rate limit API routes where appropriate

### User Creation Invariants (CRITICAL)

- NEVER create users without a valid email address
- The `users` table has `name NOT NULL` and `email NOT NULL` constraints
- `ensureUserExists()` must throw an error if `userData.email` is missing
- If user creation fails, the request should fail - do not use fake emails like `@unknown.local`
- When a user exists by email but with a different ID (OAuth provider switch), return the existing user

---

## Storage Rules (D1/R2/localStorage)

D1 (Required for):
- All user data, preferences, progress
- Session state that affects behavior across devices
- Gamification (points, achievements, streaks)
- Market (wallet, purchases)
- Onboarding state
- Module weights and interests

R2 (Only for):
- Audio files
- User-uploaded blobs
- Large binary assets

localStorage (Only for cosmetic UI):
- Theme preference
- Collapsed sidebar state
- UI preferences that don't affect logic

Forbidden in localStorage:
- Wallet/balance data
- Focus pause state
- Onboarding progress
- Module weights
- Any data used in `resolveNextAction`
