# Components Folder Structure

**Last Updated**: January 17, 2026  
**Status**: Active Reference Guide  
**Related Task**: FRONT-001

---

## Organization Principles

- **Feature-Based Organization**: Group related components by user-facing feature or domain
- **Single Responsibility**: Each folder represents a cohesive feature or UI domain
- **Barrel Exports**: Use `index.ts` in each folder for clean imports
- **Size Management**: Keep component files reasonable (split if >400 lines of code)
- **Naming Clarity**: Folder and file names clearly indicate purpose
- **Documentation**: Each major folder has a README explaining its contents

---

## Folder Structure Overview

```
src/components/
├── README.md                    # This file
├── ARCHITECTURE.md              # Component architecture patterns
├── COMPONENT_CATALOG.md         # Inventory of all major components
│
├── shell/                       # Application shell and layout
│   ├── AppShell.tsx            # Main application container
│   ├── Header.tsx              # Top navigation bar
│   ├── Sidebar.tsx             # Main navigation sidebar
│   └── index.ts
│
├── ui/                          # Shared UI components & primitives
│   ├── Button.tsx              # Reusable button component
│   ├── Card.tsx                # Card container component
│   ├── Modal.tsx               # Modal dialog component
│   └── index.ts
│
├── auth/                        # Authentication components
│   ├── LoginForm.tsx           # User login
│   ├── SignupForm.tsx          # User registration
│   └── index.ts
│
├── focus/                       # Focus session timer UI
│   ├── FocusTimer.tsx          # Main timer display
│   ├── FocusHistory.tsx        # Past sessions
│   ├── TrackUpload.tsx         # Audio track upload
│   └── index.ts
│
├── audio/                       # Audio playback & visualization
│   ├── AudioPlayer.tsx         # Full audio player
│   ├── Visualizer.tsx          # Waveform visualization
│   ├── VolumeControl.tsx       # Volume slider
│   └── index.ts
│
├── progress/                    # Progress visualization
│   ├── ProgressBar.tsx         # Linear progress indicator
│   ├── LevelCard.tsx           # Current level display
│   ├── XPCounter.tsx           # XP accumulation display
│   └── index.ts
│
├── learn/                       # Learning module UI
│   ├── LessonCard.tsx          # Individual lesson card
│   ├── CourseList.tsx          # Available courses
│   ├── Visualizer.tsx          # Learning visualization
│   └── index.ts
│
├── settings/                    # User settings pages
│   ├── SettingsPanel.tsx       # Settings container
│   ├── PreferencesForm.tsx     # User preferences
│   ├── NotificationSettings.tsx # Notification config
│   └── index.ts
│
├── admin/                       # Admin-only components
│   ├── AdminDashboard.tsx      # Admin overview
│   ├── UserManagement.tsx      # Manage users
│   ├── ApiTester.tsx           # API testing tool
│   └── index.ts
│
├── onboarding/                  # First-run onboarding flow
│   ├── OnboardingFlow.tsx      # Main onboarding sequence
│   ├── FeatureIntro.tsx        # Feature introduction
│   ├── OnboardingModal.tsx     # Onboarding modal
│   └── index.ts
│
├── references/                  # Reference library
│   ├── ReferenceList.tsx       # Reference browser
│   ├── ReferenceDetail.tsx     # Reference details
│   ├── SearchBar.tsx           # Reference search
│   └── index.ts
│
├── search/                      # Search interface
│   ├── SearchInput.tsx         # Search field
│   ├── SearchResults.tsx       # Results display
│   ├── Filters.tsx             # Search filters
│   └── index.ts
│
├── mobile/                      # Mobile-specific screens
│   ├── MobileNav.tsx           # Mobile navigation
│   ├── MobileMenu.tsx          # Mobile menu
│   ├── MobileHome.tsx          # Mobile home screen
│   └── index.ts
│
├── providers/                   # Context providers
│   ├── AuthProvider.tsx        # Authentication context
│   ├── ThemeProvider.tsx       # Theme context
│   ├── SyncStateProvider.tsx   # Sync state context
│   └── index.ts
│
├── vault/                       # Vault/security features
│   ├── VaultLock.tsx           # Vault lock UI
│   ├── UnlockForm.tsx          # Unlock form
│   └── index.ts
│
├── player/                      # Legacy audio player
│   ├── LegacyPlayer.tsx        # Keep for backward compatibility
│   └── index.ts                # DEPRECATION: Migrate to audio/
│
├── ads/                         # Ad integration components
│   ├── AdContainer.tsx         # Ad display wrapper
│   ├── AdLoader.tsx            # Ad loading
│   └── index.ts
│
├── browser/                     # Browser detection & support
│   ├── BrowserDetect.tsx       # Browser detection
│   ├── UnsupportedBrowser.tsx  # Unsupported browser message
│   └── index.ts
│
├── debug/                       # Debug utilities
│   ├── DebugPanel.tsx          # Debug information
│   ├── StateInspector.tsx      # State inspection
│   └── index.ts
│
├── Search/                      # (LEGACY - consolidate to search/)
│   └── [deprecated files]
│
├── index.ts                     # Main barrel export
│
└── OfflineQueueWorker.tsx       # Offline queue management
└── ServiceWorkerRegistrar.tsx   # Service worker registration
```

