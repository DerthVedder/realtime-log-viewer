import { UIEvent, useState, useEffect, useRef, useCallback } from 'react';
import type { VirtualizedLogListProps } from '../types';
import LogEntryRow from './LogEntryRow';
import './VirtualizedLogList.css';

/**
 * Virtualized log list component for efficient rendering of large entry lists.
 * 
 * Features:
 * - Window-based rendering (only visible rows + overscan)
 * - Fixed row height for consistent scroll calculations
 * - Auto-scroll to bottom on new entries (if enabled)
 * - Smooth scrolling with overscan buffering
 * 
 */
const VirtualizedLogList = ({
  entries,
  height,
  rowHeight,
  autoScroll,
  highlightQuery,
}: VirtualizedLogListProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevEntriesLengthRef = useRef(entries.length);
  const isUserScrollingRef = useRef(false);

  // Get viewport height from container on each render
  // This ensures we always use the current actual height
  const containerHeight = containerRef.current?.clientHeight || height;

  // Calculate viewport metrics
  const overscan = 5;
  const totalHeight = entries.length * rowHeight;
  const viewportHeight = containerHeight;
  
  // Ensure spacer is at least as tall as the container to fill the viewport
  const spacerHeight = Math.max(totalHeight, viewportHeight);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    entries.length,
    Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan
  );

  const visibleEntries = entries.slice(startIndex, endIndex);

  // Handle scroll events
  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    
    // Check if user scrolled to bottom
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 10;
    isUserScrollingRef.current = !isAtBottom;
  }, []);

  // Reset user scrolling flag when auto-scroll is enabled
  useEffect(() => {
    if (autoScroll) {
      isUserScrollingRef.current = false;
    }
  }, [autoScroll]);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (!autoScroll || isUserScrollingRef.current) {
      return;
    }

    // Only auto-scroll if entries were added
    if (entries.length > prevEntriesLengthRef.current) {
      const container = containerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }

    prevEntriesLengthRef.current = entries.length;
  }, [entries.length, autoScroll]);

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="virtualized-log-list virtualized-log-list--empty">
        <div className="virtualized-log-list__empty-message">
          No log entries. Connect to start streaming.
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="virtualized-log-list"
      onScroll={handleScroll}
    >
      <div className="virtualized-log-list__spacer" style={{ height: spacerHeight }}>
        <div className="virtualized-log-list__content">
          {visibleEntries.map((entry, index) => {
            const actualIndex = startIndex + index;
            const top = actualIndex * rowHeight;
            
            return (
              <div
                key={entry.id}
                className="virtualized-log-list__row"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: rowHeight,
                  transform: `translateY(${top}px)`,
                }}
              >
                <LogEntryRow entry={entry} highlightQuery={highlightQuery} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedLogList;
