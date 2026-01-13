/**
 * Performance optimization utilities
 * Handles caching, lazy loading, and performance monitoring
 */

/**
 * Simple cache implementation
 */
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();

  set(key: string, data: T, ttlMs: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instances
export const apiCache = new SimpleCache();
export const profileCache = new SimpleCache();

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), waitMs);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limitMs);
    }
  };
}

/**
 * Lazy loading utility
 */
export function createLazyLoader<T>(
  loader: () => Promise<T>
): () => Promise<T> {
  let promise: Promise<T> | null = null;
  
  return () => {
    if (!promise) {
      promise = loader();
    }
    return promise;
  };
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  startTiming(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      
      this.metrics.get(label)!.push(duration);
    };
  }

  getAverageTime(label: string): number {
    const times = this.metrics.get(label);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getMetrics(): Record<string, { average: number; count: number; total: number }> {
    const result: Record<string, { average: number; count: number; total: number }> = {};
    
    this.metrics.forEach((times, label) => {
      const total = times.reduce((sum, time) => sum + time, 0);
      result[label] = {
        average: total / times.length,
        count: times.length,
        total
      };
    });
    
    return result;
  }

  clear(): void {
    this.metrics.clear();
  }
}

// Global performance monitor
export const performanceMonitor = new PerformanceMonitor();

/**
 * Optimize localStorage operations
 */
export const optimizedStorage = {
  get: debounce((key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }, 100),

  set: debounce((key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to write to localStorage:', error);
    }
  }, 1000),

  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }
};

/**
 * Code splitting utilities
 */
export const lazyComponents = {
  PreviewModal: createLazyLoader(() => import('@/components/PreviewModal')),
  PDFComponents: createLazyLoader(() => Promise.all([
    import('@/components/pdf/GermanCVPDF'),
    import('@/components/pdf/GermanCoverLetterPDF'),
    import('@/components/pdf/EnglishCVPDF'),
    import('@/components/pdf/EnglishCoverLetterPDF')
  ]))
};

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): any {
  if ('memory' in performance) {
    return (performance as any).memory;
  }
  return null;
}

/**
 * Bundle size optimization
 */
export function preloadCriticalResources(): void {
  if (typeof document === 'undefined') return;
  
  // Preload critical fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0e.ttf';
  fontLink.as = 'font';
  fontLink.type = 'font/ttf';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);
}