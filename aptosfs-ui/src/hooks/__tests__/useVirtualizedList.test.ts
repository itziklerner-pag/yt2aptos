import { renderHook, act } from '@testing-library/react-hooks';
import { useVirtualizedList } from '../useVirtualizedList';

describe('useVirtualizedList', () => {
  // Create test data
  const mockItems = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
  const itemHeight = 40;
  const containerHeight = 400;
  const overscan = 2;

  it('should return the correct initial virtualized items', () => {
    const { result } = renderHook(() => 
      useVirtualizedList(mockItems, itemHeight, containerHeight, overscan)
    );

    // Calculate expected number of items (container height / item height + 2*overscan)
    const expectedVisibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
    
    expect(result.current.virtualItems.length).toBeLessThanOrEqual(expectedVisibleCount);
    expect(result.current.totalHeight).toBe(mockItems.length * itemHeight);
    expect(result.current.scrollRef.current).toBeNull();
  });

  it('should update virtual items when scrolling', () => {
    const { result } = renderHook(() => 
      useVirtualizedList(mockItems, itemHeight, containerHeight, overscan)
    );

    // Setup scroll ref and initial items
    const initialItems = [...result.current.virtualItems];
    const mockScrollRef = {
      scrollTop: 500, // Scroll down to around item 12-13
    };

    // Set mock scroll ref and trigger scroll
    act(() => {
      result.current.scrollRef.current = mockScrollRef as any;
      result.current.handleScroll();
    });

    // After scrolling, virtual items should be different
    expect(result.current.virtualItems).not.toEqual(initialItems);
    
    // Calculate expected start index based on scroll position
    const expectedStartIndex = Math.max(0, Math.floor(mockScrollRef.scrollTop / itemHeight) - overscan);
    
    // First virtual item should match expected start index
    expect(result.current.virtualItems[0].index).toBe(expectedStartIndex);
  });

  it('should handle empty items array', () => {
    const { result } = renderHook(() => 
      useVirtualizedList([], itemHeight, containerHeight, overscan)
    );

    expect(result.current.virtualItems.length).toBe(0);
    expect(result.current.totalHeight).toBe(0);
  });

  it('should maintain correct item offsets', () => {
    const { result } = renderHook(() => 
      useVirtualizedList(mockItems, itemHeight, containerHeight, overscan)
    );

    // Check that each item has the correct offsetTop
    result.current.virtualItems.forEach(virtualItem => {
      expect(virtualItem.offsetTop).toBe(virtualItem.index * itemHeight);
      expect(virtualItem.height).toBe(itemHeight);
    });
  });
});