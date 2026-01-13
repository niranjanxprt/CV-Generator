/**
 * Responsive design utilities and mobile optimization
 * Handles responsive layouts and mobile-friendly interactions
 */

export const breakpoints = {
  mobile: 375,
  tablet: 768,
  desktop: 1024,
  wide: 1920
} as const;

/**
 * Check if current viewport matches breakpoint
 */
export function isBreakpoint(breakpoint: keyof typeof breakpoints): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints[breakpoint];
}

/**
 * Get current breakpoint
 */
export function getCurrentBreakpoint(): keyof typeof breakpoints {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width >= breakpoints.wide) return 'wide';
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
}

/**
 * Mobile-optimized touch target sizes
 */
export const touchTargets = {
  minimum: 44, // iOS minimum
  recommended: 48, // Material Design
  comfortable: 56
} as const;

/**
 * Responsive font sizes
 */
export const fontSizes = {
  mobile: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem'
  },
  desktop: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem'
  }
} as const;

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoints.tablet;
}

/**
 * Check if device is touch-enabled
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Optimize for mobile Safari
 */
export function optimizeForMobileSafari(): void {
  if (typeof document === 'undefined') return;
  
  // Prevent zoom on input focus
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
    );
  }
  
  // Add mobile Safari specific styles
  const style = document.createElement('style');
  style.textContent = `
    /* Prevent zoom on input focus */
    input, select, textarea {
      font-size: 16px !important;
    }
    
    /* Fix iOS Safari bottom bar issues */
    .full-height {
      height: 100vh;
      height: -webkit-fill-available;
    }
    
    /* Improve touch targets */
    button, .clickable {
      min-height: 44px;
      min-width: 44px;
    }
  `;
  document.head.appendChild(style);
}