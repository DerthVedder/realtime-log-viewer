import { ChangeEvent, useState } from 'react';
import type { LogViewerToolbarProps, LogLevel, ConnectionStatus } from '../types';
import './LogViewerToolbar.css';

/**
 * Log levels.
 */
const levels: LogLevel[] = [
    'debug',
    'info',
    'warn',
    'error',
    'critical',
  ];

/**
 * Toolbar component for log viewer controls.
 * 
 * Features:
 * - Connect/disconnect buttons
 * - Level and service filtering
 * - Search input
 * - Auto-scroll toggle
 * - Clear buffer button
 * - Entry count display
 * 
 */
const LogViewerToolbar = ({
  status,
  onConnect,
  onDisconnect,
  filters,
  onFilterChange,
  search,
  onSearchChange,
  autoScroll,
  onAutoScrollChange,
  onClear,
}: LogViewerToolbarProps) => {
  const handleLevelToggle = (level: LogLevel): void => {
    const newLevels = new Set(filters.levels);
    if (newLevels.has(level)) {
      newLevels.delete(level);
    } else {
      newLevels.add(level);
    }
    onFilterChange({ ...filters, levels: newLevels });
  };

  const handleClearLevelFilters = (): void => {
    onFilterChange({ ...filters, levels: new Set() });
  };

  const handleServiceToggle = (service: string): void => {
    const newServices = new Set(filters.services);
    if (newServices.has(service)) {
      newServices.delete(service);
    } else {
      newServices.add(service);
    }
    onFilterChange({ ...filters, services: newServices });
  };

  const handleClearServiceFilters = (): void => {
    onFilterChange({ ...filters, services: new Set() });
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { target } = e;
    onSearchChange({ ...search, query: target.value });
  };

  const handleClearSearch = (): void => {
    onSearchChange({ ...search, query: '' });
  };

  // Available services (based on firehose generator)
  const availableServices = ['auth', 'api', 'pubsub', 'worker', 'cache', 'gateway'];

  return (
    <div className="log-viewer-toolbar">
      <div className="log-viewer-toolbar__section">
        <div className="log-viewer-toolbar__label">Connection</div>
        {status === 'closed' ? (
          <button className="log-viewer-toolbar__button" onClick={onConnect}>
            Connect
          </button>
        ) : (
          <button
            className="log-viewer-toolbar__button log-viewer-toolbar__button--disconnect"
            onClick={onDisconnect}
          >
            Disconnect
          </button>
        )}
        <span
          className={`log-viewer-toolbar__status log-viewer-toolbar__status--${status}`}
        >
          {status === 'open' ? '● Connected' : '○ Disconnected'}
        </span>
      </div>

      <div className="log-viewer-toolbar__separator" />

      <div className="log-viewer-toolbar__section">
        <div className="log-viewer-toolbar__label">Filter by Level</div>
        <div className="log-viewer-toolbar__filter-group">
          {levels.map((level) => (
            <button
              key={level}
              className={`log-viewer-toolbar__filter-button ${
                filters.levels.size === 0 || filters.levels.has(level)
                  ? `log-viewer-toolbar__filter-button--${level} log-viewer-toolbar__filter-button--active`
                  : 'log-viewer-toolbar__filter-button--inactive'
              }`}
              onClick={() => handleLevelToggle(level)}
            >
              {level.toUpperCase()}
            </button>
          ))}
          {filters.levels.size > 0 && (
            <button
              className="log-viewer-toolbar__button log-viewer-toolbar__button--small"
              onClick={handleClearLevelFilters}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="log-viewer-toolbar__separator" />

      <div className="log-viewer-toolbar__section">
        <div className="log-viewer-toolbar__label">Filter by Service</div>
        <div className="log-viewer-toolbar__filter-group">
          {availableServices.map((service) => (
            <button
              key={service}
              className={`log-viewer-toolbar__filter-button log-viewer-toolbar__filter-button--service ${
                filters.services.size === 0 || filters.services.has(service)
                  ? 'log-viewer-toolbar__filter-button--active'
                  : 'log-viewer-toolbar__filter-button--inactive'
              }`}
              onClick={() => handleServiceToggle(service)}
            >
              {service.toUpperCase()}
            </button>
          ))}
          {filters.services.size > 0 && (
            <button
              className="log-viewer-toolbar__button log-viewer-toolbar__button--small"
              onClick={handleClearServiceFilters}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="log-viewer-toolbar__separator" />

      <div className="log-viewer-toolbar__section">
        <div className="log-viewer-toolbar__label">Search</div>
        <div className="log-viewer-toolbar__search">
          <input
            type="text"
            className="log-viewer-toolbar__search-input"
            placeholder="Search messages..."
            value={search.query}
            onChange={handleSearchChange}
          />
          {search.query && (
            <button
              className="log-viewer-toolbar__search-clear"
              onClick={handleClearSearch}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="log-viewer-toolbar__separator" />

      <div className="log-viewer-toolbar__section">
        <label className="log-viewer-toolbar__checkbox">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => onAutoScrollChange(e.target.checked)}
          />
          <span>Auto-scroll</span>
        </label>
      </div>

      <div className="log-viewer-toolbar__separator" />

      <div className="log-viewer-toolbar__section">
        <button className="log-viewer-toolbar__button" onClick={onClear}>
          Clear Buffer
        </button>
      </div>
    </div>
  );
};

export default LogViewerToolbar;
