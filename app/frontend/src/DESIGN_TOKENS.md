---
title: Design Tokens Documentation
description: Complete reference for CSS custom properties and design system tokens
date: January 17, 2026
---

# DESIGN TOKENS DOCUMENTATION

This guide documents all CSS custom properties (design tokens) used in the Passion OS design system.

## Token Categories

### 1. Color Tokens

All color tokens are defined in `styles/theme-variables.css` and can be used in CSS or JavaScript.

#### Background Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--bg-primary` | #ffffff | #121212 | Main application background |
| `--bg-secondary` | #f5f5f5 | #1e1e1e | Secondary background, sections |
| `--bg-tertiary` | #e8e8e8 | #2a2a2a | Tertiary background, subtle areas |
| `--bg-elevated` | #fafafa | #2a2a2a | Floating/modal backgrounds |

**Usage:**
```css
.main-container {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

#### Surface Colors

Surfaces are interactive elements like buttons, cards, inputs.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--surface-default` | #ffffff | #1e1e1e | Default surface state |
| `--surface-hover` | #f5f5f5 | #2a2a2a | Hover/active state |
| `--surface-active` | #e8e8e8 | #3f3f3f | Active/pressed state |
| `--surface-selected` | #e3f2fd | #1e3a8a | Selected/focus state |

**Usage:**
```css
button {
  background-color: var(--surface-default);
}

button:hover {
  background-color: var(--surface-hover);
}

button:active {
  background-color: var(--surface-active);
}
```

#### Text Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--text-primary` | #1a1a1a | #e5e5e5 | Primary text, headings |
| `--text-secondary` | #424242 | #b3b3b3 | Secondary text, descriptions |
| `--text-muted` | #757575 | #808080 | Muted text, metadata |
| `--text-inverse` | #ffffff | #1a1a1a | Text on colored backgrounds |

**Usage:**
```css
h1 { color: var(--text-primary); }
p { color: var(--text-secondary); }
.metadata { color: var(--text-muted); }
.contrast-button { color: var(--text-inverse); }
```

#### Accent Colors

Used for interactive and important elements.

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--accent-primary` | #1976d2 | #64b5f6 | Primary actions, links |
| `--accent-secondary` | #7c4dff | #b39ddb | Secondary actions |
| `--accent-success` | #388e3c | #81c784 | Success states |
| `--accent-warning` | #f57c00 | #ffb74d | Warnings |
| `--accent-error` | #d32f2f | #ef5350 | Errors, destructive actions |

**Usage:**
```typescript
// React component
const { base, light, dark } = useColorVariants('--accent-primary');

return (
  <button style={{
    background: base,
    '&:hover': { background: light },
  }}>
    Click me
  </button>
);
```

#### Border Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--border-default` | #e0e0e0 | #3f3f3f | Standard borders |
| `--border-subtle` | #eeeeee | #2a2a2a | Subtle dividers |
| `--border-strong` | #bdbdbd | #5a5a5a | Strong emphasis |

**Usage:**
```css
.card {
  border: 1px solid var(--border-default);
}

.divider {
  border-bottom: 1px solid var(--border-subtle);
}
```

#### Feature-Specific Colors

| Token | Usage |
|-------|-------|
| `--selection-bg` | Text selection background |
| `--selection-text` | Selected text color |
| `--focus-ring` | Focus indicator ring |
| `--keycap-*` | Piano key colors |
| `--waveform-*` | Waveform display colors |
| `--player-*` | Media player colors |
| `--row-*` | Table row backgrounds |
| `--tag-*` | Tag/chip colors |
| `--badge-*` | Badge colors |

---

### 2. Typography Tokens

#### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `--font-family-sans` | System stack | Body text, UI |
| `--font-family-mono` | Menlo, Courier New | Code, monospace |

**Usage:**
```css
body { font-family: var(--font-family-sans); }
code { font-family: var(--font-family-mono); }
```

#### Font Sizes

| Token | Mobile | Tablet | Desktop | Usage |
|-------|--------|--------|---------|-------|
| `--font-size-xs` | 12px | 12px | 12px | Metadata, captions |
| `--font-size-sm` | 14px | 15px | 14px | Labels, small text |
| `--font-size-base` | 16px | 17px | 16px | Body text (default) |
| `--font-size-lg` | 18px | 19px | 18px | Large body text |
| `--font-size-xl` | 20px | 20px | 20px | Subheadings |
| `--font-size-2xl` | 24px | 24px | 24px | Section headings |
| `--font-size-3xl` | 32px | 32px | 32px | Page headings |
| `--font-size-4xl` | 40px | 40px | 40px | Large titles |

**Usage:**
```css
h1 { font-size: var(--font-size-3xl); }
h2 { font-size: var(--font-size-2xl); }
p { font-size: var(--font-size-base); }
.caption { font-size: var(--font-size-xs); }
```

#### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-weight-light` | 300 | Subtle text |
| `--font-weight-normal` | 400 | Body text (default) |
| `--font-weight-medium` | 500 | Emphasis, labels |
| `--font-weight-semibold` | 600 | Headings, important |
| `--font-weight-bold` | 700 | Strong emphasis |

**Usage:**
```css
h1 { font-weight: var(--font-weight-bold); }
label { font-weight: var(--font-weight-medium); }
p { font-weight: var(--font-weight-normal); }
```

#### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--line-height-tight` | 1.2 | Headings, dense content |
| `--line-height-normal` | 1.5 | Body text (default) |
| `--line-height-relaxed` | 1.75 | Long-form content |
| `--line-height-loose` | 2 | Extra spacing for readability |

**Usage:**
```css
h1, h2, h3 { line-height: var(--line-height-tight); }
p { line-height: var(--line-height-normal); }
.long-form { line-height: var(--line-height-relaxed); }
```

---

### 3. Spacing Tokens

Used for padding, margin, gaps.

| Token | Mobile | Tablet | Desktop | Usage |
|-------|--------|--------|---------|-------|
| `--spacing-xs` | 4px | 4px | 4px | Micro spacing |
| `--spacing-sm` | 8px | 8px | 8px | Small spacing |
| `--spacing-md` | 16px | 16px | 16px | Default spacing |
| `--spacing-lg` | 24px | 24px | 24px | Large spacing |
| `--spacing-xl` | 32px | 32px | 32px | Extra large |
| `--spacing-2xl` | 48px | 48px | 48px | Section spacing |
| `--spacing-3xl` | 64px | 64px | 64px | Large section spacing |

**Usage:**
```css
.section {
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.grid {
  gap: var(--spacing-md);
}

.card {
  padding: var(--spacing-lg);
}
```

---

### 4. Component Tokens

Composite tokens built from primitive tokens.

#### Button Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--button-padding` | 10px 18px | Default button padding |
| `--button-border-radius` | 4px | Button corner radius |
| `--button-font-size` | var(--font-size-sm) | Button text size |
| `--button-font-weight` | var(--font-weight-medium) | Button text weight |

**Usage:**
```css
button {
  padding: var(--button-padding);
  border-radius: var(--button-border-radius);
  font-size: var(--button-font-size);
  font-weight: var(--button-font-weight);
}
```

#### Input Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--input-height` | 40px | Minimum height (touch) |
| `--input-padding` | 8px 12px | Input padding |
| `--input-border-radius` | 4px | Input corner radius |
| `--input-border-width` | 1px | Border thickness |
| `--input-font-size` | var(--font-size-base) | Input text size |

**Usage:**
```css
input, select, textarea {
  min-height: var(--input-height);
  padding: var(--input-padding);
  border-radius: var(--input-border-radius);
  border-width: var(--input-border-width);
  font-size: var(--input-font-size);
}
```

#### Card Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--card-padding` | 16px | Card internal padding |
| `--card-border-radius` | 8px | Card corner radius |
| `--card-shadow` | 0 2px 4px rgba(0, 0, 0, 0.1) | Card shadow |

**Usage:**
```css
.card {
  padding: var(--card-padding);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
  background-color: var(--surface-default);
}
```

#### Modal Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--modal-border-radius` | 8px | Modal corner radius |
| `--modal-shadow` | 0 19px 51px rgba(0, 0, 0, 0.3) | Modal shadow |
| `--modal-backdrop` | rgba(0, 0, 0, 0.5) | Backdrop overlay |

---

### 5. Animation Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | 150ms ease-in-out | Quick interactions |
| `--transition-normal` | 250ms ease-in-out | Standard transitions |
| `--transition-slow` | 350ms ease-in-out | Theme changes |

**Usage:**
```css
button {
  transition: background-color var(--transition-fast);
}

.modal {
  transition: opacity var(--transition-normal);
}

/* Theme switching */
body {
  transition: background-color var(--transition-slow),
              color var(--transition-slow);
}
```

---

### 6. Z-Index Scale

Predictable layering for overlays, modals, tooltips.

| Token | Value | Usage |
|-------|-------|-------|
| `--z-dropdown` | 1000 | Dropdowns, popovers |
| `--z-sticky` | 1020 | Sticky headers |
| `--z-fixed` | 1030 | Fixed navigation |
| `--z-modal-backdrop` | 1040 | Modal background |
| `--z-modal` | 1050 | Modal dialogs |
| `--z-popover` | 1060 | Popovers |
| `--z-tooltip` | 1070 | Tooltips |

**Usage:**
```css
.modal {
  z-index: var(--z-modal);
}

.dropdown {
  z-index: var(--z-dropdown);
}

.tooltip {
  z-index: var(--z-tooltip);
}
```

