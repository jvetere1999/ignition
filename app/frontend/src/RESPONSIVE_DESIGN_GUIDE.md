---
title: Responsive Design Guide
description: Mobile-first responsive design patterns for Passion OS frontend
date: January 17, 2026
---

# RESPONSIVE DESIGN GUIDE

This guide documents responsive design patterns and breakpoints used throughout the Passion OS frontend.

## Breakpoints Overview

**Mobile-first approach**: Design for mobile first, enhance for larger screens.

| Device | Breakpoint | Min-Width | Use Case |
|--------|-----------|-----------|----------|
| Mobile | default | 0px | Phones in portrait mode |
| Tablet | `tablet` | 640px | Phones in landscape, small tablets |
| Tablet Large | `tabletLarge` | 768px | Standard tablets (iPad) |
| Desktop | `desktop` | 1024px | Laptops, desktop monitors |
| Desktop Large | `desktopLarge` | 1280px | Large monitors |
| Desktop XLarge | `desktopXLarge` | 1536px | Extra-large displays |

## Usage Patterns

### 1. React Hooks (Recommended for Components)

```typescript
import { useBreakpoint, useDeviceType, useIsTouchDevice } from '@/lib/theme/breakpoints';

export function MyComponent() {
  const breakpoint = useBreakpoint(); // 'mobile' | 'tablet' | 'desktop' etc.
  const deviceType = useDeviceType();  // 'mobile' | 'tablet' | 'desktop'
  const isTouch = useIsTouchDevice();  // true | false

  if (breakpoint === 'mobile') {
    return <MobileLayout />;
  }

  if (breakpoint === 'tablet') {
    return <TabletLayout />;
  }

  return <DesktopLayout />;
}
```

### 2. Responsive Values Hook

```typescript
import { useResponsiveValue } from '@/lib/theme/breakpoints';

export function SpacedContainer() {
  const padding = useResponsiveValue(
    {
      mobile: '16px',
      tablet: '24px',
      desktop: '32px',
    },
    '16px' // default
  );

  return <div style={{ padding }}>{children}</div>;
}
```

### 3. Breakpoint Check Hook

```typescript
import { useIsBreakpointOrLarger } from '@/lib/theme/breakpoints';

export function ResponsiveGrid() {
  const isTabletOrLarger = useIsBreakpointOrLarger('tablet');
  const isDesktopOrLarger = useIsBreakpointOrLarger('desktop');

  const columns = isDesktopOrLarger ? 4 : isTabletOrLarger ? 2 : 1;

  return <GridLayout columns={columns}>{items}</GridLayout>;
}
```

### 4. CSS Media Queries (CSS Modules)

```css
/* mobile.module.css */

.container {
  padding: 16px;
  font-size: 14px;
}

/* Tablet and larger */
@media (min-width: 768px) {
  .container {
    padding: 24px;
    font-size: 16px;
  }
}

/* Desktop and larger */
@media (min-width: 1024px) {
  .container {
    padding: 32px;
    font-size: 18px;
  }
}
```

### 5. CSS-in-JS (styled-components, emotion)

```typescript
import styled from 'styled-components';
import { media } from '@/lib/theme/breakpoints';

const Container = styled.div`
  padding: 16px;
  font-size: 14px;

  @media (${media.tabletLarge}) {
    padding: 24px;
    font-size: 16px;
  }

  @media (${media.desktop}) {
    padding: 32px;
    font-size: 18px;
  }
`;
```

## Common Patterns

### Pattern 1: Conditional Rendering

```typescript
export function Navigation() {
  const deviceType = useDeviceType();

  return (
    <nav>
      {deviceType === 'mobile' ? (
        <HamburgerMenu />
      ) : (
        <FullMenu />
      )}
    </nav>
  );
}
```

### Pattern 2: Responsive Grid

```typescript
export function ProductGrid() {
  const breakpoint = useBreakpoint();
  
  const columnCount = {
    mobile: 1,
    tablet: 2,
    tabletLarge: 3,
    desktop: 4,
    desktopLarge: 5,
    desktopXLarge: 6,
  }[breakpoint];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
      gap: '16px'
    }}>
      {items.map(item => <Card key={item.id} item={item} />)}
    </div>
  );
}
```

### Pattern 3: Responsive Font Sizes

```typescript
export function Heading() {
  const fontSize = useResponsiveValue(
    {
      mobile: '20px',
      tablet: '24px',
      desktop: '32px',
    },
    '20px'
  );

  return <h1 style={{ fontSize }}>{children}</h1>;
}
```

### Pattern 4: Touch-Aware Spacing

```typescript
export function Button() {
  const isTouch = useIsTouchDevice();

  return (
    <button 
      style={{ 
        padding: isTouch ? '16px 24px' : '8px 16px', // Larger on touch devices
        minHeight: isTouch ? '44px' : 'auto',         // Apple HIG: min 44px touch target
      }}
    >
      Click me
    </button>
  );
}
```

