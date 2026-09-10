/**
 * useMiddlewareBridge — Real-time WebSocket connection to the Middleware Bridge Server
 * 
 * Connects to the TCP/ASTM/HL7 bridge server and receives:
 * - Analyzer connection/disconnection events
 * - Raw frame data (ASTM/HL7) as they arrive
 * - Parsed clinical results
 * - Middleware processing logs
 * 
 * Provides auto-reconnect with exponential backoff.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { MiddlewareMessageLog, TestResult } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────

export interface BridgeAnalyzerStatus {
  id: string;
  name: string;
  port: number;
  protocol: string;
  status: 'LISTENING' | 'OFFLINE' | 'CONNECTED';
  connectedSocket?: boolean;
}

export interface BridgeFrameEvent {
  analyzerId: string;
  analyzerName: string;
  frameType: string;
  direction: 'INBOUND' | 'OUTBOUND';
  rawPayload?: string;
  rawHex?: string;
  checksumValid?: boolean;
  checksumExpected?: string;
  checksumComputed?: string;
  frameNumber?: number;
  protocol: string;
  timestamp: string;
}

export interface BridgeResultEvent {
  analyzerId: string;
  analyzerName: string;
  protocol: string;
  barcode: string;
  patientName: string;
  matchedOrderCode: string | null;
  result: TestResult;
  parsedFrame: any;
  timestamp: string;
}

export interface BridgeStatus {
  analyzers: BridgeAnalyzerStatus[];
  connectedClients: number;
  uptime: number;
}

export type BridgeConnectionState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

interface BridgeMessage {
  type: string;
  data: any;
  timestamp: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────

const MAX_RECENT_FRAMES = 200;
const MAX_RECENT_RESULTS = 100;
const MAX_RECENT_LOGS = 200;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export function useMiddlewareBridge(enabled: boolean = true) {
  const [connectionState, setConnectionState] = useState<BridgeConnectionState>('DISCONNECTED');
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [analyzerStatuses, setAnalyzerStatuses] = useState<BridgeAnalyzerStatus[]>([]);
  const [recentFrames, setRecentFrames] = useState<BridgeFrameEvent[]>([]);
  const [recentResults, setRecentResults] = useState<BridgeResultEvent[]>([]);
  const [recentLogs, setRecentLogs] = useState<MiddlewareMessageLog[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const wsUrl = (import.meta as any).env?.VITE_MIDDLEWARE_WS_URL || 'ws://localhost:8765';

  // ── WebSocket Message Handler ──────────────────────────────────────────

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg: BridgeMessage = JSON.parse(event.data);

      switch (msg.type) {
        case 'bridge_status':
          setBridgeStatus(msg.data);
          setAnalyzerStatuses(msg.data.analyzers || []);
          break;

        case 'pong':
          // Heartbeat response — no action needed
          break;

        case 'analyzer_connected': {
          setAnalyzerStatuses(prev =>
            prev.map(a =>
              a.id === msg.data.analyzerId
                ? { ...a, status: 'CONNECTED' as const, connectedSocket: true }
                : a
            )
          );
          break;
        }

        case 'analyzer_disconnected': {
          setAnalyzerStatuses(prev =>
            prev.map(a =>
              a.id === msg.data.analyzerId
                ? { ...a, status: 'LISTENING' as const, connectedSocket: false }
                : a
            )
          );
          break;
        }

        case 'frame_received': {
          const frame: BridgeFrameEvent = {
            ...msg.data,
            timestamp: msg.timestamp
          };
          setRecentFrames(prev => [frame, ...prev].slice(0, MAX_RECENT_FRAMES));
          break;
        }

        case 'result_parsed': {
          const result: BridgeResultEvent = {
            ...msg.data,
            timestamp: msg.timestamp
          };
          setRecentResults(prev => [result, ...prev].slice(0, MAX_RECENT_RESULTS));
          break;
        }

        case 'middleware_log': {
          const logEntry: MiddlewareMessageLog = {
            id: `bridge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            tenantId: msg.data.tenantId || 'lab-san-jose',
            analyzerId: msg.data.analyzerId,
            analyzerName: msg.data.analyzerName,
            protocol: msg.data.protocol,
            direction: msg.data.direction || 'INBOUND',
            rawPayload: msg.data.rawPayload || '',
            hexDump: msg.data.rawHex,
            frameType: msg.data.frameType,
            checksumValid: msg.data.checksumValid,
            sampleBarcode: msg.data.sampleBarcode,
            patientName: msg.data.patientName,
            matchedOrderCode: msg.data.matchedOrderCode,
            autoValidated: msg.data.autoValidated || false,
            parsedData: msg.data.parsedData,
            status: msg.data.status || 'PROCESADO',
            errorMessage: msg.data.errorMessage,
            timestamp: msg.timestamp
          };
          setRecentLogs(prev => [logEntry, ...prev].slice(0, MAX_RECENT_LOGS));
          break;
        }

        case 'analyzer_error': {
          setLastError(`${msg.data.analyzerName}: ${msg.data.error}`);
          break;
        }
      }
    } catch (e) {
      console.error('[MiddlewareBridge] Error parsing message:', e);
    }
  }, []);

  // ── Connection Management ──────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!enabledRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setConnectionState('CONNECTING');
    setLastError(null);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[MiddlewareBridge] Conectado a', wsUrl);
        setConnectionState('CONNECTED');
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
        
        // Request initial status
        ws.send(JSON.stringify({ type: 'get_status' }));
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('[MiddlewareBridge] Error WebSocket:', error);
        setConnectionState('ERROR');
        setLastError('Error de conexión con el Middleware Bridge');
      };

      ws.onclose = (event) => {
        console.log(`[MiddlewareBridge] Desconectado (code: ${event.code})`);
        setConnectionState('DISCONNECTED');
        wsRef.current = null;

        // Auto-reconnect with exponential backoff
        if (enabledRef.current) {
          const delay = reconnectDelayRef.current;
          console.log(`[MiddlewareBridge] Reintentando en ${delay / 1000}s...`);
          reconnectTimerRef.current = setTimeout(() => {
            reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
            connect();
          }, delay);
        }
      };
    } catch (e) {
      console.error('[MiddlewareBridge] Error creando WebSocket:', e);
      setConnectionState('ERROR');
      setLastError(`No se pudo conectar: ${(e as Error).message}`);
    }
  }, [wsUrl, handleMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }
    setConnectionState('DISCONNECTED');
  }, []);

  // ── Commands to Bridge ──────────────────────────────────────────────

  const sendCommand = useCallback((type: string, data?: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    }
  }, []);

  const injectTestFrame = useCallback((analyzerId: string, rawFrame: string) => {
    sendCommand('inject_test_frame', { analyzerId, rawFrame });
  }, [sendCommand]);

  const requestStatus = useCallback(() => {
    sendCommand('get_status');
  }, [sendCommand]);

  // ── Heartbeat (ping every 30s) ──────────────────────────────────────

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [enabled]);

  // ── Lifecycle ───────────────────────────────────────────────────────

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    // Connection
    connectionState,
    isConnected: connectionState === 'CONNECTED',
    lastError,

    // Status
    bridgeStatus,
    analyzerStatuses,

    // Real-time data
    recentFrames,
    recentResults,
    recentLogs,

    // Actions
    connect,
    disconnect,
    injectTestFrame,
    requestStatus,

    // Clear buffers
    clearFrames: () => setRecentFrames([]),
    clearResults: () => setRecentResults([]),
    clearLogs: () => setRecentLogs([])
  };
}