---

## Using Design Tokens in CSS

### Example 1: Complete Card Component

```css
.card {
  background-color: var(--surface-default);
  border: 1px solid var(--border-default);
  border-radius: var(--card-border-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
  transition: transform var(--transition-fast);
}

.card:hover {
  background-color: var(--surface-hover);
  transform: translateY(-2px);
}

.card-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.card-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}
```

### Example 2: Complete Button Component

```css
.btn {
  padding: var(--button-padding);
  font-size: var(--button-font-size);
  font-weight: var(--button-font-weight);
  border-radius: var(--button-border-radius);
  border: 1px solid var(--border-default);
  background-color: var(--surface-default);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: var(--touch-target-min);
}

.btn:hover {
  background-color: var(--surface-hover);
}

.btn-primary {
  background-color: var(--accent-primary);
  color: var(--text-inverse);
  border-color: var(--accent-primary);
}

.btn-primary:hover {
  background-color: var(--accent-primary-dark);
}

.btn-success {
  background-color: var(--accent-success);
  color: var(--text-inverse);
}

.btn-error {
  background-color: var(--accent-error);
  color: var(--text-inverse);
}
```

### Example 3: Form Input with Validation

```css
.form-group {
  margin-bottom: var(--spacing-lg);
}

label {
  display: block;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

input {
  width: 100%;
  padding: var(--input-padding);
  font-size: var(--input-font-size);
  border: var(--input-border-width) solid var(--border-default);
  border-radius: var(--input-border-radius);
  min-height: var(--input-height);
  background-color: var(--surface-default);
  color: var(--text-primary);
  transition: border-color var(--transition-fast);
}

input:focus {
  border-color: var(--accent-primary);
  outline: none;
  box-shadow: 0 0 0 3px var(--focus-ring);
}

input:invalid {
  border-color: var(--accent-error);
}

.form-error {
  color: var(--accent-error);
  font-size: var(--font-size-xs);
  margin-top: var(--spacing-xs);
}
```

---

## Using Design Tokens in React

### Hook API

```typescript
import { 
  useCSSVariable, 
  useColorVariants,
  useResponsiveValue 
} from '@/lib/theme/variables-hooks';

export function MyComponent() {
  // Get single variable
  const textColor = useCSSVariable('--text-primary');
  
  // Get color variants
  const { base, light, dark } = useColorVariants('--accent-primary');
  
  // Get responsive spacing
  const padding = useResponsiveValue({
    mobile: '12px',
    desktop: '24px'
  }, '12px');

  return (
    <div style={{ color: textColor, padding }}>
      <button style={{ background: base }}>Hover for {light}</button>
    </div>
  );
}
```

### Direct Function API

```typescript
import { 
  getCSSVariable, 
  setCSSVariable,
  lightenColor,
  darkenColor 
} from '@/lib/theme/variables-api';

// Read current value
const currentPrimary = getCSSVariable('--text-primary');

// Set new value
setCSSVariable('--accent-primary', '#ff0000');

// Color manipulation
const lighter = lightenColor('#1976d2', 20);
const darker = darkenColor('#1976d2', 20);
```

---

## Token Naming Convention

All tokens follow this pattern:

```
--[category]-[function]-[modifier]
```

Examples:
- `--text-primary` (category: text, function: primary)
- `--bg-secondary` (category: bg, function: secondary)
- `--accent-success` (category: accent, function: success)
- `--button-padding` (category: component, function: button, modifier: padding)

---

## Extending Design Tokens

To add new tokens:

1. **Add to `styles/theme-variables.css`**:
   ```css
   :root {
     --my-custom-token: #value;
   }
   ```

2. **Add to `lib/theme/variables-api.ts`** (if theme-aware):
   ```typescript
   export const THEME_CSS_VARIABLES = [
     // ... existing
     '--my-custom-token',
   ];
   ```

3. **Use in components**:
   ```css
   .component { color: var(--my-custom-token); }
   ```

---

## Best Practices

✅ **DO:**
- Use tokens for all colors, spacing, typography
- Prefer specific tokens (e.g., `--text-primary` vs `--text-color`)
- Use tokens for consistency across themes
- Layer tokens (use other tokens in definitions)

❌ **DON'T:**
- Hardcode colors (#ffffff, #000000, etc.)
- Create tokens for single use cases
- Skip dark mode overrides
- Use arbitrary values in inline styles

---

**Last Updated**: January 17, 2026  
**Status**: Complete reference  
**Related**: [responsive-base.css](responsive-base.css), [theme-variables.css](theme-variables.css), [variables-api.ts](variables-api.ts), [variables-hooks.ts](variables-hooks.ts)
