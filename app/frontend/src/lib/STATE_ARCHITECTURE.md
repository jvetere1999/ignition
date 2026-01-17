# Frontend State Management Architecture

**Status**: Production-Ready  
**Last Updated**: 2026-01-17  
**Version**: 1.0  

---

## Executive Summary

This document defines the state management patterns used across the Passion OS Next frontend. It provides a **decision tree** for choosing the right pattern for your use case, examples for each pattern, and anti-patterns to avoid.

---

## State Management Patterns

### 1. React Context + useState (Simple Global State)

**When to Use**:
- Global state that multiple components need
- State doesn't change frequently
- Simple updates (boolean flags, user preferences, theme)
- Examples: auth, theme, onboarding state

**Example: AuthProvider**
```typescript
// lib/auth/AuthProvider.tsx
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const user = await authApi.login(email, password);
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

**Production Examples**:
- [AuthProvider.tsx](../auth/AuthProvider.tsx) - Session state management
- [ThemeProvider.tsx](../../components/providers/ThemeProvider.tsx) - Theme state
- [OnboardingProvider.tsx](../../components/onboarding/OnboardingProvider.tsx) - Onboarding flow

---

### 2. React Context + useReducer (Complex Global State)

**When to Use**:
- Global state with multiple related fields
- State transitions are complex or interdependent
- Multiple actions that transform state
- State changes happen frequently
- Examples: sync state, modal state, form state

**Example: SyncStateContext**
```typescript
// lib/sync/SyncStateContext.tsx
interface SyncStateContextValue {
  progress: ProgressData | null;
  badges: BadgeData | null;
  focus: FocusStatusData | null;
  plan: PlanStatusData | null;
  isLoading: boolean;
  error: string | null;
  lastSyncTime: number | null;
  refresh: () => Promise<void>;
}

type SyncAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; payload: SyncResponse }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_SYNC_TIME'; payload: number };

function syncReducer(state: SyncState, action: SyncAction): SyncState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_DATA':
      return {
        ...state,
        progress: action.payload.progress,
        badges: action.payload.badges,
        focus: action.payload.focus,
        plan: action.payload.plan,
        lastSyncTime: Date.now(),
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload };
    default:
      return state;
  }
}

