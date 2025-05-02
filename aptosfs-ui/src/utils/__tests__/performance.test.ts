import { 
  memoizeWithTTL, 
  debounce, 
  throttle, 
  measurePerformance,
  PerformanceMetrics,
  globalPerformanceMetrics
} from '../performance';

describe('Performance Utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('memoizeWithTTL', () => {
    it('should cache function results', () => {
      // Create a mock function to track calls
      const expensiveFn = jest.fn((a: number, b: number) => a + b);
      const memoized = memoizeWithTTL(expensiveFn);

      // First call should execute the function
      expect(memoized(1, 2)).toBe(3);
      expect(expensiveFn).toHaveBeenCalledTimes(1);

      // Second call with same args should use cached result
      expect(memoized(1, 2)).toBe(3);
      expect(expensiveFn).toHaveBeenCalledTimes(1); // Still only called once

      // Call with different args should execute the function again
      expect(memoized(3, 4)).toBe(7);
      expect(expensiveFn).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache after TTL expires', () => {
      const expensiveFn = jest.fn((a: number, b: number) => a + b);
      const memoized = memoizeWithTTL(expensiveFn, undefined, { ttl: 1000 });

      // First call should execute the function
      expect(memoized(1, 2)).toBe(3);
      expect(expensiveFn).toHaveBeenCalledTimes(1);

      // Advance time just below TTL
      jest.advanceTimersByTime(999);
      
      // Should still use cached result
      expect(memoized(1, 2)).toBe(3);
      expect(expensiveFn).toHaveBeenCalledTimes(1);

      // Advance time past TTL
      jest.advanceTimersByTime(2);
      
      // Should execute function again as TTL expired
      expect(memoized(1, 2)).toBe(3);
      expect(expensiveFn).toHaveBeenCalledTimes(2);
    });

    it('should respect max cache size', () => {
      const expensiveFn = jest.fn((n: number) => n * 2);
      const memoized = memoizeWithTTL(expensiveFn, undefined, { maxSize: 3 });

      // Fill cache with 3 items
      memoized(1);
      memoized(2);
      memoized(3);
      expect(expensiveFn).toHaveBeenCalledTimes(3);

      // This should use cached values
      memoized(1);
      memoized(2);
      memoized(3);
      expect(expensiveFn).toHaveBeenCalledTimes(3);

      // Adding more items should trigger cache cleanup
      memoized(4);
      expect(expensiveFn).toHaveBeenCalledTimes(4);
      
      // The oldest item (1) should have been removed from cache
      memoized(1);
      expect(expensiveFn).toHaveBeenCalledTimes(5);
    });
  });

  describe('debounce', () => {
    it('should only execute after delay has passed', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 1000);

      // Call multiple times
      debounced();
      debounced();
      debounced();
      
      // Function should not have been called yet
      expect(fn).not.toHaveBeenCalled();
      
      // Advance time
      jest.advanceTimersByTime(1000);
      
      // Function should now have been called exactly once
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset the timer on subsequent calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 1000);

      // First call
      debounced();
      
      // Advance time partially
      jest.advanceTimersByTime(500);
      
      // Second call should reset the timer
      debounced();
      
      // Advance time partially again
      jest.advanceTimersByTime(500);
      
      // Function should not have been called yet (only 500ms since last call)
      expect(fn).not.toHaveBeenCalled();
      
      // Advance remaining time
      jest.advanceTimersByTime(500);
      
      // Function should now have been called
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should execute immediately on first call', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 1000);

      throttled();
      
      // Should execute immediately
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should ignore calls within the throttle period', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 1000);

      throttled();
      throttled(); // Should be ignored
      throttled(); // Should be ignored
      
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Advance time past throttle period
      jest.advanceTimersByTime(1001);
      
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should queue one call at the end of throttle period', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 1000);

      throttled(); // Executes immediately
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Calls during throttle period
      throttled(); // Queued
      throttled(); // Updates the queued call
      
      // Advance time past throttle period
      jest.advanceTimersByTime(1001);
      
      // Queued call should execute
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('measurePerformance', () => {
    it('should call the original function and return its result', () => {
      const originalFn = jest.fn().mockReturnValue(42);
      const measured = measurePerformance(originalFn, 'test');
      
      const result = measured();
      
      expect(originalFn).toHaveBeenCalledTimes(1);
      expect(result).toBe(42);
    });
  });

  describe('PerformanceMetrics', () => {
    it('should record metrics and calculate averages', () => {
      const metrics = new PerformanceMetrics();
      
      metrics.record('load', 100);
      metrics.record('load', 200);
      metrics.record('load', 300);
      
      expect(metrics.getAverage('load')).toBe(200);
    });
    
    it('should limit the number of samples', () => {
      const metrics = new PerformanceMetrics(2);
      
      metrics.record('load', 100);
      metrics.record('load', 200);
      metrics.record('load', 300); // This should push out the first sample (100)
      
      expect(metrics.getAverage('load')).toBe(250); // Average of 200 and 300
    });
    
    it('should generate a report of all metrics', () => {
      const metrics = new PerformanceMetrics();
      
      metrics.record('load', 100);
      metrics.record('load', 200);
      metrics.record('render', 50);
      metrics.record('render', 70);
      
      const report = metrics.getReport();
      
      expect(report).toEqual({
        load: 150,
        render: 60
      });
    });
    
    it('should reset all metrics', () => {
      const metrics = new PerformanceMetrics();
      
      metrics.record('load', 100);
      metrics.reset();
      
      expect(metrics.getAverage('load')).toBeUndefined();
    });
  });

  describe('globalPerformanceMetrics', () => {
    it('should be an instance of PerformanceMetrics', () => {
      expect(globalPerformanceMetrics).toBeInstanceOf(PerformanceMetrics);
    });
  });
});