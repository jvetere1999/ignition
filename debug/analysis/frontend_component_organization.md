# FRONTEND COMPONENT ORGANIZATION ANALYSIS

**Component**: React/TypeScript component folder structure and organization  
**Scope**: Component hierarchy, naming conventions, code organization, index files  
**Key Directories**: 
- components/ (18 subdirectories, ~100+ component files)
- lib/hooks/ (centralized hook exports)
- lib/ui/ and components/ui/ (shared UI components)

**Issues Identified**: 9  
**Effort Estimate**: 1.5-2 hours  

**Issue Breakdown**:
- 3 Organization issues (unclear folder purpose, split ui components, inconsistent naming)
- 2 Index file issues (incomplete exports, re-exports)
- 2 Documentation issues (missing README, component purpose unclear)
- 2 Consistency issues (module.css patterns, props interface patterns)

**Critical Findings**: Component structure is functional but lacks clarity and consistency

---

## ISSUE CATEGORY: FOLDER ORGANIZATION (3 issues, 0.5 hours)

### Org-1: Unclear Purpose of Deep Component Folders
**Location**: components/ with 18+ subdirectories  
**Pattern**:

```
components/
  ├── audio/              ← Audio playback/visualization
  ├── admin/              ← Admin-only routes/components
  ├── ads/                ← Ad integration?
  ├── browser/            ← Browser detection/integration
  ├── debug/              ← Debug utilities
  ├── focus/              ← Focus session UI
  ├── learn/              ← Learning module UI
  ├── mobile/             ← Mobile-specific screens
  ├── onboarding/         ← First-run flow
  ├── player/             ← Alternative audio player?
  ├── progress/           ← Progress visualization?
  ├── references/         ← Reference library UI
  ├── settings/           ← Settings pages
  ├── shell/              ← Layout components (Header, Sidebar, etc.)
  ├── ui/                 ← Shared UI elements (Button, Card, etc.)
  ├── search/             ← Search UI
  ├── ads/                ← Ads UI?
  └── [others]/

// ISSUES:
// 1. Unclear distinction: audio/ vs player/ - what's the difference?
// 2. Unclear distinction: progress/ (is this tracking? visualization?)
// 3. ui/ in components/ui/ but also lib/ui/ (see SPLIT UI COMPONENTS)
// 4. No folder-level README explaining purpose
// 5. Some folders have 1-2 components, others have 10+
// 6. No clear pattern for when to create subfolder
// 7. Missing: What goes in shell/ vs root?
```

**Issue**:
1. **Unclear purpose**: Some folder names ambiguous (progress, ads)
2. **No documentation**: No README explaining each folder
3. **Inconsistent depth**: Some have 1 file, some have 10+
4. **No guidelines**: Hard to know where to put new component
5. **Naming confusion**: audio vs player, which one is what?

**Solution**: Document folder purposes and establish guidelines.

Create `components/README.md`:

```markdown
# Components Folder Structure

## Organization Principles
- Group related components by feature/domain
- Folders represent user-facing features or layout sections
- Use index.ts for barrel exports
- Keep component size reasonable (split if >400 lines)

## Folder Purposes

### Layout & Shell
- **shell/**: Main application shell components (AppShell, Header, Sidebar, etc.)
- **mobile/**: Mobile-specific screens and responsive layouts
- **progress/**: Progress visualization and tracking UI (progress bars, milestones)

### Content Features
- **audio/**: Audio playback, visualization, and analysis (comprehensive audio UI)
- **player/**: Alternative/legacy audio player components (migrate to audio/)
- **focus/**: Focus session UI (timer, track upload, indicators)
- **learn/**: Learning module UI (visualizers, tutorials)
- **references/**: Reference library UI and components

### User Features
- **onboarding/**: First-run onboarding flow (modal, provider, gate)
- **settings/**: Settings pages and UI
- **search/**: Search interface and results
- **admin/**: Admin-only routes and components

### Integration & Utilities
- **browser/**: Browser detection and feature integration (Zen Browser, etc.)
- **debug/**: Debug tools and overlays (not user-facing)
- **ads/**: Advertising integration UI

### Shared Components
- **ui/**: Reusable UI elements (Button, Card, EmptyState, LoadingState, etc.)

## Adding New Components

### If component is domain-specific:
```
components/myfeature/
  ├── MyComponent.tsx
  ├── MyComponent.module.css
  ├── MyComponentHelper.ts
  └── index.ts