---

## Folder Purposes

### Core Layout & Navigation

#### **shell/** (Main application shell)
- **Purpose**: Application-wide layout structure
- **Contains**: AppShell, Header, Sidebar, Footer, Layout containers
- **Typical Usage**: Wraps entire application, defines overall page structure
- **Examples**:
  ```typescript
  // In shell/AppShell.tsx
  export default function AppShell() {
    return (
      <div className="app-shell">
        <Header />
        <Sidebar />
        <main>{children}</main>
      </div>
    );
  }
  ```

#### **mobile/** (Mobile-specific UI)
- **Purpose**: Mobile-only screens and responsive layouts
- **Contains**: Mobile navigation, mobile menu, mobile home screen
- **Typical Usage**: Rendered on small screens, mobile-first approaches
- **Examples**:
  ```typescript
  // In mobile/MobileNav.tsx
  export default function MobileNav() {
    // Mobile-specific navigation implementation
  }
  ```

---

### Shared UI Components

#### **ui/** (Design system & primitives)
- **Purpose**: Reusable, low-level UI components
- **Contains**: Button, Card, Modal, Input, Badge, Toast, etc.
- **Principles**:
  - ✅ No domain-specific logic
  - ✅ Highly reusable
  - ✅ Props-driven configuration
  - ✅ Styling via CSS modules or Tailwind
- **Typical Usage**:
  ```typescript
  import { Button, Card, Modal } from '@/components/ui';
  
  <Card>
    <h2>Welcome</h2>
    <Button onClick={handleClick}>Click me</Button>
  </Card>
  ```

#### **providers/** (Context providers)
- **Purpose**: Global state and context setup
- **Contains**: AuthProvider, ThemeProvider, SyncStateProvider, etc.
- **Typical Usage**:
  ```typescript
  // In providers/AuthProvider.tsx
  export function AuthProvider({ children }) {
    return (
      <AuthContext.Provider value={authState}>
        {children}
      </AuthContext.Provider>
    );
  }
  ```

---

### Feature-Specific Components

#### **focus/** (Focus session timer UI)
- **Purpose**: Focus timer interface and related UI
- **Contains**: FocusTimer, FocusHistory, TrackUpload
- **Typical Usage**:
  ```typescript
  import { FocusTimer } from '@/components/focus';
  
  <FocusTimer duration={25} onComplete={handleComplete} />
  ```

#### **audio/** (Audio playback & visualization)
- **Purpose**: Comprehensive audio player and visualization
- **Contains**: AudioPlayer, Visualizer, VolumeControl, Waveform
- **Typical Usage**:
  ```typescript
  import { AudioPlayer } from '@/components/audio';
  
  <AudioPlayer src={trackUrl} />
  ```

#### **learn/** (Learning module UI)
- **Purpose**: Learning content and educational UI
- **Contains**: LessonCard, CourseList, Visualizer
- **Typical Usage**:
  ```typescript
  import { LessonCard, CourseList } from '@/components/learn';
  
  <CourseList courses={courses} />
  ```