export function SyncStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(syncReducer, initialState);

  useEffect(() => {
    // Poll for updates every 30 seconds
    const interval = setInterval(async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const data = await apiSync.poll();
        dispatch({ type: 'SET_DATA', payload: data });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const refresh = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await apiSync.poll();
      dispatch({ type: 'SET_DATA', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  return (
    <SyncStateContext.Provider value={{ ...state, refresh }}>
      {children}
    </SyncStateContext.Provider>
  );
}

export function useSyncState(): SyncStateContextValue {
  const context = useContext(SyncStateContext);
  if (!context) {
    throw new Error("useSyncState must be used within SyncStateProvider");
  }
  return context;
}
```

**Production Examples**:
- [SyncStateContext.tsx](./sync/SyncStateContext.tsx) - Centralized polling state
- [FocusStateContext.tsx](./focus/FocusStateContext.tsx) - Focus session state with pause logic

**Benefits**:
- ✅ Clear state transitions
- ✅ Easy to test reducer in isolation
- ✅ Handles complex relationships between state fields
- ✅ Better performance than multiple useState calls

---

### 3. Custom Hooks with useState (Local Feature State)

**When to Use**:
- State is local to a component or small subtree
- State doesn't need to be shared globally
- Simple state that doesn't need a reducer
- Examples: form state, accordion open/close, modal visibility

**Example: useToggle Hook**
```typescript
// lib/hooks/useToggle.ts
export function useToggle(initialValue: boolean = false) {
  const [isOpen, setIsOpen] = useState(initialValue);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, toggle, open, close };
}
```

**Usage**:
```typescript
// Component using the hook
function ModalExample() {
  const { isOpen, toggle, close } = useToggle();

  return (
    <>
      <button onClick={toggle}>Open Modal</button>
      {isOpen && <Modal onClose={close} />}
    </>
  );
}
```

**Production Examples**:
- [useToggle.ts](./hooks/useToggle.ts) - Modal/accordion state
- [useAutoRefresh.ts](./hooks/useAutoRefresh.ts) - Refresh state
- [useAsync.ts](./hooks/useAsync.ts) - Async operation state

---

### 4. localStorage (Persistent Client State)

**When to Use**:
- State that should persist across page refreshes
- User preferences (theme, layout, settings)
- Cache that doesn't need backend sync
- Non-critical data (can be lost if storage cleared)

**⚠️ ANTI-PATTERN**: Don't use localStorage for critical sync state
```typescript
// ❌ WRONG - Don't store sync state in localStorage
localStorage.setItem('syncState', JSON.stringify(syncData));

// ✅ CORRECT - Use localStorage only for user preferences
localStorage.setItem('userTheme', 'dark');
localStorage.setItem('sidebarCollapsed', 'true');
```

**Example: Theme Persistence**
```typescript
// lib/hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Failed to read localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Failed to write localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// Usage
function MyComponent() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme: {theme}
    </button>
  );
}
```

---

## Decision Tree

```
Does state need to be shared with other components?
├─ NO → Use local useState or custom hook
│   └─ Is state complex (5+ fields)?
│       ├─ NO → Use useState
│       └─ YES → Use custom hook with useReducer
│
└─ YES → Does state need to persist across refreshes?
    ├─ NO → Use React Context
    │   └─ Is state complex (3+ actions)?
    │       ├─ NO → Use Context + useState
    │       └─ YES → Use Context + useReducer
    │
    └─ YES → Is it critical data or user preferences?
        ├─ CRITICAL → Use Context + Backend API (not localStorage)
        │   └─ Example: auth state, sync state
        │
        └─ PREFERENCES → Use localStorage hook
            └─ Example: theme, sidebar state
```

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Too Many useState Calls

**Problem**: Hard to track state relationships
```typescript
// ❌ WRONG - Too many useState calls
export function ComplexForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ... 10+ more useState calls
}
```

**Solution**: Use custom hook or reducer
```typescript
// ✅ CORRECT - Group related state
interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

type FormAction =
  | { type: 'SET_FIELD'; payload: { field: keyof Omit<FormState, 'errors' | 'isSubmitting'>; value: string } }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'RESET' };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.payload.field]: action.payload.value };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function ComplexForm() {
  const [state, dispatch] = useReducer(formReducer, initialState);

  // Much cleaner!
}
```

---

### ❌ Anti-Pattern 2: Storing Critical Data in localStorage

**Problem**: Data loss on storage clear, security risk for sensitive data
```typescript
// ❌ WRONG - Don't store auth tokens in localStorage
localStorage.setItem('authToken', token);
localStorage.setItem('userId', userId);

// ❌ WRONG - Don't store sync state in localStorage
localStorage.setItem('syncData', JSON.stringify(syncState));
```

**Solution**: Use server state with Context
```typescript
// ✅ CORRECT - Keep critical data in memory
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Fetch from secure HTTP-only cookie
    fetchSession();
  }, []);

  // No localStorage for auth!
}

// ✅ CORRECT - Sync state lives in Context, not localStorage
export function SyncStateProvider({ children }: { children: ReactNode }) {
  const [syncState, dispatch] = useReducer(syncReducer, initialState);
  
  useEffect(() => {
    // Poll from backend, not localStorage
    const interval = setInterval(() => {
      pollSyncState();
    }, 30000);
  }, []);
}
```

---

### ❌ Anti-Pattern 3: Missing useEffect Dependencies

**Problem**: Stale closures, infinite loops, missed updates
```typescript
// ❌ WRONG - Missing dependencies
useEffect(() => {
  fetchData(userId); // userId not in dependency array!
}, []); // Empty array = runs once, never updates

// ❌ WRONG - Infinite loop
useEffect(() => {
  setData(computeValue()); // setData might trigger this effect again
}, [setData]); // setData changes every render

// ❌ WRONG - Stale closure
useEffect(() => {
  const timer = setTimeout(() => {
    console.log(count); // Uses stale count value!
  }, 1000);
}, []); // count not included
```

**Solution**: List all dependencies
```typescript
// ✅ CORRECT - All dependencies included
useEffect(() => {
  fetchData(userId);
}, [userId]); // userId included, updates when it changes

