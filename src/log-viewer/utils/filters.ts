import type { LogEntry } from '../../firehose/types';
import type { FilterState } from '../types';

/**
 * Filter entries by level set.
 * Empty set = show all entries.
 * Non-empty set = show only entries matching the level set.
 * 
 * This function is pure and non-destructive.
 * 
 * @param entries - Array of log entries to filter
 * @param levels - Set of levels to include (empty set = show all)
 * @returns Filtered array of log entries
 */
export function filterByLevel(
  entries: LogEntry[],
  levels: Set<LogEntry['level']>
): LogEntry[] {
  // Empty set means no filter applied - show all
  if (levels.size === 0) {
    return entries;
  }
  
  // Filter to only entries matching the level set
  return entries.filter(entry => levels.has(entry.level));
}

/**
 * Filter entries by service set.
 * Empty set = show all entries.
 * Non-empty set = show only entries matching the service set.
 * 
 * This function is pure and non-destructive.
 * 
 * @param entries - Array of log entries to filter
 * @param services - Set of services to include (empty set = show all)
 * @returns Filtered array of log entries
 */
export function filterByService(
  entries: LogEntry[],
  services: Set<string>
): LogEntry[] {
  // Empty set means no filter applied - show all
  if (services.size === 0) {
    return entries;
  }
  
  // Filter to only entries matching the service set
  return entries.filter(entry => services.has(entry.service));
}

/**
 * Apply level and service filters with AND logic.
 * Combines both filters - an entry must match both criteria to be included.
 * 
 * This function is pure and non-destructive.
 * 
 * @param entries - Array of log entries to filter
 * @param filters - Filter state containing level and service sets
 * @returns Filtered array of log entries
 */
export function applyFilters(
  entries: LogEntry[],
  filters: FilterState
): LogEntry[] {
  // Apply level filter first
  let filtered = filterByLevel(entries, filters.levels);
  
  // Apply service filter to the result (AND logic)
  filtered = filterByService(filtered, filters.services);
  
  return filtered;
}