## Best Practices

### ✅ DO:

1. **Start mobile-first**
   ```typescript
   // Good: Mobile styles first, enhance for larger screens
   const padding = useResponsiveValue(
     { mobile: '8px', desktop: '16px' },
     '8px'
   );
   ```

2. **Use consistent breakpoints**
   ```typescript
   // Always use TABLET_MIN, DESKTOP_MIN constants
   import { TABLET_MIN, DESKTOP_MIN } from '@/lib/theme/breakpoints';
   ```

3. **Group responsive values together**
   ```typescript
   // Good: All responsive values in one place
   const spacing = useResponsiveValue(
     { mobile: '8px', tablet: '12px', desktop: '16px' },
     '8px'
   );
   ```

4. **Consider touch devices**
   ```typescript
   // Good: Account for touch
   const buttonHeight = useResponsiveValue(
     { mobile: '44px', desktop: '32px' },
     '44px'
   );
   ```

### ❌ DON'T:

1. **Hardcode breakpoints**
   ```typescript
   // Bad: Hardcoding breaks consistency
   if (window.innerWidth > 1024) { ... }
   
   // Good: Use provided constants
   import { DESKTOP_MIN } from '@/lib/theme/breakpoints';
   ```

2. **Nest media queries**
   ```typescript
   // Bad: Nested media queries are unreliable
   @media (min-width: 640px) {
     @media (min-width: 1024px) { ... }
   }
   
   // Good: Use separate media queries
   @media (min-width: 640px) { ... }
   @media (min-width: 1024px) { ... }
   ```

3. **Forget touch targets**
   ```typescript
   // Bad: Too small for touch
   <button style={{ padding: '4px 8px', minHeight: '20px' }}>
   
   // Good: Minimum 44x44px for touch
   <button style={{ padding: '12px 16px', minHeight: '44px' }}>
   ```

4. **Use device-specific names**
   ```typescript
   // Bad: Device-specific, fragile
   const isIpad = userAgent.includes('iPad');
   
   // Good: Feature-based detection
   const isTabletOrLarger = useIsBreakpointOrLarger('tablet');
   ```

## Testing Responsive Designs

### Browser DevTools

1. **Chrome/Edge**: F12 → Toggle Device Toolbar (Ctrl+Shift+M)
2. **Firefox**: F12 → Responsive Design Mode (Ctrl+Shift+M)
3. **Safari**: Develop → Enter Responsive Design Mode

### Test Checklist

- [ ] Mobile (320px - 480px): Portrait view
- [ ] Tablet (640px - 1024px): Landscape view
- [ ] Tablet Large (768px): Portrait view
- [ ] Desktop (1024px+): Full desktop view
- [ ] Desktop Large (1280px+): Verify layout doesn't break
- [ ] Touch targets: All interactive elements ≥ 44x44px
- [ ] Text readability: No line lengths > 60-80 characters
- [ ] Images: Scale proportionally
- [ ] Forms: Inputs large enough on mobile

## Components by Responsiveness

### Fully Responsive Components
- Navigation (HamburgerMenu ↔ FullMenu)
- Grid layouts (1 col → 4 cols)
- Image galleries
- Forms (full-width on mobile, constrained on desktop)

### Partially Responsive Components
- Modals (same size, centered positioning)
- Cards (scale, but maintain aspect ratio)
- Buttons (hover states only on desktop)

### Static Components
- Typography (sometimes adjust font size)
- Badges, chips
- Icons

## File Organization

```
app/frontend/src/
├── lib/theme/
│   ├── breakpoints.ts         ← All breakpoint definitions
│   ├── index.tsx              ← Theme provider
│   └── script.ts
├── styles/
│   ├── breakpoints.css        ← CSS custom properties (for CSS Modules)
│   ├── responsive-base.css    ← Base responsive styles
│   └── [feature].module.css   ← Component styles with responsive
└── components/
    └── */
        └── *.module.css       ← Component styles using breakpoints
```

## Migration Guide (from hardcoded breakpoints)

### Step 1: Find hardcoded values
```bash
grep -r "1024\|640\|768" app/frontend/src/components
```

### Step 2: Replace with constants
```typescript
// Before
if (window.innerWidth > 1024) { ... }

// After
const isDesktop = useIsBreakpointOrLarger('desktop');
if (isDesktop) { ... }
```

### Step 3: Test
- [ ] Component still responsive
- [ ] Breakpoints match new system
- [ ] No console errors

## Reference

- Source: [app/frontend/src/lib/theme/breakpoints.ts](app/frontend/src/lib/theme/breakpoints.ts)
- Related: [STYLING_GUIDE.md](STYLING_GUIDE.md)
- Testing: Browser DevTools responsive mode

---

**Last Updated**: January 17, 2026  
**Status**: Implemented, ready for adoption  
**Effort**: Phase 1 complete (0.3 hours)
