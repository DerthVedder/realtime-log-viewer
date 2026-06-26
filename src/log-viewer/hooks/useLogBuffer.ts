import { useState, useCallback, useMemo, useEffect } from 'react';
import type { LogEntry } from '../../firehose/types';
import type { LogBufferReturn } from '../types';

/**
 * Binary search to find the insertion index for a new entry
 * Maintains timestamp ordering (monotonic non-decreasing)
 * For timestamp ties, preserves arrival order by inserting after existing entries
 */
function findInsertionIndex(entries: LogEntry[], newEntry: LogEntry): number {
  let left = 0;
  let right = entries.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (entries[mid].timestamp <= newEntry.timestamp) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left;
}

/**
 * Custom hook for managing log entry buffer with deduplication and ordering
 * 
 * Features:
 * - O(1) deduplication using Map<string, LogEntry> by ID
 * - Maintains sorted array for timestamp-ordered display
 * - Binary search insertion to maintain timestamp ordering
 * - FIFO eviction when capacity exceeded
 * - Memoized ordered array to prevent unnecessary re-renders
 * - StrictMode compatible (no RAF batching complexity)
 * 
 * @param capacity - Maximum number of entries to retain (default: 10000)
 * @returns Buffer interface with entries, add, clear, and stats functions
 */
export function useLogBuffer(capacity: number = 10000): LogBufferReturn {
  // Enforce minimum capacity
  const effectiveCapacity = Math.max(1000, Math.min(100000, capacity));

  // Primary storage: Map for O(1) dedup, array for ordered display
  // Use useMemo to recreate the Map only on mount (empty deps array)
  const entriesById = useMemo(() => new Map<string, LogEntry>(), []);
  const [orderedEntries, setOrderedEntries] = useState<LogEntry[]>([]);
  
  // Statistics
  const [stats, setStats] = useState({
    evictedCount: 0,
    totalReceived: 0,
    duplicateCount: 0,
  });

  // Sync Map with state on unmount - clear Map when component unmounts
  useEffect(() => {
    return () => {
      entriesById.clear();
    };
  }, [entriesById]);

  /**
   * Add entries to the buffer
   * React 18 automatically batches multiple setState calls
   */
  const addEntries = useCallback((entries: LogEntry[]) => {
    if (entries.length === 0) {
      return;
    }

    // Update stats
    setStats(prev => ({
      ...prev,
      totalReceived: prev.totalReceived + entries.length,
    }));

    setOrderedEntries((currentEntries) => {
      let newEntries = [...currentEntries];
      let duplicates = 0;

      // StrictMode fix: If state was reset but Map still has entries,
      // we need to rebuild from the Map first
      if (newEntries.length === 0 && entriesById.size > 0) {
        // State was reset but Map persisted - clear the Map to start fresh
        entriesById.clear();
      }

      // Process each entry
      for (const entry of entries) {
        // Check for duplicate
        if (entriesById.has(entry.id)) {
          duplicates++;
          continue;
        }

        // Add to Map for deduplication
        entriesById.set(entry.id, entry);

        // Find insertion point using binary search
        const insertIndex = findInsertionIndex(newEntries, entry);
        
        // Insert at correct position
        newEntries.splice(insertIndex, 0, entry);
      }

      // Update duplicate count
      if (duplicates > 0) {
        setStats(prev => ({
          ...prev,
          duplicateCount: prev.duplicateCount + duplicates,
        }));
      }

      // Apply capacity limit if exceeded (FIFO eviction)
      if (newEntries.length > effectiveCapacity) {
        const toEvict = newEntries.length - effectiveCapacity;
        const evicted = newEntries.splice(0, toEvict);
        
        // Remove evicted entries from Map
        for (const entry of evicted) {
          entriesById.delete(entry.id);
        }
        
        // Update evicted count
        setStats(prev => ({
          ...prev,
          evictedCount: prev.evictedCount + toEvict,
        }));
      }

      return newEntries;
    });
  }, [entriesById, effectiveCapacity]);

  /**
   * Clear all entries from the buffer
   */
  const clear = useCallback(() => {
    // Clear storage
    entriesById.clear();
    setOrderedEntries([]);

    // Reset stats (keep evicted count for historical tracking)
    setStats(prev => ({
      ...prev,
      totalReceived: 0,
      duplicateCount: 0,
    }));
  }, [entriesById]);

  /**
   * Memoized stats to prevent unnecessary re-renders
   */
  const memoizedStats = useMemo(() => ({
    total: orderedEntries.length,
    capacity: effectiveCapacity,
    evicted: stats.evictedCount,
  }), [orderedEntries.length, effectiveCapacity, stats.evictedCount]);

  /**
   * Memoized entries to prevent unnecessary re-renders
   */
  const memoizedEntries = useMemo(() => orderedEntries, [orderedEntries]);

  return {
    entries: memoizedEntries,
    addEntries,
    clear,
    stats: memoizedStats,
  };
}
