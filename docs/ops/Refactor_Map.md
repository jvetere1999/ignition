# Refactor Map

## Overview

This document tracks code extraction, consolidation, and organization improvements.

**Last Updated:** January 5, 2026

---

## Completed Extractions

### 1. Storage Keys Consolidation

**Status:** COMPLETE

**Location:** `src/lib/storage/keys.ts`

**Extracted:**
- `SESSION_KEYS` - All sessionStorage key constants
- `LOCAL_KEYS` - All localStorage key constants
- `TIME_CONSTANTS` - Gap thresholds, intervals

**Usage:** Import from `@/lib/storage` or `@/lib/storage/keys`

---

### 2. Feature Inventory System

**Status:** COMPLETE

**Location:** `src/lib/data/featureInventory.ts`

**Contents:**
- `FEATURE_INVENTORY` - Complete feature registry
- `getFeaturesByCategory()` - Filter by category
- `getPrimaryEligibleFeatures()` - Starter block candidates
- `getDoFeatures()` - Execution features
- `getExploreFeatures()` - Browse features

**Usage:** Import from `@/lib/data/featureInventory`

---

### 3. Camelot Wheel Data

**Status:** COMPLETE

**Location:** `src/lib/data/camelotWheel.ts`

**Contents:**
- `KEYS` - All 24 key mappings
- `getKeyByCamelot()` - Lookup by notation
- `getCompatibleKeys()` - Harmonic mixing rules
- `getCircleOfFifthsRelationships()` - Theory mode
- `getMinorKeys()` / `getMajorKeys()` - Ring helpers

---

### 4. Error Boundary Component

**Status:** COMPLETE

**Location:** `src/components/ui/ErrorBoundary.tsx`

**Contents:**
- `ErrorBoundary` - Class component wrapper
- `SectionErrorFallback` - Minimal fallback UI

**Usage:** Wrap components that may fail independently

---

## Pending Extractions

### 5. Today User State Builder

**Status:** NOT STARTED

**Proposed Location:** `src/lib/today/buildTodayUserState.ts`

**Purpose:** Centralize server-side state computation currently inline in page.tsx

---

### 6. UI Primitives Extraction

**Status:** NOT STARTED

**Candidates:**
- `BannerShell` - Repeated banner patterns
- `SectionShell` - Collapsible section wrapper
- `InlineNotice` - Info/warning notices

---

## Module Boundaries

### Flags
- Entry: `src/lib/flags/index.ts`
- All flags return `true` (permanently enabled)

### Today Engine
- Entry: `src/lib/today/index.ts`
- Visibility, resolver, momentum, soft landing, safety nets

### Database Repos
- Entry: `src/lib/db/repositories/`
- No SQL outside repositories

### Storage
- Entry: `src/lib/storage/index.ts`
- R2 client + key constants

---

## Import Layering Rules

1. Components may import from `lib/*`
2. `lib/*` modules must not import components
3. `lib/db/*` must not import from `lib/today/*`
4. `lib/flags/*` may be imported anywhere

---

## Deferred Work

- Performance: Code-split ExploreDrawer
- Performance: Reduce duplicate plan fetches
- Types: Remove remaining `any` usages