```

### If component is reusable UI:
```
components/ui/
  ├── MyUiElement.tsx
  ├── MyUiElement.module.css
  └── (already exported from index.ts)
```

### If component is a page/screen:
```
components/myfeature/screens/
  ├── MyFeaturePage.tsx
  ├── MyFeatureList.tsx
  ├── MyFeatureDetail.tsx
  └── index.ts
```

## Index File Requirements
Each folder MUST have index.ts with barrel exports:
```typescript
export { MyComponent } from "./MyComponent";
export { MyHelper } from "./MyComponentHelper";
```

## Naming Conventions
- PascalCase for components: `MyComponent.tsx`
- camelCase for utilities: `myHelper.ts`
- `*.module.css` for component styles
- `*Provider.tsx` for context providers
- `use*` for custom hooks (in lib/hooks/)
```

**Impact**: Developers understand where to put new components, folders have clear purpose.  
**Effort**: 0.2 hours

---

### Org-2: Split UI Component System
**Location**: components/ui/ AND lib/ui/  
**Pattern**:

```typescript
// components/ui/ contains:
// Button, Card, EmptyState, ErrorBoundary, ErrorState, 
// LoadingState, OfflineStatusBanner, PageHeader, etc.

// Also in lib/ui/ (implied from earlier analysis)?
// Conflict: UI components in two places

// ISSUES:
// 1. Unclear which UI folder is authoritative
// 2. Developer doesn't know which to import from
// 3. Potential for duplication
// 4. Hard to maintain consistency across both
// 5. Makes tree-shaking harder

// Current pattern (probably):
import { Button } from "@/components/ui";  // ← or this?
import { Button } from "@/lib/ui";       // ← or this?
```

**Issue**:
1. **Dual systems**: UI components in two locations
2. **Unclear import path**: Developer confused which to use
3. **Hard to keep in sync**: Changes need duplicating
4. **Code duplication**: Same component might exist twice
5. **No clear split**: What goes in lib/ui vs components/ui?

**Solution**: Consolidate UI components into single location.

```typescript
// Option A: Consolidate into components/ui/ (simpler)
// Keep components/ui/ as primary
// Remove/migrate lib/ui/ 

// Update all imports:
import { Button } from "@/components/ui";
import { Card } from "@/components/ui";

// Update path alias if needed:
// In tsconfig.json:
{
  "compilerOptions": {
    "paths": {
      "@/ui": ["./src/components/ui"],  // New alias
      "@/components/*": ["./src/components/*"]
    }
  }
}

// Then can import as:
import { Button } from "@/ui";  // Shorter, unambiguous
```

**Impact**: Single source of truth for UI components, clearer imports.  
**Effort**: 0.3 hours (with codemod for imports)

---

### Org-3: Inconsistent Naming: "Provider" vs "Initializer"
**Location**: Multiple files use different patterns for similar purposes  
**Pattern**:

```typescript
// Same concept, different names:

// In components/
OnboardingProvider.tsx      // ← Provider
OnboardingModal.tsx         // ← Component
OnboardingGate.tsx          // ← Gate

ServiceWorkerRegistrar.tsx  // ← Registrar (not Provider)
OfflineQueueWorker.tsx      // ← Worker (not Provider)
ZenBrowserInitializer.tsx   // ← Initializer (not Provider)

// ISSUES:
// 1. What's the difference between Provider and Initializer?
// 2. When do we use "Registrar" vs "Provider"?
// 3. "Worker" suggests background work, but it's a component?
// 4. Naming is context-dependent, no clear pattern

// These all serve similar purposes:
// - Initialize something on component mount
// - Set up global behavior
// - Expose context/state
// - Only one per app (singleton-ish)

// But different names = confusion
```

