import { useState, useEffect, useRef, useCallback } from 'react';
import type { LogEntry } from '../../firehose/types';
import { firehose } from '../../firehose/source';
import type { ConnectionManagerReturn, ConnectionStatus } from '../types';

/**
 * Custom hook for managing firehose connection lifecycle
 * 
 * Handles:
 * - Connection/disconnection lifecycle
 * - Event listener registration and cleanup
 * - React StrictMode double-mount compatibility
 * - Auto-reconnect logic for unexpected drops
 * - Forwarding entries to buffer via callback
 * 
 * @param onEntry - Callback to forward entries to the buffer layer
 * @param autoReconnect - Whether to automatically reconnect on unexpected drops
 * @returns Connection manager interface with status and control methods
 */
export function useConnectionManager(
  onEntry: (entry: LogEntry) => void,
  autoReconnect: boolean = true
): ConnectionManagerReturn {
  const [status, setStatus] = useState<ConnectionStatus>('closed');
  const [error, setError] = useState<Error | null>(null);

  // Track if disconnect was intentional to control auto-reconnect
  const intentDisconnectRef = useRef(false);
  
  // Track reconnection attempts for exponential backoff
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  // Store cleanup function to properly handle listener unsubscription
  const cleanupRef = useRef<(() => void) | null>(null);

  // Connect function - registers listeners BEFORE calling connect()
  const connect = useCallback(() => {
    // Clean up any existing listeners first
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Mark this as an intentional action (not a disconnect)
    intentDisconnectRef.current = false;
    setError(null);

    // Register 'entry' listener
    const unsubEntry = firehose.on('entry', (entry: LogEntry) => {
      onEntry(entry);
    });

    // Register 'open' listener
    const unsubOpen = firehose.on('open', () => {
      setStatus('open');
      // Reset reconnect attempt counter on successful connection
      reconnectAttemptRef.current = 0;
    });

    // Register 'close' listener
    const unsubClose = firehose.on('close', () => {
      setStatus('closed');

      // Check if this was an unexpected drop
      if (!intentDisconnectRef.current && autoReconnect) {
        // Calculate exponential backoff delay (1s, 2s, 4s, 8s, max 10s)
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 10000);
        reconnectAttemptRef.current += 1;

        // Schedule reconnection
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectTimeoutRef.current = null;
          // Re-establish connection (this will re-register listeners)
          connect();
        }, delay);
      }
    });

    // Now call connect() - replay tail will be delivered synchronously to 'entry' listeners
    firehose.connect();

    // Store cleanup function
    cleanupRef.current = () => {
      unsubEntry();
      unsubOpen();
      unsubClose();
      
      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [onEntry, autoReconnect]);

  // Disconnect function - marks disconnect as intentional
  const disconnect = useCallback(() => {
    // Mark this as intentional disconnect to prevent auto-reconnect
    intentDisconnectRef.current = true;
    
    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Reset reconnect attempt counter
    reconnectAttemptRef.current = 0;
    
    // Disconnect from firehose (this will trigger 'close' event synchronously to listeners)
    firehose.disconnect();
    
    // Ensure status is updated (defensive - the 'close' listener should have done this)
    setStatus('closed');
    
    // Then clean up listeners after disconnect has completed
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  }, []);

  // Connection lifecycle effect
  useEffect(() => {
    // Cleanup function runs on unmount
    return () => {
      // Disconnect on unmount
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    connect,
    disconnect,
    error,
  };
}
