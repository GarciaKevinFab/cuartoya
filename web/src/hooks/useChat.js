import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMatchesStore } from '../store/matchesStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
const RECONNECT_DELAY_BASE = 1000;
const MAX_RECONNECT_DELAY = 30000;
const MAX_RETRIES = 10;

export function useChat() {
  const wsRef = useRef(null);
  const retriesRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const isConnectedRef = useRef(false);

  const { token, isAuthenticated } = useAuthStore();
  const { addMessage, activeMatchId } = useMatchesStore();

  const connect = useCallback(() => {
    if (!token || !isAuthenticated) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        isConnectedRef.current = true;
        retriesRef.current = 0;

        if (activeMatchId) {
          ws.send(JSON.stringify({
            type: 'join',
            matchId: activeMatchId,
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'message':
              addMessage(data.message);
              break;

            case 'typing':
              break;

            case 'read':
              break;

            case 'match':
              useMatchesStore.getState().fetchMatches();
              break;

            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;

            default:
              break;
          }
        } catch {
          /* ignore malformed messages */
        }
      };

      ws.onclose = (event) => {
        isConnectedRef.current = false;
        wsRef.current = null;

        if (!event.wasClean && retriesRef.current < MAX_RETRIES) {
          const delay = Math.min(
            RECONNECT_DELAY_BASE * Math.pow(2, retriesRef.current),
            MAX_RECONNECT_DELAY
          );
          retriesRef.current += 1;

          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      /* connection failed, will retry via onclose */
    }
  }, [token, isAuthenticated, addMessage, activeMatchId]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    isConnectedRef.current = false;
    retriesRef.current = 0;
  }, []);

  const sendTyping = useCallback((matchId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        matchId,
      }));
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  useEffect(() => {
    if (activeMatchId && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join',
        matchId: activeMatchId,
      }));
    }
  }, [activeMatchId]);

  return {
    isConnected: isConnectedRef.current,
    sendTyping,
  };
}
