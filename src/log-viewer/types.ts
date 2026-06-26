import type { LogEntry } from '../firehose/types';

/**
 * Filter state for level and service filtering
 * Empty sets = no filter applied (show all)
 * Non-empty sets = show only entries matching the sets (AND logic)
 */
export interface FilterState {
  levels: Set<LogEntry['level']>;
  services: Set<string>;
}

/**
 * Search state for message text search
 */
export interface SearchState {
  query: string;
  caseSensitive: boolean;
}

/**
 * View state for display preferences
 */
export interface ViewState {
  autoScroll: boolean;
}

/**
 * Viewport state for virtualization calculations
 */
export interface ViewportState {
  scrollTop: number;           // Current scroll position
  viewportHeight: number;      // Visible area height
  rowHeight: number;          // Fixed height per entry
  overscan: number;           // Extra rows above/below viewport
  startIndex: number;         // First visible entry index
  endIndex: number;           // Last visible entry index
  totalHeight: number;        // Virtual scroll height
}

/**
 * Log viewer component props
 */
export interface LogViewerProps {
  className?: string;
  defaultCapacity?: number;
  autoConnect?: boolean;
}

/**
 * Entry buffer internal state
 */
export interface EntryBuffer {
  // Primary storage
  entriesById: Map<string, LogEntry>;    // O(1) dedup lookup
  orderedEntries: LogEntry[];            // Sorted by timestamp
  
  // Batching state
  pendingBatch: LogEntry[];              // Entries waiting for next RAF
  rafHandle: number | null;              // RAF callback ID
  
  // Capacity management
  capacity: number;                      // Max entries to retain
  evictedCount: number;                 // Total evicted entries
  
  // Metadata
  totalReceived: number;                // Total entries received (including dupes)
  duplicateCount: number;               // Total duplicates rejected
}

/**
 * Connection status
 */
export type ConnectionStatus = 'open' | 'closed';

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

/**
 * Connection manager return interface
 */
export interface ConnectionManagerReturn {
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  error: Error | null;
}

/**
 * Log buffer hook return interface
 */
export interface LogBufferReturn {
  entries: LogEntry[];
  addEntries: (entries: LogEntry[]) => void;
  clear: () => void;
  stats: { total: number; capacity: number; evicted: number };
}

/**
 * Virtualized log list component props
 */
export interface VirtualizedLogListProps {
  entries: LogEntry[];
  height: number;
  rowHeight: number;
  autoScroll: boolean;
  highlightQuery?: string;
}

/**
 * Log entry row component props
 */
export interface LogEntryRowProps {
  entry: LogEntry;
  highlightQuery?: string;
}

/**
 * Log viewer toolbar component props
 */
export interface LogViewerToolbarProps {
  status: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  search: SearchState;
  onSearchChange: (search: SearchState) => void;
  autoScroll: boolean;
  onAutoScrollChange: (enabled: boolean) => void;
  onClear: () => void;
}
