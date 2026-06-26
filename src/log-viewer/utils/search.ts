import type { LogEntry } from '../../firehose/types';

/**
 * Text segment for highlighting search matches
 */
export interface TextSegment {
  text: string;
  isMatch: boolean;
}

/**
 * Filter entries by case-insensitive message search.
 * Search scope is limited to the message field only (not context).
 * Empty query is treated as "no filter" (returns all entries).
 * 
 * @param entries - Array of log entries to filter
 * @param query - Search query string
 * @returns Filtered array of entries whose message contains the query
 */
export function searchEntries(entries: LogEntry[], query: string): LogEntry[] {
  // Handle empty query as "no filter"
  if (!query || query.trim() === '') {
    return entries;
  }

  const normalizedQuery = query.toLowerCase();

  return entries.filter((entry) => 
    entry.message.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Split message text into segments with match indicators for highlighting.
 * All occurrences of the query string are marked as matches.
 * 
 * @param message - The message text to process
 * @param query - Search query string
 * @returns Array of text segments with match indicators
 */
export function highlightMatches(message: string, query: string): TextSegment[] {
  // Handle empty query - return entire message as non-match
  if (!query || query.trim() === '') {
    return [{ text: message, isMatch: false }];
  }

  const segments: TextSegment[] = [];
  const normalizedQuery = query.toLowerCase();
  const normalizedMessage = message.toLowerCase();
  
  let currentIndex = 0;
  let matchIndex = normalizedMessage.indexOf(normalizedQuery, currentIndex);

  // No matches found - return entire message as non-match
  if (matchIndex === -1) {
    return [{ text: message, isMatch: false }];
  }

  // Process all matches
  while (matchIndex !== -1) {
    // Add non-match segment before the match (if any)
    if (matchIndex > currentIndex) {
      segments.push({
        text: message.substring(currentIndex, matchIndex),
        isMatch: false,
      });
    }

    // Add match segment (preserve original case from message)
    segments.push({
      text: message.substring(matchIndex, matchIndex + query.length),
      isMatch: true,
    });

    currentIndex = matchIndex + query.length;
    matchIndex = normalizedMessage.indexOf(normalizedQuery, currentIndex);
  }

  // Add remaining non-match segment (if any)
  if (currentIndex < message.length) {
    segments.push({
      text: message.substring(currentIndex),
      isMatch: false,
    });
  }

  return segments;
}
