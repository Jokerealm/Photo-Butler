'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5,
  onScroll,
  getItemKey
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Calculate total height
  const totalHeight = items.length * itemHeight;

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Render visible items
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (i < items.length) {
        const item = items[i];
        const key = getItemKey ? getItemKey(item, i) : i;
        result.push(
          <div
            key={key}
            style={{
              position: 'absolute',
              top: i * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, i)}
          </div>
        );
      }
    }
    return result;
  }, [visibleRange, items, itemHeight, renderItem, getItemKey]);

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      const scrollTop = index * itemHeight;
      containerRef.current.scrollTop = scrollTop;
      setScrollTop(scrollTop);
    }
  }, [itemHeight]);

  // Expose scroll methods via ref
  React.useImperativeHandle(containerRef, () => ({
    scrollToIndex,
    scrollToTop: () => scrollToIndex(0),
    scrollToBottom: () => scrollToIndex(items.length - 1),
  }));

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
}

export default VirtualList;

// Hook for easier usage with dynamic item heights
export function useVirtualList<T>({
  items,
  estimatedItemHeight = 50,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  estimatedItemHeight?: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate positions based on measured heights
  const itemPositions = useMemo(() => {
    const positions = new Map<number, { top: number; height: number }>();
    let currentTop = 0;

    for (let i = 0; i < items.length; i++) {
      const height = itemHeights.get(i) || estimatedItemHeight;
      positions.set(i, { top: currentTop, height });
      currentTop += height;
    }

    return positions;
  }, [items.length, itemHeights, estimatedItemHeight]);

  // Calculate visible range with dynamic heights
  const visibleRange = useMemo(() => {
    let startIndex = 0;
    let endIndex = items.length - 1;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const position = itemPositions.get(i);
      if (position && position.top + position.height > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
    }

    // Find end index
    for (let i = startIndex; i < items.length; i++) {
      const position = itemPositions.get(i);
      if (position && position.top > scrollTop + containerHeight) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
    }

    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, items.length, itemPositions, overscan]);

  // Get total height
  const totalHeight = useMemo(() => {
    const lastPosition = itemPositions.get(items.length - 1);
    return lastPosition ? lastPosition.top + lastPosition.height : 0;
  }, [itemPositions, items.length]);

  // Measure item height
  const measureItem = useCallback((index: number, height: number) => {
    setItemHeights(prev => {
      const newMap = new Map(prev);
      newMap.set(index, height);
      return newMap;
    });
  }, []);

  return {
    visibleRange,
    totalHeight,
    itemPositions,
    measureItem,
    setScrollTop,
  };
}