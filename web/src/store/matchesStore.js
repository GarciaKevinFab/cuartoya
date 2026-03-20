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
      const matchesList = data.matches || data || [];
      const unread = matchesList.filter((m) => m.unread).length;
      set({ matches: matchesList, unreadCount: unread, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setActiveMatch: (matchId) => {
    set({ activeMatchId: matchId, messages: [] });
    if (matchId) {
      get().fetchMessages(matchId);
      get().markAsRead(matchId);
    }
  },

  fetchMessages: async (matchId) => {
    set({ isLoadingMessages: true });
    try {
      const { data } = await matchesAPI.messages(matchId);
      set({ messages: data.messages || data || [], isLoadingMessages: false });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (text) => {
    const { activeMatchId, messages } = get();
    if (!activeMatchId || !text.trim()) return;

    const tempMsg = {
      _id: `temp-${Date.now()}`,
      text: text.trim(),
      sender: 'me',
      createdAt: new Date().toISOString(),
      pending: true,
    };

    set({ messages: [...messages, tempMsg] });

    try {
      const { data } = await matchesAPI.sendMessage(activeMatchId, { text: text.trim() });
      set({
        messages: get().messages.map((m) =>
          m._id === tempMsg._id ? { ...data, pending: false } : m
        ),
      });
    } catch {
      set({
        messages: get().messages.map((m) =>
          m._id === tempMsg._id ? { ...m, failed: true, pending: false } : m
        ),
      });
    }
  },

  markAsRead: async (matchId) => {
    try {
      await matchesAPI.markRead(matchId);
      set({
        matches: get().matches.map((m) =>
          m._id === matchId ? { ...m, unread: false } : m
        ),
        unreadCount: Math.max(0, get().unreadCount - 1),
      });
    } catch {
      /* silently fail */
    }
  },

  addMessage: (message) => {
    const { activeMatchId, messages } = get();
    if (message.matchId === activeMatchId) {
      set({ messages: [...messages, message] });
    }
    set({
      matches: get().matches.map((m) =>
        m._id === message.matchId
          ? { ...m, lastMessage: message, unread: message.matchId !== activeMatchId }
          : m
      ),
      unreadCount: message.matchId !== activeMatchId
        ? get().unreadCount + 1
        : get().unreadCount,
    });
  },
}));