**Issue**:
1. **Multiple naming patterns**: Provider, Initializer, Registrar, Worker
2. **No convention**: Unclear which pattern to use for new components
3. **Confusion**: What's the conceptual difference?
4. **Discoverability**: Hard to find similar components

**Solution**: Establish naming convention for singleton/initialization components.

```typescript
// Establish clear naming:

// *** Provider Pattern ***
// Use for: React Context providers that wrap app/section
// File: ComponentProvider.tsx
// Purpose: Provide context, state, and hooks to children

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(...);
  return (
    <OnboardingContext.Provider value={{ state, setState }}>
      {children}
    </OnboardingContext.Provider>
  );
}

// *** Initializer Pattern ***
// Use for: Non-context setup that runs on app load
// File: ComponentInitializer.tsx
// Purpose: Initialize browser APIs, register workers, set up listeners
// Usually doesn't return JSX, just returns null

export function ZenBrowserInitializer() {
  useEffect(() => {
    // Set up Zen Browser integration
    if (typeof window !== "undefined" && window.zenBrowser) {
      // Initialize...
    }
  }, []);
  return null;  // No UI output
}

// *** Gate Pattern ***
// Use for: Conditional rendering based on state
// File: ComponentGate.tsx
// Purpose: Render children only if condition met

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { isOnboardingComplete } = useOnboarding();
  if (!isOnboardingComplete) return null;
  return <>{children}</>;
}

// Update naming in codebase:
// ServiceWorkerRegistrar.tsx → ServiceWorkerInitializer.tsx
// OfflineQueueWorker.tsx → OfflineQueueInitializer.tsx

// Update all imports
// Document in components/README.md (see Org-1 solution)
```

**Impact**: Clear convention, easier to find and create new initialization components.  
**Effort**: 0.1 hours (after README created in Org-1)

---

## ISSUE CATEGORY: INDEX FILES (2 issues, 0.3 hours)

### Index-1: Incomplete Barrel Exports
**Location**: Multiple components/*/index.ts files  
**Pattern**:

```typescript
// components/onboarding/index.ts
export { OnboardingModal } from "./OnboardingModal";
export { OnboardingProvider } from "./OnboardingProvider";
// Missing: export { OnboardingGate } - not in index!

// components/learn/index.ts
export { LearningShell } from "./LearningShell";
// That's it - no other exports

// ISSUES:
// 1. Developer needs to know internal structure
//    import { OnboardingGate } from "@/components/onboarding/OnboardingGate";  // ← Violates barrel pattern
// 2. Incomplete exports = incomplete API
// 3. Can't use path alias benefits (tree shaking, refactoring)
// 4. Inconsistent: some folders complete, some incomplete
// 5. New components added but not exported
```

**Issue**:
1. **Incomplete exports**: Not all components exported
2. **Deep imports**: Developers resort to `../OnboardingGate` imports
3. **Inconsistent patterns**: Some folders export everything, some export nothing
4. **Hard to maintain**: Easy to forget new exports
5. **Tool limitations**: Can't refactor folders if imports are scattered

**Solution**: Audit and complete all barrel exports.

```typescript
// Audit script (check each folder):
// 1. List all *.tsx files
// 2. Check if exported in index.ts
// 3. Add missing exports

// components/onboarding/index.ts (AFTER)
export { OnboardingModal } from "./OnboardingModal";
export { OnboardingProvider } from "./OnboardingProvider";
export { OnboardingGate } from "./OnboardingGate";

// components/learn/index.ts (AFTER)
export { LearningShell } from "./LearningShell";

// components/focus/index.ts (AFTER)
export { FocusIndicator } from "./FocusIndicator";
export { FocusTrackUpload } from "./FocusTrackUpload";
export { FocusTracks } from "./FocusTracks";

// Establish rule in README:
// "All public components must be exported from index.ts.
//  Developers should import from folder, never from specific file:
//  ✅ import { OnboardingGate } from '@/components/onboarding';
//  ❌ import { OnboardingGate } from '@/components/onboarding/OnboardingGate';"

// Enforce with ESLint rule (eslint-plugin-import):
// "no-relative-parent-imports": error
// "no-restricted-imports": ["error", {
//   "patterns": ["@/components/*/*.tsx"]  // ← Prevent direct file imports
// }]
```

**Impact**: Consistent barrel export pattern, prevents deep imports, enables refactoring.  
**Effort**: 0.2 hours

---

### Index-2: No Re-exports for Common Patterns
**Location**: components/index.ts doesn't exist or is incomplete  
**Pattern**:

```typescript
// Current: Each folder has own index.ts
import { OnboardingModal } from "@/components/onboarding";
import { FocusIndicator } from "@/components/focus";
import { Button } from "@/components/ui";
import { AppShell } from "@/components/shell";

