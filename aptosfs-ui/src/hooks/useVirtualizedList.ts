import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for virtualizing large lists to improve performance
 * Only renders items that are currently in the viewport, plus a buffer
 * 
 * @param items - The complete list of items to virtualize
 * @param itemHeight - Height of each item in pixels
 * @param containerHeight - Visible container height in pixels
 * @param overscan - Number of extra items to render above/below viewport
 * @returns Object containing virtualized items and scroll handlers
 */
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number, 
  overscan: number = 5
) {
  // Track scroll position
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  
  // Calculate which items should be visible
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  // Create the virtualized items array
  const virtualItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    item,
    index: startIndex + index,
    offsetTop: (startIndex + index) * itemHeight,
    height: itemHeight
  }));
  
  // Calculate the total height of all items
  const totalHeight = items.length * itemHeight;
  
  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
    }
  }, []);
  
  // Update scroll position on resize
  useEffect(() => {
    const handleResize = () => {
      if (scrollRef.current) {
        setScrollTop(scrollRef.current.scrollTop);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return {
    virtualItems,
    totalHeight,
    scrollRef,
    handleScroll
  };
}