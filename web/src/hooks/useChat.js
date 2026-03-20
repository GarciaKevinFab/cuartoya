import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMatchesStore } from '../store/matchesStore';

const getWsBaseUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const host = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${host}:8000/ws`;
};
const WS_BASE_URL = getWsBaseUrl();
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
    if (!token || !isAuthenticated || !activeMatchId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // Backend WebSocket endpoint: /ws/chat/{match_id}?token=...
      const ws = new WebSocket(`${WS_BASE_URL}/chat/${activeMatchId}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        isConnectedRef.current = true;
        retriesRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'message':
              // Backend envia: { type, id, sender_id, sender_name, content, created_at }
              addMessage({
                id: data.id,
                match_id: activeMatchId,
                sender_id: data.sender_id,
                sender_name: data.sender_name,
                content: data.content,
                created_at: data.created_at,
              });
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
          /* ignorar mensajes malformados */
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
      /* fallo de conexion, se reintentara via onclose */
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

  const sendMessage = useCallback((content) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && content) {
      // Backend espera JSON con { content: string }
      wsRef.current.send(JSON.stringify({ content }));
    }
  }, []);

  const sendTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
      }));
    }
  }, []);

  // Conectar/desconectar cuando cambia el match activo
  useEffect(() => {
    if (isAuthenticated && token && activeMatchId) {
      disconnect();
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, activeMatchId, connect, disconnect]);

  return {
    isConnected: isConnectedRef.current,
    sendMessage,
    sendTyping,
  };
}
