import { memo } from 'react';
import type { LogEntryRowProps } from '../types';
import { highlightMatches } from '../utils/search';
import './LogEntryRow.css';

/**
 * Display component for a single log entry row.
 * 
 * Displays timestamp (formatted), level badge, service, and message.
 * Color-codes level badges and applies search highlighting to message text.
 * Uses React.memo to prevent unnecessary re-renders.
 * 
 */
const LogEntryRow = memo<LogEntryRowProps>(({ entry, highlightQuery }) => {
  const { timestamp, level, service, message } = entry;

  // Format timestamp as readable date/time string
  const formattedTime = new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Get level badge color class
  const levelColorClass = `log-entry-row__level--${level}`;

  // Get highlighted segments if query is provided
  const messageSegments = highlightQuery
    ? highlightMatches(message, highlightQuery)
    : [{ text: message, isMatch: false }];

  return (
    <div className="log-entry-row">
      <div className="log-entry-row__timestamp">{formattedTime}</div>
      <div className={`log-entry-row__level ${levelColorClass}`}>
        {level.toUpperCase()}
      </div>
      <div className="log-entry-row__service">{service}</div>
      <div className="log-entry-row__message">
        {messageSegments.map((segment, index) => (
          segment.isMatch ? (
            <mark key={index} className="log-entry-row__highlight">
              {segment.text}
            </mark>
          ) : (
            <span key={index}>{segment.text}</span>
          )
        ))}
      </div>
    </div>
  );
});

LogEntryRow.displayName = 'LogEntryRow';

export default LogEntryRow;