#### **progress/** (Progress visualization)
- **Purpose**: User progression display (levels, XP, milestones)
- **Contains**: ProgressBar, LevelCard, XPCounter, Milestones
- **Typical Usage**:
  ```typescript
  import { LevelCard, ProgressBar } from '@/components/progress';
  
  <LevelCard level={42} xp={150000} />
  ```

#### **settings/** (User settings)
- **Purpose**: User preference and settings interfaces
- **Contains**: SettingsPanel, PreferencesForm, NotificationSettings
- **Typical Usage**:
  ```typescript
  import { SettingsPanel } from '@/components/settings';
  
  <SettingsPanel user={user} />
  ```

#### **references/** (Reference library)
- **Purpose**: Browse and manage reference materials
- **Contains**: ReferenceList, ReferenceDetail, SearchBar
- **Typical Usage**:
  ```typescript
  import { ReferenceList } from '@/components/references';
  
  <ReferenceList references={refs} />
  ```

#### **search/** (Search interface)
- **Purpose**: Search functionality and results
- **Contains**: SearchInput, SearchResults, Filters
- **Typical Usage**:
  ```typescript
  import { SearchInput, SearchResults } from '@/components/search';
  
  <SearchInput onSearch={handleSearch} />
  ```

#### **onboarding/** (First-run onboarding)
- **Purpose**: New user onboarding flow
- **Contains**: OnboardingFlow, FeatureIntro, OnboardingModal
- **Typical Usage**:
  ```typescript
  import { OnboardingFlow } from '@/components/onboarding';
  
  <OnboardingFlow isNewUser={isNew} />
  ```

#### **admin/** (Admin-only features)
- **Purpose**: Administrative tools and dashboards
- **Contains**: AdminDashboard, UserManagement, ApiTester
- **Typical Usage**:
  ```typescript
  import { AdminDashboard } from '@/components/admin';
  
  <AdminDashboard />;
  ```

#### **vault/** (Vault/security)
- **Purpose**: Vault locking and security features
- **Contains**: VaultLock, UnlockForm, VaultStatus
- **Typical Usage**:
  ```typescript
  import { VaultLock } from '@/components/vault';
  
  <VaultLock isLocked={isLocked} />
  ```

---

### Utility & Integration Components

#### **browser/** (Browser detection)
- **Purpose**: Browser compatibility and detection
- **Contains**: BrowserDetect, UnsupportedBrowser
- **Typical Usage**:
  ```typescript
  import { BrowserDetect } from '@/components/browser';
  
  if (!BrowserDetect.isSupported()) {
    return <UnsupportedBrowser />;
  }
  ```

#### **debug/** (Development debugging)
- **Purpose**: Development-only debugging utilities
- **Contains**: DebugPanel, StateInspector, LogViewer
- **Typical Usage**: Only in development/staging
  ```typescript
  {process.env.NODE_ENV === 'development' && <DebugPanel />}
  ```

#### **ads/** (Ad integration)
- **Purpose**: Advertisement display and loading
- **Contains**: AdContainer, AdLoader, AdManager
- **Typical Usage**:
  ```typescript
  import { AdContainer } from '@/components/ads';
  
  <AdContainer slot="home-banner" />
  ```

---

### Legacy & Deprecated

#### **player/** (Legacy audio player)
- **Status**: 🚫 DEPRECATED
- **Note**: Migrate to `audio/` folder
- **Timeline**: Plan migration to consolidated `audio/` folder
- **Reason**: Consolidate duplicate audio player implementations

#### **Search/** (Legacy search)
- **Status**: 🚫 DEPRECATED  
- **Note**: Consolidate with `search/` folder
- **Timeline**: Plan consolidation

---

## Barrel Exports Pattern

Each folder should have an `index.ts` file exporting public components:

```typescript
// components/ui/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Modal } from './Modal';
export type { ButtonProps } from './Button';
export type { CardProps } from './Card';
export type { ModalProps } from './Modal';
```

This enables clean imports:
```typescript
// ✅ Good: From barrel export
import { Button, Card } from '@/components/ui';

// ❌ Avoid: Direct imports
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
```

---

## Naming Conventions

### Component Files
- **File name**: PascalCase matching component name
- **Examples**: `FocusTimer.tsx`, `AudioPlayer.tsx`, `UserSettings.tsx`

