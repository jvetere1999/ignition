# Component Architecture Patterns

**Last Updated**: January 17, 2026  
**Status**: Active Best Practices Guide  
**Related Task**: FRONT-001 Phase 5

---

## Architecture Overview

The component architecture follows these principles:

1. **Separation of Concerns**: UI logic, state management, and feature logic are separated
2. **Context for Global State**: React Context providers manage application-wide state
3. **Custom Hooks for Logic**: Reusable logic extracted to hooks in `lib/hooks/`
4. **Component Types**: Different component types serve different purposes
5. **Error Boundaries**: Components handle errors gracefully with error boundaries
6. **TypeScript**: Full type safety with Props interfaces

---

## Component Types & Patterns

### 1. Presentational Components (UI Layer)

**Purpose**: Display data and respond to user actions  
**Characteristics**:
- No state management (uses props only)
- Reusable across the application
- Located in `components/ui/`
- Styled with CSS modules

**Example**:
```typescript
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  children,
  ...props 
}: ButtonProps) {
  return (
    <button 
      className={cx(styles.button, styles[variant], styles[size])} 
      {...props}
    >
      {children}
    </button>
  );
}
```

**When to Use**: When you need reusable UI elements (buttons, cards, modals, etc.)

---

### 2. Container Components (Feature Layer)

**Purpose**: Connect feature-specific UI with state and business logic  
**Characteristics**:
- Manage local feature state
- Fetch data for feature
- Coordinate between presentational components
- Handle feature-specific errors
- Located in `components/{feature}/`

**Example**:
```typescript
// components/focus/FocusSession.tsx
interface FocusSessionProps {
  sessionId: string;
  onComplete: () => void;
}

export default function FocusSession({ sessionId, onComplete }: FocusSessionProps) {
  const [duration, setDuration] = useState<number>(1500);
  const [isRunning, setIsRunning] = useState(false);
  const { session, error } = useFocusSession(sessionId);

  if (error) {
    return <ErrorState message="Failed to load session" />;
  }

  return (
    <div>
      <FocusTimer duration={duration} isRunning={isRunning} />
      <FocusControls onComplete={onComplete} />
    </div>
  );
}
```

**When to Use**: When combining UI components with feature-specific logic

---

### 3. Provider Components (Context Layer)

**Purpose**: Provide global or section-level state via React Context  
**Characteristics**:
- Manage global state with `useState` or `useReducer`
- Create and provide React Context
- Exposes custom hook (e.g., `useAuth()`)
- Wrapped around components that need the state
- Located in `components/providers/`

**Example**:
```typescript
// components/providers/AuthProvider.tsx
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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

// Custom hook for consuming context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**When to Use**:
- Global app state (auth, theme, user preferences)
- Section-level state (onboarding, modal state)
- Any state needed by multiple components at different nesting levels

---

### 4. Initializer Components (Setup Layer)

**Purpose**: Initialize browser APIs, register workers, or setup global behavior  
**Characteristics**:
- Run on app load
- Don't provide UI (return `null`)
- Handle browser APIs, service workers, third-party integrations
- Located in `components/` or `components/providers/`

**Example**:
```typescript
// components/providers/ServiceWorkerInitializer.tsx
export function ServiceWorkerInitializer() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered'))
        .catch(err => console.error('SW registration failed', err));
    }
  }, []);

  return null; // No UI
}

// Usage in root layout:
// <ServiceWorkerInitializer />
// <AuthProvider>
//   <App />
// </AuthProvider>
```

**When to Use**:
- Service worker registration
- Browser API initialization
- Global event listener setup
- Analytics initialization

---

### 5. Gate Components (Conditional Rendering)

**Purpose**: Conditionally render children based on state  
**Characteristics**:
- Render children only if condition is met
- Return `null` if condition not met
- Often combined with error states or loading states
- Located in `components/{feature}/` or `components/providers/`

**Example**:
```typescript
// components/onboarding/OnboardingGate.tsx
interface OnboardingGateProps {
  children: React.ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { isNewUser } = useAuth();
  const { isOnboardingComplete } = useOnboarding();

  // Redirect new users to onboarding
  if (isNewUser && !isOnboardingComplete) {
    return <Redirect to="/onboarding" />;
  }

  return <>{children}</>;
}

