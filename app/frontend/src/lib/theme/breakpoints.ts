/**
 * Responsive Design Breakpoints
 * 
 * Mobile-first breakpoint definitions for the Passion OS frontend.
 * Used throughout the application for responsive design patterns.
 * 
 * Breakpoint Philosophy:
 * - Mobile first: Start with mobile styles, add complexity at larger breakpoints
 * - Conservative: Use larger breakpoints to ensure stability
 * - Consistent: All media queries use these exact values
 * 
 * @since 2026-01-17
 */

// ============================================================================
// BREAKPOINTS - Pixel Values
// ============================================================================

/** Mobile devices (phones) - Default, no media query needed */
export const MOBILE_MIN = 0;

/** Small tablets and large phones (landscape) - 640px min-width */
export const TABLET_MIN = 640;

/** Standard tablets and iPads - 768px min-width */
export const TABLET_LARGE_MIN = 768;

/** Laptops and desktops - 1024px min-width */
export const DESKTOP_MIN = 1024;

/** Large desktops - 1280px min-width */
export const DESKTOP_LARGE_MIN = 1280;

/** Extra large displays - 1536px min-width */
export const DESKTOP_XLARGE_MIN = 1536;

// ============================================================================
// MEDIA QUERIES - Ready-to-use strings
// ============================================================================

/** @example @media (${media.tablet}) { ... } */
export const media = {
  /** Tablets and larger (640px+) */
  tablet: `min-width: ${TABLET_MIN}px`,
  
  /** Tablets and larger (768px+) */
  tabletLarge: `min-width: ${TABLET_LARGE_MIN}px`,
  
  /** Desktops and larger (1024px+) */
  desktop: `min-width: ${DESKTOP_MIN}px`,
  
  /** Large desktops (1280px+) */
  desktopLarge: `min-width: ${DESKTOP_LARGE_MIN}px`,
  
  /** Extra large displays (1536px+) */
  desktopXLarge: `min-width: ${DESKTOP_XLARGE_MIN}px`,
} as const;

// ============================================================================
// CSS-IN-JS HELPERS
// ============================================================================

/**
 * Helper for styled-components or emotion
 * Usage: const StyledDiv = styled.div` ${mixin.tablet`...`} `;
 */
export const mixin = {
  tablet: (styles: string) => `@media (${media.tablet}) { ${styles} }`,
  tabletLarge: (styles: string) => `@media (${media.tabletLarge}) { ${styles} }`,
  desktop: (styles: string) => `@media (${media.desktop}) { ${styles} }`,
  desktopLarge: (styles: string) => `@media (${media.desktopLarge}) { ${styles} }`,
  desktopXLarge: (styles: string) => `@media (${media.desktopXLarge}) { ${styles} }`,
} as const;

// ============================================================================
// REACT HOOK FOR RESPONSIVE LOGIC
// ============================================================================

import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'tabletLarge' | 'desktop' | 'desktopLarge' | 'desktopXLarge';

/**
 * React hook to detect current breakpoint
 * @returns Current breakpoint name
 * 
 * @example
 * const breakpoint = useBreakpoint();
 * if (breakpoint === 'mobile') {
 *   return <MobileMenu />;
 * }
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('mobile');

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      
      if (width >= DESKTOP_XLARGE_MIN) {
        setBreakpoint('desktopXLarge');
      } else if (width >= DESKTOP_LARGE_MIN) {
        setBreakpoint('desktopLarge');
      } else if (width >= DESKTOP_MIN) {
        setBreakpoint('desktop');
      } else if (width >= TABLET_LARGE_MIN) {
        setBreakpoint('tabletLarge');
      } else if (width >= TABLET_MIN) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('mobile');
      }
    }

    // Initial check
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

/**
 * Check if current viewport is at least a certain breakpoint
 * @example isBreakpointOrLarger('tablet') → true on tablets and larger
 */
export function useIsBreakpointOrLarger(targetBreakpoint: Breakpoint): boolean {
  const currentBreakpoint = useBreakpoint();
  
  const order: Breakpoint[] = ['mobile', 'tablet', 'tabletLarge', 'desktop', 'desktopLarge', 'desktopXLarge'];
  const currentIndex = order.indexOf(currentBreakpoint);
  const targetIndex = order.indexOf(targetBreakpoint);
  
  return currentIndex >= targetIndex;
}

// ============================================================================
// DEVICE TYPE DETECTION (convenience helpers)
// ============================================================================

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Simplified device type detection
 * Useful for major layout decisions
 */
export function useDeviceType(): DeviceType {
  const breakpoint = useBreakpoint();
  
  if (breakpoint === 'mobile') return 'mobile';
  if (breakpoint === 'tablet' || breakpoint === 'tabletLarge') return 'tablet';
  return 'desktop';
}

// ============================================================================
// RESPONSIVE UTILITY FUNCTIONS
// ============================================================================

/**
 * Get value based on current breakpoint
 * @example getResponsiveValue({ mobile: 'small', desktop: 'large' })
 */
export function useResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  defaultValue: T
): T {
  const breakpoint = useBreakpoint();
  return values[breakpoint] ?? defaultValue;
}

/**
 * Check if we're on a touch device
 * Useful for adjusting spacing, button sizes, etc.
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Check for touch support
    const hasTouch = () => {
      const navWithMsMaxTouchPoints = navigator as Navigator & { msMaxTouchPoints?: number };
      return (
        window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
        navigator.maxTouchPoints > 0 ||
        navWithMsMaxTouchPoints.msMaxTouchPoints !== undefined
      );
    };

    setIsTouch(hasTouch());
  }, []);

  return isTouch;
}

// ============================================================================
// CSS CUSTOM PROPERTIES (for CSS Module integration)
// ============================================================================

/**
 * Apply breakpoint media query as CSS variable
 * Usage in CSS: @media (--tablet) { ... }
 * Note: CSS @ supports check needed for full compatibility
 * 
 * For now, use media.tablet constant in JS-in-CSS solutions
 */
export const BREAKPOINT_CSS_VARIABLES = `
  :root {
    --breakpoint-mobile: ${MOBILE_MIN}px;
    --breakpoint-tablet: ${TABLET_MIN}px;
    --breakpoint-tablet-large: ${TABLET_LARGE_MIN}px;
    --breakpoint-desktop: ${DESKTOP_MIN}px;
    --breakpoint-desktop-large: ${DESKTOP_LARGE_MIN}px;
    --breakpoint-desktop-xlarge: ${DESKTOP_XLARGE_MIN}px;
  }
`;

/**
 * Import this CSS string in your root CSS file:
 * 
 * app/frontend/src/styles/breakpoints.css:
 * ${BREAKPOINT_CSS_VARIABLES}
 * 
 * Then use in media queries:
 * @media (min-width: var(--breakpoint-desktop)) { ... }
 */