### Props Interfaces
- **Pattern**: `{ComponentName}Props`
- **Examples**:
  ```typescript
  interface ButtonProps { /* ... */ }
  interface FocusTimerProps { /* ... */ }
  interface AudioPlayerProps { /* ... */ }
  ```

### CSS Modules
- **Pattern**: `{ComponentName}.module.css`
- **Examples**:
  - `Button.tsx` → `Button.module.css`
  - `FocusTimer.tsx` → `FocusTimer.module.css`

### Types Exports
- **Pattern**: Export types from same file as component
  ```typescript
  // FocusTimer.tsx
  export interface FocusTimerProps { /* ... */ }
  export default function FocusTimer(props: FocusTimerProps) { /* ... */ }
  ```

---

## Creating New Components

### Decision Tree: Where Should This Go?

```
Is it a single UI element (Button, Input, Badge)?
├─ YES → components/ui/
└─ NO → Does it belong to a specific feature (Focus, Audio, Learn)?
    ├─ YES → components/{feature}/
    └─ NO → Does it manage global state?
        ├─ YES → components/providers/
        └─ NO → Does it control page layout?
            ├─ YES → components/shell/
            └─ NO → Create new folder in components/
```

### Component Creation Checklist

- [ ] Choose appropriate folder (using decision tree above)
- [ ] Create `YourComponent.tsx` file in PascalCase
- [ ] Create `YourComponent.module.css` if needed
- [ ] Define `YourComponentProps` interface
- [ ] Export component and types
- [ ] Add component to `index.ts` in folder
- [ ] Update COMPONENT_CATALOG.md with new component

---

## Common Patterns

### Provider Components
```typescript
// components/providers/YourProvider.tsx
import { createContext, useContext } from 'react';

const YourContext = createContext<YourContextType | null>(null);

export function YourProvider({ children }: { children: React.ReactNode }) {
  return (
    <YourContext.Provider value={value}>
      {children}
    </YourContext.Provider>
  );
}

export function useYourContext() {
  const context = useContext(YourContext);
  if (!context) {
    throw new Error('useYourContext must be used within YourProvider');
  }
  return context;
}
```

### Feature Components
```typescript
// components/focus/FocusTimer.tsx
interface FocusTimerProps {
  duration: number;
  onComplete: () => void;
}

export default function FocusTimer({ duration, onComplete }: FocusTimerProps) {
  return (
    <div className={styles.container}>
      {/* Implementation */}
    </div>
  );
}
```

### UI Components
```typescript
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({ variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return <button className={cx(styles.button, styles[variant], styles[size])} {...props} />;
}
```

---

## Validation Checklist

Before committing new components:

- [ ] Component in appropriate folder
- [ ] File named PascalCase (matches component name)
- [ ] Props interface named `{ComponentName}Props`
- [ ] Component exported from `index.ts`
- [ ] Types exported if public
- [ ] CSS module follows naming pattern
- [ ] No deep imports in codebase (use barrel exports)
- [ ] README updated if folder-specific logic
- [ ] COMPONENT_CATALOG.md updated for major components
- [ ] Follows existing patterns in similar components

---

## Navigation Tips

### Finding a Component
1. Check `COMPONENT_CATALOG.md` for component name
2. Look in the folder shown in catalog
3. Import from that folder's `index.ts`

### Understanding Component Relationships
1. Check `ARCHITECTURE.md` for patterns
2. Look for examples in existing similar components
3. Examine folder's README (if exists)

### Adding to an Existing Folder
1. Check `index.ts` in that folder
2. Follow the same structure as existing components
3. Add your component to `index.ts` exports
4. Update COMPONENT_CATALOG.md

---

## Related Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Component architecture patterns and best practices
- **[COMPONENT_CATALOG.md](./COMPONENT_CATALOG.md)**: Complete inventory of all components
- **[../lib/hooks/README.md](../lib/hooks/README.md)**: Custom hooks organization
- **[../lib/utils/README.md](../lib/utils/README.md)**: Utility functions

---

## Summary

✅ **Folder structure organized by feature/domain**  
✅ **Clear naming conventions for components and types**  
✅ **Barrel exports enable clean imports**  
✅ **Decision tree helps place new components**  
✅ **Checklists ensure consistency**

When in doubt, follow existing patterns in the closest similar component!