// Usage in routes:
// <OnboardingGate>
//   <DashboardPage />
// </OnboardingGate>
```

**When to Use**:
- Auth protection (verify user logged in)
- Feature gates (redirect if feature disabled)
- Onboarding checks (redirect if not complete)

---

## State Management Patterns

### Pattern 1: Local State (Single Component)

**Use When**: State affects only one component  
**Example**:
```typescript
export default function SearchBox() {
  const [query, setQuery] = useState('');
  
  return (
    <input 
      value={query} 
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
```

---

### Pattern 2: Lifted State (Parent to Children)

**Use When**: State needs to be shared by siblings  
**Example**:
```typescript
export function FocusSession() {
  const [isRunning, setIsRunning] = useState(false);
  
  return (
    <>
      <Timer isRunning={isRunning} />
      <Controls onToggle={() => setIsRunning(!isRunning)} />
    </>
  );
}
```

---

### Pattern 3: Context (Global or Section-Level)

**Use When**: State needed by deeply nested components or multiple features  
**Example**:
```typescript
// Provider in root layout
<AuthProvider>
  <ThemeProvider>
    <SyncProvider>
      <App />
    </SyncProvider>
  </ThemeProvider>
</AuthProvider>

// Use in any component
function Profile() {
  const { user } = useAuth();
  const { theme } = useTheme();
  // ...
}
```

---

### Pattern 4: Custom Hooks (Reusable Logic)

**Use When**: Logic used by multiple components  
**Example**:
```typescript
// lib/hooks/useFocusSession.ts
export function useFocusSession(sessionId: string) {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSession(sessionId)
      .then(setSession)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  return { session, error, isLoading };
}

// Used in multiple components
function FocusTimer() {
  const { session } = useFocusSession(sessionId);
  // ...
}

function FocusHistory() {
  const { session } = useFocusSession(sessionId);
  // ...
}
```

---

## Error Handling Patterns

### Pattern 1: Error Boundary (Component Tree Errors)

**Use When**: Catching React render errors  
**Example**:
```typescript
// components/ui/ErrorBoundary.tsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      console.error('Error:', event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return fallback || <ErrorState message="Something went wrong" />;
  }

  return <>{children}</>;
}
```

---

### Pattern 2: Error State (Async Operation Errors)

**Use When**: Handling errors from API calls or async operations  
**Example**:
```typescript
function FocusSession() {
  const { session, error, isLoading } = useFocusSession(sessionId);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  return <TimerDisplay session={session} />;
}
```

---

### Pattern 3: Error Recovery (Retry Logic)

**Use When**: Transient errors that might succeed on retry  
**Example**:
```typescript
export function useRetryableEffect<T>(
  asyncFn: () => Promise<T>,
  maxRetries = 3
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const execute = async () => {
    try {
      const result = await asyncFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(execute, 1000 * (retryCount + 1)); // Exponential backoff
      }
    }
  };

  useEffect(() => {
    execute();
  }, []);

  return { data, error, retry: execute, isRetrying: retryCount > 0 };
}
```

---

## Hook Patterns

### Custom Hook Best Practices

```typescript
// ✅ GOOD: Named with use* prefix, stateful
export function useFocusSession(sessionId: string) {
  const [session, setSession] = useState<FocusSession | null>(null);
  // ...
  return { session, isLoading, error };
}

// ✅ GOOD: Encapsulates logic and state
export function useDebounce<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

// ✅ GOOD: Returns well-documented object
interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  // ...
}

// ❌ BAD: Helper function, not a hook (doesn't use state)
export function useFormatDate(date: Date) {
  return date.toLocaleDateString(); // Just format, no state
}
// → Should be: export function formatDate(date: Date) { ... }

// ❌ BAD: Missing use* prefix
export function fetchUserData(userId: string) {
  // ...
}
// → Should be: export function useFetchUserData(userId: string) { ... }
```

---

## Dependency Management

### useEffect Dependencies

**Pattern 1: Fetch on Mount**
```typescript
export function useUserProfile(userId: string) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchProfile(userId).then(setProfile);
  }, [userId]); // Re-fetch if userId changes

  return profile;
}
```

**Pattern 2: Cleanup Resources**
```typescript
export function useEventListener(eventType: string, handler: EventListener) {
  useEffect(() => {
    window.addEventListener(eventType, handler);
    
    // Cleanup: remove listener on unmount
    return () => {
      window.removeEventListener(eventType, handler);
    };
  }, [eventType, handler]);
}
```

**Pattern 3: Debounced Effect**
```typescript
export function useSearch(query: string) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchApi.search(query).then(setResults);
    }, 300); // Debounce search

    return () => clearTimeout(timer); // Cleanup timer
  }, [query]);

  return results;
}
```

---

## TypeScript Patterns

### Props Interface Pattern

```typescript
// ✅ Good: Extends React types
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export default function Button({ variant = 'primary', ...props }: ButtonProps) {
  return <button className={styles[variant]} {...props} />;
}

// ✅ Good: Includes children explicitly
interface CardProps {
  children: React.ReactNode;
  title: string;
  className?: string;
}

export default function Card({ children, title, className }: CardProps) {
  return <div className={className}>{children}</div>;
}

// ❌ Bad: Missing type for children
interface CardProps {
  title: string;
  children?: any; // Too loose
}

// ❌ Bad: Non-standard props naming
interface CardSettings {
  kids: React.ReactNode; // Should be children
  titleText: string;     // Should be title
}
```

---

## Validation Checklist

### Component Architecture

- [ ] Component type identified (presentational, container, provider, etc.)
- [ ] State management appropriate for scope
- [ ] Props interface properly typed
- [ ] Error handling in place (error boundary or error state)
- [ ] Loading states handled
- [ ] Edge cases considered (empty state, null values)

### Hooks

- [ ] Custom hooks named with `use*` prefix
- [ ] useEffect dependencies complete
- [ ] No unnecessary dependencies
- [ ] Cleanup functions where needed
- [ ] TypeScript return type specified

### Error Handling

- [ ] Async operations have error state
- [ ] User-facing error messages provided
- [ ] Sensitive errors logged but not exposed
- [ ] Retry mechanism for transient errors
- [ ] Error boundaries in place

---

## Related Patterns

- **Redux/State Management**: For complex app state (not typically needed with Context + useReducer)
- **Form Handling**: See FORM_PATTERNS.md
- **API Integration**: See API_CLIENT_PATTERNS.md
- **Performance**: Memoization, lazy loading, code splitting
- **Testing**: Component unit tests, integration tests, E2E tests

---

## Summary

✅ **Clear component types with specific purposes**  
✅ **Multiple state management patterns for different scales**  
✅ **Error handling at multiple levels**  
✅ **TypeScript for type safety**  
✅ **Custom hooks for reusable logic**  

Choosing the right pattern prevents bugs and makes code maintainable!