// Missing: No top-level components/index.ts
// Could provide:
export * from "./onboarding";
export * from "./focus";
export * from "./ui";
export * from "./shell";
// ... etc

// Then import from single location:
import {
  OnboardingModal,
  FocusIndicator,
  Button,
  AppShell,
} from "@/components";

// ISSUES:
// 1. Developers unsure what's available
// 2. Multiple import statements scattered
// 3. No "catalog" of available components
// 4. Hard to discover what components exist
// 5. Makes it easier to duplicate work
```

**Issue**:
1. **No discovery mechanism**: Hard to find available components
2. **Scattered imports**: Each file imports differently
3. **No API documentation**: What components are available?
4. **No single source of truth**: Where to import from?
5. **Code duplication**: Developers create new when one exists

**Solution**: Create top-level index and component catalog.

```typescript
// components/index.ts (NEW FILE)
// ===== SHELL & LAYOUT =====
export { AppShell } from "./shell";
export { Header } from "./shell/Header";
export { Sidebar } from "./shell/Sidebar";
export { BottomBar } from "./shell/BottomBar";
// ... etc

// ===== ONBOARDING =====
export * from "./onboarding";

// ===== FOCUS =====
export * from "./focus";

// ===== PLAYER & AUDIO =====
export * from "./player";
export * from "./audio";

// ===== UI COMPONENTS =====
export * from "./ui";

// Then create components/COMPONENT_CATALOG.md:
/*
# Component Catalog

## Shell & Layout
- `<AppShell>` - Main application wrapper
- `<Header>` - Top navigation
- `<Sidebar>` - Side navigation
- `<BottomBar>` - Bottom navigation

## Onboarding
- `<OnboardingModal>` - Onboarding flow
- `<OnboardingProvider>` - Onboarding context
- `<OnboardingGate>` - Show content after onboarding

## Focus
- `<FocusIndicator>` - Active focus session indicator
- `<FocusTrackUpload>` - Upload tracks for session
- `<FocusTracks>` - Display focus tracks

## UI Components
- `<Button>` - Standard button
- `<Card>` - Card container
- `<ErrorState>` - Error display
- `<LoadingState>` - Loading state
- ... more

Import all from @/components:
\`\`\`
import { Button, Card, AppShell } from "@/components";
\`\`\`
*/
```

**Impact**: Single import location, component discovery, prevents duplication.  
**Effort**: 0.15 hours

---

## ISSUE CATEGORY: DOCUMENTATION (2 issues, 0.3 hours)

### Doc-1: Missing Component Documentation
**Location**: Component files lack clear documentation  
**Pattern**:

```typescript
// AudioSegment.tsx (533 lines)
/**
 * AudioSegment Component
 *
 * DROP-IN REPLACEMENT INTEGRATION GUIDE
 * =====================================
 *
 * This component is designed to replace an existing visualizer section.
 * To integrate:
 *
 * 1. Import the component:
 *    import { AudioSegment } from "@/components/audio/AudioSegment";
 *
 * 2. Replace your existing visualizer with:
 *    <AudioSegment
 *      src="/path/to/audio.mp3"
 *      title="Track Title"
 *      artist="Artist Name"
 *      artwork="/path/to/artwork.jpg"
 *    />
 * ...
 */