// ✅ CORRECT - Use useCallback for stable reference
const handleFetch = useCallback(() => {
  fetchData();
}, []); // No dependencies, function never changes

useEffect(() => {
  handleFetch();
}, [handleFetch]); // Now it's safe

// ✅ CORRECT - Use mutable ref for timer
const countRef = useRef(count);

useEffect(() => {
  countRef.current = count;
}, [count]);

useEffect(() => {
  const timer = setTimeout(() => {
    console.log(countRef.current); // Uses current value!
  }, 1000);
  
  return () => clearTimeout(timer);
}, []); // Safe with empty dependency array
```

---

### ❌ Anti-Pattern 4: Context Without Memoization

**Problem**: All context consumers re-render on every context value change
```typescript
// ❌ WRONG - Value object created every render
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState('light');

  // This object is created every render, causing all consumers to re-render
  const value = { theme, setTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**Solution**: Memoize context value
```typescript
// ✅ CORRECT - Memoize context value
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState('light');

  // Memoized object only changes when theme changes
  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
```

---

### ❌ Anti-Pattern 5: Prop Drilling

**Problem**: Passing props through many intermediate components
```typescript
// ❌ WRONG - Prop drilling
function App() {
  const [user, setUser] = useState(null);
  return <Page user={user} setUser={setUser} />;
}

function Page({ user, setUser }: Props) {
  return <Section user={user} setUser={setUser} />;
}

function Section({ user, setUser }: Props) {
  return <Component user={user} setUser={setUser} />;
}

function Component({ user, setUser }: Props) {
  // Finally use the prop
}
```

**Solution**: Use Context
```typescript
// ✅ CORRECT - Use Context for global state
const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

function Component() {
  const { user, setUser } = useUser();
  // No prop drilling!
}
```

---

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Root Layout (Server Component)                              │
├─────────────────────────────────────────────────────────────┤
│ Providers (in client boundary)                              │
│ ├─ AuthProvider (user session)                              │
│ ├─ SyncStateProvider (30s polling)                          │
│ ├─ ThemeProvider (user theme)                               │
│ ├─ OnboardingProvider (onboarding flow)                     │
│ └─ ErrorNotificationProvider (error display)                │
└─────────────────────────────────────────────────────────────┘
          │
          │
┌─────────────────────────────────────────────────────────────┐
│ Page Layout / App Shell                                      │
├─────────────────────────────────────────────────────────────┤
│ Routes (Next.js pages)                                       │
│ ├─ Today Page                                                │
│ │  └─ useSyncState() → useBadges(), useProgress()           │
│ ├─ Focus Page                                                │
│ │  └─ useFocusState() → useSync data                        │
│ ├─ Planner Page                                              │
│ │  └─ usePlanStatus() → useSync data                        │
│ └─ Settings Page                                             │
│    └─ useTheme() → localStorage                             │
└─────────────────────────────────────────────────────────────┘
          │
          │
┌─────────────────────────────────────────────────────────────┐
│ Components (Local state with useState/useReducer)           │
├─────────────────────────────────────────────────────────────┤
│ • Modal (useToggle)                                          │
│ • Form (useReducer)                                          │
│ • Accordion (useToggle)                                      │
│ • Visualizer (useState)                                      │
└─────────────────────────────────────────────────────────────┘

Data Flow:
1. Backend API → SyncStateProvider (30s polling via /api/sync/poll)
2. SyncStateProvider → Components (via useProgress, useBadges, etc.)
3. Component event → Backend API (POST/PUT)
4. Backend response → Update sync state
```

---

## Common Patterns by Feature

### Authentication

```typescript
// Location: lib/auth/AuthProvider.tsx
// Pattern: Context + useState
// Updates: On login, logout, session refresh
// Trigger: Manual (login form), automatic (page load)

const { user, isLoading, login, logout } = useAuth();
```

### Theme Management

```typescript
// Location: components/providers/ThemeProvider.tsx
// Pattern: Context + useState + localStorage
// Updates: On theme toggle
// Trigger: Manual (theme button)

const { theme, toggleTheme } = useTheme();
```

### Sync State (Badges, Progress, Plan, Focus)

```typescript
// Location: lib/sync/SyncStateContext.tsx
// Pattern: Context + useReducer
// Updates: Every 30 seconds (polling)
// Trigger: Automatic (on load, every 30s)

const badges = useBadges();
const progress = useProgress();
const plan = usePlanStatus();
const focus = useFocusStatus();
```

### Focus Session State

```typescript
// Location: lib/focus/FocusStateContext.tsx
// Pattern: Context + useState (derived from SyncStateContext)
// Updates: Every 30 seconds (from sync poll)
// Trigger: Automatic

const { session, pausedState, isLoading } = useFocusState();
```

### Onboarding Flow

```typescript
// Location: components/onboarding/OnboardingProvider.tsx
// Pattern: Context + useState
// Updates: On step complete, skip
// Trigger: Manual (user interaction)

const { isVisible, currentStep, completeStep } = useOnboarding();
```

---

## Performance Optimization Tips

### 1. Memoize Context Value
```typescript
const value = useMemo(() => ({ state, dispatch }), [state]);
```

### 2. Split Context by Update Frequency
```typescript
// Bad: One context with mixed update rates
const AppContext = createContext({ user, theme, sync, focus });

// Good: Split by update frequency
const AuthContext = createContext({ user }); // Updates rarely
const SyncContext = createContext({ sync, focus }); // Updates every 30s
```

### 3. Use Partial Hooks
```typescript
// Allow components to select only what they need
export function useProgress() {
  const { progress } = useSyncState();
  return progress;
}

export function useBadges() {
  const { badges } = useSyncState();
  return badges;
}
```

### 4. Memoize Expensive Components
```typescript
const MemoizedComponent = memo(ExpensiveComponent, (prev, next) => {
  return prev.data === next.data; // Re-render only if data changes
});
```

---

## Validation Checklist

### Before Using a State Pattern

- [ ] **Scope**: Is state global, section-level, or local?
- [ ] **Frequency**: How often does state change?
- [ ] **Complexity**: How many related fields?
- [ ] **Persistence**: Does it need to survive page refresh?
- [ ] **Security**: Is it sensitive data?
- [ ] **Performance**: Could it cause unnecessary re-renders?

### Context + useState

- [ ] State is shared across multiple components
- [ ] Updates happen infrequently
- [ ] Only 1-2 related fields
- [ ] Simple state transitions
- [ ] Don't need to persist across refreshes

### Context + useReducer

- [ ] State is shared across multiple components
- [ ] Multiple related fields (3+)
- [ ] Complex state transitions
- [ ] Multiple actions that transform state
- [ ] Need to track state history (for testing/debugging)

### Custom Hook + useState

- [ ] State is local to a component or small subtree
- [ ] Don't need to share with distant components
- [ ] Simple updates (no complex transitions)
- [ ] Less than 5 related state fields
- [ ] Don't need to persist across refreshes

### localStorage

- [ ] State should persist across refreshes
- [ ] Non-critical data (user preferences)
- [ ] Not sensitive information
- [ ] Can be cleared without breaking the app
- [ ] Has fallback to default value

---

## Summary

| Pattern | Best For | Persistence | Complexity | Updates |
|---------|----------|-------------|-----------|---------|
| **useState** | Local feature state | No | Low | Manual |
| **useReducer** | Local complex state | No | High | Manual |
| **Context + useState** | Simple global state | No | Low | Manual |
| **Context + useReducer** | Complex global state | No | High | Automatic |
| **localStorage** | User preferences | Yes | Low | Manual |
| **Backend API** | Critical data | Yes | Medium | Automatic |

---

## Related Documentation

- [ARCHITECTURE.md](../components/ARCHITECTURE.md) - Component patterns
- [API_CLIENT.md](./api/README.md) - API integration patterns
- [FORM_PATTERNS.md](./forms/README.md) - Form handling (when added)
- [Performance.md](../performance/README.md) - Optimization (when added)

---

## Next Steps

1. **Review** this document with your team
2. **Apply** to existing codebase for consistency
3. **Create** custom hooks for repeated patterns
4. **Document** new state as it's added
5. **Refactor** complex components using these patterns
