import { create } from 'zustand';
import { matchesAPI } from '../services/api';

export const useMatchesStore = create((set, get) => ({
  matches: [],
  activeMatchId: null,
  messages: [],
  unreadCount: 0,
  isLoading: false,
  isLoadingMessages: false,

  fetchMatches: async () => {
    set({ isLoading: true });
    try {
      const { data } = await matchesAPI.list();
      // Backend retorna un array directamente (List[MatchResponse])
      const matchesList = Array.isArray(data) ? data : (data.matches || []);
      // Backend retorna unread_count (numero), no unread (booleano)
      const unread = matchesList.reduce((sum, m) => sum + (m.unread_count || 0), 0);
      set({ matches: matchesList, unreadCount: unread, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setActiveMatch: (matchId) => {
    set({ activeMatchId: matchId, messages: [] });
    if (matchId) {
      get().fetchMessages(matchId);
    }
  },

  fetchMessages: async (matchId) => {
    set({ isLoadingMessages: true });
    try {
      const { data } = await matchesAPI.messages(matchId);
      // Backend retorna MessageList con { messages: [...], has_more: bool }
      set({ messages: data.messages || data || [], isLoadingMessages: false });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (text) => {
    const { activeMatchId, messages } = get();
    if (!activeMatchId || !text.trim()) return;

    const tempMsg = {
      id: `temp-${Date.now()}`,
      content: text.trim(),
      sender_id: 'me',
      created_at: new Date().toISOString(),
      pending: true,
    };

    set({ messages: [...messages, tempMsg] });

    try {
      // Backend MessageCreate espera { content: string }
      const { data } = await matchesAPI.sendMessage(activeMatchId, { content: text.trim() });
      set({
        messages: get().messages.map((m) =>
          m.id === tempMsg.id ? { ...data, pending: false } : m
        ),
      });
    } catch {
      set({
        messages: get().messages.map((m) =>
          m.id === tempMsg.id ? { ...m, failed: true, pending: false } : m
        ),
      });
    }
  },

  markAsRead: async (matchId, messageId) => {
    if (!messageId) return;
    try {
      // Backend espera PUT /matches/{matchId}/messages/{messageId}/read
      await matchesAPI.markRead(matchId, messageId);
      set({
        matches: get().matches.map((m) =>
          m.id === matchId ? { ...m, unread_count: 0 } : m
        ),
        unreadCount: Math.max(0, get().unreadCount - 1),
      });
    } catch {
      /* fallo silencioso */
    }
  },

  addMessage: (message) => {
    const { activeMatchId, messages } = get();
    // El WebSocket envia match_id, no matchId
    const msgMatchId = message.match_id || message.matchId;
    if (msgMatchId === activeMatchId) {
      set({ messages: [...messages, message] });
    }
    set({
      matches: get().matches.map((m) =>
        m.id === msgMatchId
          ? {
              ...m,
              last_message: message.content,
              last_message_at: message.created_at,
              unread_count: msgMatchId !== activeMatchId ? (m.unread_count || 0) + 1 : 0,
            }
          : m
      ),
      unreadCount: msgMatchId !== activeMatchId
        ? get().unreadCount + 1
        : get().unreadCount,
    });
  },
}));