// OnboardingModal.tsx (500+ lines)
/**
 * OnboardingModal - Guided first-run tutorial
 * Data-driven, versioned, resumable onboarding flow
 */

// SOME HAVE GOOD DOCS, OTHERS DON'T:
// Good: AudioSegment (detailed integration guide)
// Good: OnboardingModal (clear purpose)
// Bad: Most other components (no top comment)

// MISSING DOCUMENTATION:
// 1. What problem does this solve?
// 2. When should I use this vs that?
// 3. What props are required?
// 4. What are the side effects?
// 5. Are there accessibility considerations?
```

**Issue**:
1. **Inconsistent documentation**: Some great, most missing
2. **No standard format**: Each file documents differently
3. **Missing prop documentation**: Props interface not explained
4. **No usage examples**: Developers guess at usage
5. **No accessibility notes**: Potential a11y issues

**Solution**: Create documentation template for components.

```typescript
// Template for component files
/**
 * ComponentName - One-line summary
 *
 * DESCRIPTION:
 * What problem does this solve? When should it be used?
 * What's the user experience?
 *
 * USAGE:
 * <ComponentName required={value} optional="value" >
 *   Children content
 * </ComponentName>
 *
 * ACCESSIBILITY:
 * - Uses semantic HTML (role="region")
 * - Keyboard navigation: Tab/Enter to interact
 * - Screen reader: Announces state changes
 *
 * DEPENDENCIES:
 * - Uses context from ComponentProvider
 * - Requires AuthProvider
 *
 * SIDE EFFECTS:
 * - Calls API on mount to fetch data
 * - Updates localStorage with user preferences
 *
 * TODO / KNOWN ISSUES:
 * - CSP violation in production (inline styles)
 * - Mobile view not tested on iOS Safari
 */

"use client";

import { ComponentType, useCallback } from "react";
import styles from "./Component.module.css";

interface ComponentProps {
  /** Required prop description */
  required: string;
  /** Optional prop description, defaults to undefined */
  optional?: string;
  /** Callback when action occurs */
  onAction?: (data: ActionData) => void;
}

export function ComponentName({
  required,
  optional,
  onAction,
}: ComponentProps) {
  // ...
}
```

**Impact**: Consistent documentation, easier onboarding, fewer integration mistakes.  
**Effort**: 0.15 hours (template) + time to fill in per component

---

### Doc-2: No ARCHITECTURE.md for Component Patterns
**Location**: No documentation of component architecture decisions  
**Pattern**:

```typescript
// Decisions made but not documented:

// 1. When to use Client vs Server components?
// "use client" in AudioSegment, OnboardingModal, AppShell
// But unclear if there's a pattern

// 2. Context vs Hooks?
// AuthProvider uses context
// Focus uses hooks (useAutoRefresh, etc.)
// Why different?

// 3. State management?
// useState in AppShell (local state)
// useContext in components (shared state)
// useReducer? (not seen)

// 4. Error handling?
// Some components use try/catch
// Others don't
// How should errors be handled?

// 5. Styling?
// *.module.css everywhere
// Tailwind? (not seen)
// Emotion? (not seen)
// Consistent across codebase?

// NO DOCUMENTATION ANSWERS THESE QUESTIONS
```

**Issue**:
1. **No architecture documentation**: Patterns exist but undocumented
2. **Inconsistent decisions**: New developers guess
3. **No rationale**: Why were certain patterns chosen?
4. **Hard to maintain consistency**: Can't enforce patterns
5. **Onboarding slow**: Developers need to read lots of code

**Solution**: Create ARCHITECTURE.md for frontend patterns.

```markdown
# Frontend Component Architecture

## Guiding Principles
- Components are React functional components using TypeScript
- Styling uses CSS Modules (*.module.css)
- State management uses React context for global state, hooks for local
- All user-interactive components use "use client" directive

