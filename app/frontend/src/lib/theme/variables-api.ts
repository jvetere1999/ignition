/**
 * CSS Variables Theme API
 * 
 * Utilities for reading, writing, and managing CSS custom properties
 * for theme switching and runtime customization.
 * 
 * @since 2026-01-17
 */

"use client";

/**
 * All CSS variable names used in the theme system
 * Mirrors lib/themes/types.ts ThemeVars interface
 */
export const THEME_CSS_VARIABLES = [
  // Backgrounds
  '--bg-primary',
  '--bg-secondary',
  '--bg-tertiary',
  '--bg-elevated',

  // Surfaces
  '--surface-default',
  '--surface-hover',
  '--surface-active',
  '--surface-selected',

  // Text
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--text-inverse',

  // Borders
  '--border-default',
  '--border-subtle',
  '--border-strong',

  // Accents
  '--accent-primary',
  '--accent-secondary',
  '--accent-success',
  '--accent-warning',
  '--accent-error',

  // Selection & Focus
  '--selection-bg',
  '--selection-text',
  '--focus-ring',

  // Keycaps
  '--keycap-bg',
  '--keycap-text',
  '--keycap-border',
  '--keycap-modifier-bg',
  '--keycap-modifier-text',

  // Waveform
  '--waveform-bg',
  '--waveform-wave',
  '--waveform-playhead',
  '--waveform-region',
  '--waveform-marker',

  // Player
  '--player-bg',
  '--player-controls',
  '--player-progress',

  // List row states
  '--row-odd',
  '--row-even',
  '--row-hover',
  '--row-selected',

  // Tags/Badges
  '--tag-bg',
  '--tag-text',
  '--badge-bg',
  '--badge-text',
] as const;

export type ThemeCSSVariable = typeof THEME_CSS_VARIABLES[number];

/**
 * Get a CSS variable value from the root element
 * @param variable CSS variable name (e.g., '--text-primary')
 * @returns Color value (e.g., '#1a1a1a') or empty string if not found
 * 
 * @example
 * const textColor = getCSSVariable('--text-primary');
 * console.log(textColor); // '#1a1a1a'
 */
export function getCSSVariable(variable: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

/**
 * Set a CSS variable value on the root element
 * @param variable CSS variable name
 * @param value CSS value (color, size, etc.)
 * 
 * @example
 * setCSSVariable('--text-primary', '#000000');
 * setCSSVariable('--spacing-md', '20px');
 */
export function setCSSVariable(variable: string, value: string): void {
  if (typeof window === 'undefined') return;
  document.documentElement.style.setProperty(variable, value);
}

/**
 * Set multiple CSS variables at once
 * @param variables Object mapping variable names to values
 * 
 * @example
 * setMultipleCSSVariables({
 *   '--text-primary': '#000000',
 *   '--bg-primary': '#ffffff',
 *   '--accent-primary': '#1976d2',
 * });
 */
export function setMultipleCSSVariables(
  variables: Partial<Record<ThemeCSSVariable, string>>
): void {
  if (typeof window === 'undefined') return;
  const root = document.documentElement.style;
  Object.entries(variables).forEach(([key, value]) => {
    if (value) root.setProperty(key, value);
  });
}

/**
 * Get all current CSS variable values
 * @returns Object with all theme variables and their current values
 * 
 * @example
 * const currentTheme = getAllCSSVariables();
 * console.log(currentTheme['--text-primary']); // '#1a1a1a'
 */
export function getAllCSSVariables(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  const styles = getComputedStyle(document.documentElement);
  const result: Record<string, string> = {};
  
  THEME_CSS_VARIABLES.forEach((variable) => {
    const value = styles.getPropertyValue(variable).trim();
    if (value) {
      result[variable] = value;
    }
  });
  
  return result;
}

/**
 * Apply a complete theme object to CSS variables
 * Useful for theme switching from lib/themes/
 * 
 * @param themeVars Object with color values from theme definition
 * 
 * @example
 * const theme = resolveTheme('ableton-light');
 * applyThemeVariables(theme.colors);
 */
export function applyThemeVariables(
  themeVars: Record<string, string | undefined>
): void {
  if (typeof window === 'undefined') return;
  
  const validVars: Record<string, string> = {};
  Object.entries(themeVars).forEach(([key, value]) => {
    if (value && THEME_CSS_VARIABLES.includes(key as ThemeCSSVariable)) {
      validVars[key as ThemeCSSVariable] = value;
    }
  });
  
  setMultipleCSSVariables(validVars);
}

/**
 * Reset CSS variables to their default values
 * Useful for resetting theme to system preference
 */
export function resetCSSVariables(): void {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement.style;
  THEME_CSS_VARIABLES.forEach((variable) => {
    root.removeProperty(variable);
  });
}

/**
 * Check if theme variables are properly loaded
 * @returns true if variables are set, false if using defaults
 */
export function areThemeVariablesLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if a known variable is set
  const textColor = getCSSVariable('--text-primary');
  return textColor !== '';
}

/**
 * Watch for CSS variable changes
 * Useful for reacting to theme switches
 * 
 * @example
 * watchThemeVariables(() => {
 *   console.log('Theme changed!');
 * });
 */
export function watchThemeVariables(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const observer = new MutationObserver(() => {
    callback();
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style'],
  });
  
  return () => observer.disconnect();
}

/**
 * Convert hex color to RGB
 * Useful for calculations or opacity modifications
 * 
 * @example
 * const rgb = hexToRgb('#1976d2');
 * console.log(rgb); // { r: 25, g: 118, b: 210 }
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex color
 * @example
 * const hex = rgbToHex(25, 118, 210);
 * console.log(hex); // '#1976d2'
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Create CSS variable with opacity
 * Useful for creating semi-transparent colors
 * 
 * @example
 * setCSSVariable('--focus-ring', createWithOpacity('#1976d2', 0.5));
 * // Result: 'rgba(25, 118, 210, 0.5)'
 */
export function createWithOpacity(hexColor: string, opacity: number): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(1, Math.max(0, opacity))})`;
}

/**
 * Get RGB values of a CSS variable
 * Useful for calculations
 * 
 * @example
 * const rgb = getCSSVariableAsRgb('--accent-primary');
 * console.log(rgb); // { r: 25, g: 118, b: 210 }
 */
export function getCSSVariableAsRgb(variable: string): { r: number; g: number; b: number } | null {
  const value = getCSSVariable(variable);
  
  // Try parsing as hex
  if (value.startsWith('#')) {
    return hexToRgb(value);
  }
  
  // Try parsing as rgb/rgba
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
    };
  }
  
  return null;
}

/**
 * Lighten a color by a percentage
 * @param hexColor Color in hex format
 * @param percent Amount to lighten (0-100)
 * 
 * @example
 * const lighter = lightenColor('#1976d2', 20);
 */
export function lightenColor(hexColor: string, percent: number): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  
  const factor = percent / 100;
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor));
  
  return rgbToHex(r, g, b);
}

/**
 * Darken a color by a percentage
 * @example
 * const darker = darkenColor('#1976d2', 20);
 */
export function darkenColor(hexColor: string, percent: number): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  
  const factor = percent / 100;
  const r = Math.round(rgb.r * (1 - factor));
  const g = Math.round(rgb.g * (1 - factor));
  const b = Math.round(rgb.b * (1 - factor));
  
  return rgbToHex(r, g, b);
}
