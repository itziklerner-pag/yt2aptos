/**
 * Performance utilities for AptosFS UI components
 */

/**
 * Memoization with cache invalidation for expensive computations
 * @param fn Function to memoize
 * @param getKey Function to derive cache key from arguments
 * @param options Cache options
 * @returns Memoized function
 */
export function memoizeWithTTL<T, A extends any[]>(
  fn: (...args: A) => T,
  getKey: (...args: A) => string = (...args) => JSON.stringify(args),
  options: { ttl?: number; maxSize?: number } = {}
): (...args: A) => T {
  const { ttl = 3600000, maxSize = 100 } = options; // Default 1 hour TTL, 100 items max
  const cache = new Map<string, { value: T; timestamp: number }>();

  return (...args: A): T => {
    const key = getKey(...args);
    const cached = cache.get(key);
    const now = Date.now();

    // Return from cache if valid
    if (cached && now - cached.timestamp < ttl) {
      return cached.value;
    }

    // Compute new value
    const value = fn(...args);

    // Clean up cache if too large
    if (cache.size >= maxSize) {
      // Find oldest entries to remove
      const entries = Array.from(cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, Math.floor(maxSize / 5)); // Remove ~20% of oldest entries
      
      entries.forEach(([entryKey]) => cache.delete(entryKey));
    }

    // Store new value
    cache.set(key, { value, timestamp: now });
    return value;
  };
}

/**
 * Debounce function to limit rate of execution
 * @param fn Function to debounce
 * @param delay Debounce delay in ms
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function(this: any, ...args: Parameters<T>): void {
    const context = this;
    
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      fn.apply(context, args);
    }, delay);
  };
}

/**
 * Throttle function to limit execution rate
 * @param fn Function to throttle
 * @param limit Minimum time between executions in ms
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return function(this: any, ...args: Parameters<T>): void {
    const now = Date.now();
    const context = this;
    
    if (now - lastCall >= limit) {
      // If enough time has passed, execute immediately
      lastCall = now;
      fn.apply(context, args);
    } else if (!timeout) {
      // Otherwise schedule execution at the end of the throttle period
      const remaining = limit - (now - lastCall);
      timeout = setTimeout(() => {
        timeout = undefined;
        lastCall = Date.now();
        fn.apply(context, args);
      }, remaining);
    }
  };
}

/**
 * Measure function execution time
 * @param fn Function to measure
 * @param label Label for console output
 * @returns Wrapped function with timing
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  label: string
): (...args: Parameters<T>) => ReturnType<T> {
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const start = performance.now();
    const result = fn.apply(this, args);
    const end = performance.now();
    
    console.debug(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
    
    return result;
  };
}

/**
 * Performance metrics gatherer for collecting and reporting metrics
 */
export class PerformanceMetrics {
  private metrics: Map<string, number[]> = new Map();
  private maxSamples: number;
  
  constructor(maxSamples = 10) {
    this.maxSamples = maxSamples;
  }
  
  /**
   * Record a performance metric
   * @param name Metric name
   * @param value Metric value (usually time in ms)
   */
  record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const samples = this.metrics.get(name)!;
    samples.push(value);
    
    // Trim excess samples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }
  
  /**
   * Get average value for a metric
   * @param name Metric name
   * @returns Average value or undefined if no samples
   */
  getAverage(name: string): number | undefined {
    const samples = this.metrics.get(name);
    if (!samples || samples.length === 0) {
      return undefined;
    }
    
    const sum = samples.reduce((acc, val) => acc + val, 0);
    return sum / samples.length;
  }
  
  /**
   * Get all metrics as a report object
   * @returns Report with averages for all metrics
   */
  getReport(): Record<string, number | undefined> {
    const report: Record<string, number | undefined> = {};
    
    for (const [name] of this.metrics) {
      report[name] = this.getAverage(name);
    }
    
    return report;
  }
  
  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
  }
}

// Singleton performance metrics instance for app-wide use
export const globalPerformanceMetrics = new PerformanceMetrics();