## Client vs Server Components
### Use Server Components (Remove "use client") when:
- Component is purely presentational (no interactivity)
- Component doesn't use hooks (useState, useContext, etc.)
- Component doesn't need event handlers
- Example: Layout shells, static pages

### Use Client Components ("use client") when:
- Component manages state (useState, useContext)
- Component has event handlers (onClick, onChange)
- Component uses browser APIs (localStorage, sessionStorage)
- Component uses hooks (useEffect, useCallback)
- Example: Forms, modals, interactive components

## Context vs Hooks
### Use React Context when:
- State needs to be shared across multiple components
- State is global or section-wide (e.g., auth, theme)
- Consumer components are far down tree
- Example: AuthProvider, FocusStateProvider

### Use Hooks when:
- State is local to a component or small subtree
- State is derived or computed
- State is temporary (session-only)
- Example: useAutoRefresh, useErrorNotification

## Error Handling
All components that call APIs must:
1. Wrap fetch calls in try/catch
2. Render ErrorState or show notification on error
3. Log errors to console (development)
4. Provide user-friendly error messages

Example:
\`\`\`typescript
try {
  const data = await fetch(...);
} catch (error) {
  tracing.error("Failed to load data", error);
  return <ErrorState message="Failed to load. Please try again." />;
}
\`\`\`

## Styling
- All component styles use CSS Modules (*.module.css)
- No inline styles unless absolutely necessary
- No Tailwind classes
- No emotion/styled-components
- CSS should be well-organized and follow BEM-like naming

Example:
\`\`\`typescript
import styles from "./MyComponent.module.css";

export function MyComponent() {
  return <div className={styles.container}>...</div>;
}
\`\`\`

## Component Size
- Components > 400 lines should be split into smaller components
- Keep render logic simple, extract complex logic to hooks/utils
- If component has many props (>8), consider breaking into subcomponents

## Testing
- Unit tests use Vitest
- Integration tests use Playwright
- All API calls should be mocked in unit tests
- See tests/ for test organization

## Naming Conventions
- Components: PascalCase (MyComponent.tsx)
- Utilities: camelCase (myUtil.ts)
- Hooks: useHookName (in lib/hooks/)
- CSS classes: camelCase or kebab-case (consistent within file)
- Types/Interfaces: PascalCase (MyComponentProps)
```

**Impact**: New developers understand patterns, consistency enforced, faster onboarding.  
**Effort**: 0.3 hours

---

## ISSUE CATEGORY: CONSISTENCY (2 issues, 0.3 hours)

### Const-1: Inconsistent CSS Module Patterns
**Location**: *.module.css files inconsistently named  
**Pattern**:

```typescript
// Most follow pattern: ComponentName.module.css matching ComponentName.tsx

AudioSegment.module.css     ← Matches AudioSegment.tsx ✓
Button.module.css           ← Matches Button.tsx ✓

// But some deviate:
LearningShell.module.css    ← Matches LearningShell.tsx ✓
Visualizers.module.css      ← In visualizers/ folder, corresponds to multiple .tsx files ✗

OnboardingModal.module.css  ← Matches OnboardingModal.tsx ✓

// ALSO INCONSISTENT: CSS class naming conventions

// Some files use camelCase for classes:
// styles.container, styles.header, styles.inputField

// Others use kebab-case:
// .modal-header, .modal-body, .modal-footer

// Some mix:
// .container, .modal-header (both in same file!)

// ISSUES:
// 1. Multiple CSS files in folder is confusing
// 2. Developer doesn't know which CSS file to edit
// 3. Class naming inconsistent across codebase
// 4. Hard to maintain (is it camelCase or kebab-case?)
// 5. Could lead to unused CSS classes
```

**Issue**:
1. **Multiple CSS files in folder**: Unclear which CSS belongs where
2. **Inconsistent class naming**: camelCase vs kebab-case
3. **Hard to find styles**: Developer unsure which .module.css file to edit
4. **Duplicated classes**: Same class name in different files
5. **Refactoring hard**: Can't easily move component + styles

