import { useEffect, useState, useMemo, useCallback } from 'react';
import type { LogViewerProps, FilterState, SearchState } from '../types';
import { useLogBuffer } from '../hooks/useLogBuffer';
import { useConnectionManager } from '../hooks/useConnectionManager';
import { applyFilters } from '../utils/filters';
import { searchEntries } from '../utils/search';
import LogViewerToolbar from './LogViewerToolbar';
import VirtualizedLogList from './VirtualizedLogList';
import './LogViewer.css';

/**
 * Main LogViewer container component.
 * 
 * Integrates:
 * - Entry Buffer (deduplication, ordering, capacity)
 * - Connection Manager (lifecycle, auto-reconnect)
 * - Filtering (level, service)
 * - Search (with highlighting)
 * - Virtualized rendering
 * 
 */
const LogViewer = ({
  className = '',
  defaultCapacity = 10000,
  autoConnect = true,
}: LogViewerProps) => {
  // Initialize buffer
  const buffer = useLogBuffer(defaultCapacity);

  // Initialize connection manager
  const connection = useConnectionManager(
    (entry) => buffer.addEntries([entry]),
    true // auto-reconnect enabled
  );

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    levels: new Set(),
    services: new Set(),
  });

  // Search state
  const [search, setSearch] = useState<SearchState>({
    query: '',
    caseSensitive: false,
  });

  // View state
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && connection.status === 'closed') {
      connection.connect();
    }
  }, [autoConnect, connection]);

  // Compute filtered and searched entries
  const displayedEntries = useMemo(() => {
    // Apply filters
    let filtered = applyFilters(buffer.entries, filters);

    // Apply search
    if (search.query.trim()) {
      filtered = searchEntries(filtered, search.query);
    }

    return filtered;
  }, [buffer.entries, filters, search.query]);

  // Handle clear buffer
  const handleClear = useCallback(() => {
    buffer.clear();
  }, [buffer]);

  return (
    <div className={`log-viewer ${className}`}>
      <LogViewerToolbar
        status={connection.status}
        onConnect={connection.connect}
        onDisconnect={connection.disconnect}
        filters={filters}
        onFilterChange={setFilters}
        search={search}
        onSearchChange={setSearch}
        autoScroll={autoScroll}
        onAutoScrollChange={setAutoScroll}
        onClear={handleClear}
      />

      <div className="log-viewer__stats">
        <span className="log-viewer__stat">
          Total: {buffer.entries.length} entries
        </span>
        {displayedEntries.length !== buffer.entries.length && (
          <span className="log-viewer__stat">
            Filtered: {displayedEntries.length} entries
          </span>
        )}
        {buffer.stats.evicted > 0 && (
          <span className="log-viewer__stat">
            Evicted: {buffer.stats.evicted} entries
          </span>
        )}
        <span className="log-viewer__stat">
          Capacity: {buffer.stats.capacity}
        </span>
      </div>

      <VirtualizedLogList
        entries={displayedEntries}
        height={400} // Fallback height, will use actual container height via ResizeObserver
        rowHeight={40}
        autoScroll={autoScroll}
        highlightQuery={search.query}
      />
    </div>
  );
};

export default LogViewer;
