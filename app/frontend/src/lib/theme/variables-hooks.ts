/**
 * React Hooks for CSS Variables Theme System
 * 
 * Provides React hooks for accessing and modifying theme CSS variables
 * in functional components.
 * 
 * @since 2026-01-17
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ThemeCSSVariable } from './variables-api';
import {
  getCSSVariable,
  setCSSVariable,
  setMultipleCSSVariables,
  getAllCSSVariables,
  applyThemeVariables,
  watchThemeVariables,
  hexToRgb,
  rgbToHex,
  createWithOpacity,
  lightenColor,
  darkenColor,
  getCSSVariableAsRgb,
} from './variables-api';

/**
 * Get current value of a CSS variable
 * Re-renders when theme changes (detected via MutationObserver)
 * 
 * @example
 * const textColor = useCSSVariable('--text-primary');
 * return <div style={{ color: textColor }}>{content}</div>;
 */
export function useCSSVariable(variable: ThemeCSSVariable | string): string {
  const [value, setValue] = useState<string>(() => getCSSVariable(variable));

  useEffect(() => {
    // Set initial value
    setValue(getCSSVariable(variable));

    // Watch for changes
    const unwatch = watchThemeVariables(() => {
      setValue(getCSSVariable(variable));
    });

    return unwatch;
  }, [variable]);

  return value;
}

/**
 * Get all CSS variables at once
 * Useful for getting entire theme snapshot
 * 
 * @example
 * const theme = useAllCSSVariables();
 * console.log(theme['--text-primary']);
 */
export function useAllCSSVariables(): Record<string, string> {
  const [variables, setVariables] = useState<Record<string, string>>(() => getAllCSSVariables());

  useEffect(() => {
    setVariables(getAllCSSVariables());

    const unwatch = watchThemeVariables(() => {
      setVariables(getAllCSSVariables());
    });

    return unwatch;
  }, []);

  return variables;
}

/**
 * Set a CSS variable and update local state
 * 
 * @example
 * const [color, setColor] = useEditableCSSVariable('--accent-primary', '#1976d2');
 * return <input value={color} onChange={(e) => setColor(e.target.value)} />;
 */
export function useEditableCSSVariable(
  variable: ThemeCSSVariable | string,
  initialValue?: string
): [string, (value: string) => void] {
  const [value, setValue] = useState<string>(() => initialValue || getCSSVariable(variable));

  const setAndApply = useCallback((newValue: string) => {
    setValue(newValue);
    setCSSVariable(variable, newValue);
  }, [variable]);

  return [value, setAndApply];
}

/**
 * Get a CSS variable as RGB object
 * Useful for color calculations
 * 
 * @example
 * const rgb = useCSSVariableAsRgb('--accent-primary');
 * if (rgb) {
 *   return <div style={{ background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)` }} />;
 * }
 */
export function useCSSVariableAsRgb(
  variable: ThemeCSSVariable | string
): { r: number; g: number; b: number } | null {
  const value = useCSSVariable(variable as ThemeCSSVariable);
  return getCSSVariableAsRgb(value);
}

/**
 * Get RGB values with optional opacity
 * Useful for creating semi-transparent variants
 * 
 * @example
 * const focusRingStyle = useCSSVariableAsRgba('--accent-primary', 0.5);
 * return <div style={{ boxShadow: `0 0 0 3px ${focusRingStyle}` }} />;
 */
export function useCSSVariableAsRgba(
  variable: ThemeCSSVariable | string,
  opacity?: number
): string {
  const rgb = useCSSVariableAsRgb(variable);
  
  if (!rgb) return '';
  
  const finalOpacity = opacity ?? 1;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${finalOpacity})`;
}

/**
 * Apply a theme object (collection of CSS variables)
 * Useful after loading theme from API or theme selector
 * 
 * @example
 * const applyTheme = useApplyTheme();
 * const theme = await fetchTheme('dark');
 * applyTheme(theme.colors);
 */
export function useApplyTheme(): (themeVars: Record<string, string | undefined>) => void {
  return useCallback((themeVars: Record<string, string | undefined>) => {
    applyThemeVariables(themeVars);
  }, []);
}

/**
 * Get a color and optional variants (lighter/darker)
 * Useful for color schemes
 * 
 * @example
 * const { base, light, dark } = useColorVariants('--accent-primary');
 * return (
 *   <div style={{
 *     background: base,
 *     border: `2px solid ${dark}`,
 *     '&:hover': { background: light }
 *   }} />
 * );
 */
export function useColorVariants(variable: ThemeCSSVariable | string) {
  const baseColor = useCSSVariable(variable as ThemeCSSVariable);
  
  return {
    base: baseColor,
    light: lightenColor(baseColor, 20),
    lighter: lightenColor(baseColor, 40),
    dark: darkenColor(baseColor, 20),
    darker: darkenColor(baseColor, 40),
    withOpacity: (opacity: number) => createWithOpacity(baseColor, opacity),
  };
}

/**
 * Watch theme changes and trigger callback
 * Useful for side effects when theme changes
 * 
 * @example
 * useThemeChange(() => {
 *   // Re-render chart with new colors
 *   chart.redraw();
 * });
 */
export function useThemeChange(callback: () => void): void {
  useEffect(() => {
    const unwatch = watchThemeVariables(callback);
    return unwatch;
  }, [callback]);
}

/**
 * Get a derived color value from two variables
 * Useful for consistent color relationships
 * 
 * @example
 * const blended = useMixedColor('--accent-primary', '--accent-secondary', 0.5);
 * // 50% mix of primary and secondary accent colors
 */
export function useMixedColor(
  variable1: ThemeCSSVariable | string,
  variable2: ThemeCSSVariable | string,
  ratio: number = 0.5
): string {
  const color1 = useCSSVariable(variable1 as ThemeCSSVariable);
  const color2 = useCSSVariable(variable2 as ThemeCSSVariable);

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return color1;

  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);

  return rgbToHex(r, g, b);
}

/**
 * Batch update multiple CSS variables with type safety
 * 
 * @example
 * const updateTheme = useBatchUpdateCSSVariables();
 * updateTheme({
 *   '--text-primary': '#000000',
 *   '--bg-primary': '#ffffff',
 * });
 */
export function useBatchUpdateCSSVariables() {
  return useCallback(
    (variables: Partial<Record<ThemeCSSVariable, string>>) => {
      setMultipleCSSVariables(variables);
    },
    []
  );
}

/**
 * Track theme updates for animation/transition purposes
 * Useful for smooth color transitions
 * 
 * @example
 * const isTransitioning = useThemeTransition();
 * return (
 *   <div style={{
 *     transition: isTransitioning ? 'all 300ms ease-in-out' : 'none'
 *   }}>
 *     Content
 *   </div>
 * );
 */
export function useThemeTransition(): boolean {
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 350); // Matches CSS transition time
    return () => clearTimeout(timer);
  }, []);

  useThemeChange(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 350);
    return () => clearTimeout(timer);
  });

  return isTransitioning;
}