**Solution**: Standardize CSS module naming and class conventions.

```typescript
// Rule 1: One CSS file per component
// Keep 1:1 mapping between ComponentName.tsx and ComponentName.module.css
// If folder has multiple components, each gets own CSS:

components/
  ├── onboarding/
  │   ├── OnboardingModal.tsx
  │   ├── OnboardingModal.module.css  ← Styles for Modal
  │   ├── OnboardingProvider.tsx
  │   ├── OnboardingProvider.module.css  ← If needed
  │   ├── OnboardingGate.tsx           ← No CSS if just wrapper
  │   └── index.ts

// Rule 2: Consistent class naming (camelCase)
// Use camelCase for all CSS classes (matches CSS modules convention)

// OnboardingModal.module.css
.root {
  /* Top-level container */
}

.header {
  /* Header section */
}

.headerTitle {
  /* Title inside header */
}

.body {
  /* Body section */
}

.footer {
  /* Footer section */
}

// NOT: .modal-header, .header_title, .Header

// Rule 3: Import and use consistently
import styles from "./OnboardingModal.module.css";

export function OnboardingModal() {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Title</h1>
      </div>
      <div className={styles.body}>
        {/* content */}
      </div>
      <div className={styles.footer}>
        {/* footer */}
      </div>
    </div>
  );
}
```

**Impact**: Clear 1:1 mapping, consistent naming, easier to maintain styles.  
**Effort**: 0.2 hours (establish rule) + time to migrate existing files

---

### Const-2: Inconsistent Props Interface Naming
**Location**: Component files name Props interfaces differently  
**Pattern**:

```typescript
// Pattern 1: ComponentNameProps (most common)
interface OnboardingModalProps {
  initialState: OnboardingState | null;
  flow: OnboardingFlow | null;
  userId: string;
}

export function OnboardingModal(props: OnboardingModalProps) { ... }

// Pattern 2: No interface, inline props
export function AudioSegment({
  src,
  title,
  artist,
}: {
  src: string;
  title: string;
  artist: string;
}) { ... }

// Pattern 3: React.FC with Props
interface DebugOverlayProps {
  visible: boolean;
  data?: DebugData;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ visible, data }) => { ... }

// ISSUES:
// 1. No consistent naming: Props vs PropsType vs ComponentProps
// 2. Some use inline, some use interface
// 3. Some use React.FC, most use function declarations
// 4. Inconsistent type export (some export Props, some don't)
// 5. Makes codebase hard to read - mixed patterns
```

**Issue**:
1. **Multiple patterns**: Props, inline types, React.FC all used
2. **Inconsistent export**: Some export Props interface, some don't
3. **Hard to document**: Props interface should be easy to find
4. **Poor discoverability**: Developer can't quickly see available props
5. **Refactoring hard**: Can't easily find all uses of Props interface

**Solution**: Establish single props pattern.

```typescript
// STANDARD PATTERN: ComponentNameProps interface, exported

/**
 * OnboardingModal - Guided first-run tutorial
 *
 * Props:
 * - initialState: Current onboarding progress
 * - flow: Onboarding flow definition
 * - userId: User being onboarded
 */
interface OnboardingModalProps {
  initialState: OnboardingState | null;
  flow: OnboardingFlow | null;
  userId: string;
}

export function OnboardingModal({
  initialState,
  flow,
  userId,
}: OnboardingModalProps) {
  // Component body
}

// Export Props interface for users who need it
export type { OnboardingModalProps };

// Benefits:
// 1. Consistent pattern across all components
// 2. Props interface always ComponentNameProps
// 3. Users can import props type if needed:
//    import type { OnboardingModalProps } from "@/components/onboarding";
// 4. Easy to document (interface near component)
// 5. Easy to find (search for ComponentNameProps)

// Rule in components/README.md:
/*
All components must:
1. Define Props interface as ComponentNameProps
2. Export the Props type
3. Use destructuring in function signature
4. Avoid React.FC (use function declaration)
5. Avoid inline props types
*/
```

**Impact**: Consistent props pattern, easier to document and discover props, better discoverability.  
**Effort**: 0.1 hours (establish rule) + time to update existing components

---

## IMPLEMENTATION ROADMAP

### Phase 1: Document Folder Organization (0.2 hours)
- [ ] Create components/README.md
- [ ] Explain each folder purpose
- [ ] Document naming conventions
- [ ] Add guidelines for creating new components

### Phase 2: Standardize UI Components Location (0.3 hours)
- [ ] Audit components/ui/ and lib/ui/ for duplication
- [ ] Consolidate into single location (components/ui/)
- [ ] Update all imports (use codemod)
- [ ] Remove redundant folder

### Phase 3: Complete Barrel Exports (0.2 hours)
- [ ] Audit each components/*/index.ts
- [ ] Add missing exports
- [ ] Create components/index.ts with re-exports
- [ ] Add ESLint rule to prevent deep imports

### Phase 4: Rename Initialization Components (0.1 hours)
- [ ] ServiceWorkerRegistrar → ServiceWorkerInitializer
- [ ] OfflineQueueWorker → OfflineQueueInitializer
- [ ] Update all imports

### Phase 5: Document Component Architecture (0.3 hours)
- [ ] Create ARCHITECTURE.md
- [ ] Document client vs server components
- [ ] Document context vs hooks patterns
- [ ] Document error handling patterns

### Phase 6: Standardize Props Interfaces (0.15 hours)
- [ ] Create linting rule for props naming
- [ ] Update all components to use ComponentNameProps
- [ ] Export Props types from index.ts

### Phase 7: Standardize CSS Module Patterns (0.2 hours)
- [ ] Establish 1:1 mapping rule (Component.tsx ↔ Component.module.css)
- [ ] Standardize class naming (camelCase only)
- [ ] Update existing files to follow pattern

### Phase 8: Create Component Catalog (0.15 hours)
- [ ] Create COMPONENT_CATALOG.md
- [ ] List all major components
- [ ] Add usage examples
- [ ] Add categories/groupings

---

## VALIDATION CHECKLIST

### Organization
- [ ] Each folder has documented purpose
- [ ] Folder structure matches feature/domain organization
- [ ] Deep component nesting limited (max 3 levels)
- [ ] No component folders with single file (unless special case)

### Index Files
- [ ] All public components exported from index.ts
- [ ] No deep imports (e.g., @/components/onboarding/Modal.tsx)
- [ ] ESLint rule prevents deep imports
- [ ] Top-level components/index.ts exists and exports all

### Documentation
- [ ] Each component has documentation comment
- [ ] ARCHITECTURE.md exists and covers patterns
- [ ] COMPONENT_CATALOG.md lists available components
- [ ] components/README.md explains folder structure

### Consistency
- [ ] All Props interfaces named ComponentNameProps
- [ ] All Props interfaces exported
- [ ] All CSS files named Component.module.css
- [ ] All CSS classes use camelCase
- [ ] No React.FC usage

### Naming
- [ ] Components: PascalCase
- [ ] Utilities: camelCase
- [ ] CSS classes: camelCase
- [ ] Providers/Initializers: Clear naming pattern

---

## SUMMARY

Frontend component organization is **functional but lacks structure and documentation**:

**Highest Priority**: Document folder structure and establish naming conventions.

**Important**: Consolidate split UI systems and complete barrel exports.

**Quality**: Standardize props interfaces and CSS patterns.

**Quick Wins**:
- Create components/README.md (0.2 hours)
- Document folder purposes (0.1 hours)
- Complete barrel exports (0.2 hours)
- Create ARCHITECTURE.md (0.3 hours)
- Establish props naming rule (0.1 hours)

**Total Effort**: 1.5-2 hours for significant organizational improvement.

**ROI**:
- Developers understand where to put new components
- Consistent import patterns (tree-shakeable, refactorable)
- Better component discovery (what's available?)
- Faster onboarding (architecture documented)
- Easier maintenance (consistent patterns)
