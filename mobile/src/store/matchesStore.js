import { create } from 'zustand';
import { matchesAPI } from '../services/api';

const useMatchesStore = create((set, get) => ({
  matches: [],
  currentChat: {
    matchId: null,
    messages: [],
    isLoading: false,
    hasMore: true,
  },
  isLoading: false,
  unreadCount: 0,

  fetchMatches: async () => {
    set({ isLoading: true });
    try {
      const response = await matchesAPI.getMatches();
      const matchesList = response.data.matches || response.data || [];

      const unread = matchesList.reduce(
        (count, match) => count + (match.unread || 0),
        0
      );

      set({ matches: matchesList, unreadCount: unread, isLoading: false });
    } catch (err) {
      console.warn('Error fetching matches:', err);
      set({ isLoading: false });
    }
  },

  addMatch: (match) => {
    set((state) => ({
      matches: [match, ...state.matches],
    }));
  },

  updateMatchLastMessage: (matchId, message) => {
    set((state) => ({
      matches: state.matches.map((m) =>
        m.id === matchId
          ? {
              ...m,
              lastMessage: message.text,
              lastMessageTime: message.timestamp,
              unread: m.id === state.currentChat.matchId ? 0 : (m.unread || 0) + 1,
            }
          : m
      ),
    }));
  },

  fetchMessages: async (matchId, reset = false) => {
    const { currentChat } = get();
    if (currentChat.isLoading) return;

    set({
      currentChat: {
        ...currentChat,
        matchId,
        isLoading: true,
        ...(reset ? { messages: [], hasMore: true } : {}),
      },
    });

    try {
      const messages = reset ? [] : currentChat.messages;
      const params = {
        offset: reset ? 0 : messages.length,
        limit: 30,
      };

      const response = await matchesAPI.getMessages(matchId, params);
      const newMessages = response.data.messages || response.data || [];

      set({
        currentChat: {
          matchId,
          messages: reset ? newMessages : [...messages, ...newMessages],
          isLoading: false,
          hasMore: newMessages.length === 30,
        },
      });

      set((state) => ({
        matches: state.matches.map((m) =>
          m.id === matchId ? { ...m, unread: 0 } : m
        ),
        unreadCount: state.matches.reduce(
          (count, m) => count + (m.id === matchId ? 0 : m.unread || 0),
          0
        ),
      }));
    } catch (err) {
      console.warn('Error fetching messages:', err);
      set((state) => ({
        currentChat: { ...state.currentChat, isLoading: false },
      }));
    }
  },

  sendMessage: async (matchId, text) => {
    const tempMessage = {
      id: `temp-${Date.now()}`,
      text,
      sender: 'me',
      timestamp: new Date().toISOString(),
      pending: true,
    };

    set((state) => ({
      currentChat: {
        ...state.currentChat,
        messages: [tempMessage, ...state.currentChat.messages],
      },
    }));

    try {
      const response = await matchesAPI.sendMessage(matchId, text);
      const sentMessage = response.data.message || response.data;

      set((state) => ({
        currentChat: {
          ...state.currentChat,
          messages: state.currentChat.messages.map((m) =>
            m.id === tempMessage.id ? { ...sentMessage, pending: false } : m
          ),
        },
      }));

      get().updateMatchLastMessage(matchId, sentMessage);
      return sentMessage;
    } catch (err) {
      set((state) => ({
        currentChat: {
          ...state.currentChat,
          messages: state.currentChat.messages.map((m) =>
            m.id === tempMessage.id ? { ...m, pending: false, failed: true } : m
          ),
        },
      }));
      throw err;
    }
  },

  receiveMessage: (matchId, message) => {
    const { currentChat } = get();

    if (currentChat.matchId === matchId) {
      set((state) => ({
        currentChat: {
          ...state.currentChat,
          messages: [message, ...state.currentChat.messages],
        },
      }));
    }

    get().updateMatchLastMessage(matchId, message);
  },

  clearChat: () => {
    set({
      currentChat: {
        matchId: null,
        messages: [],
        isLoading: false,
        hasMore: true,
      },
    });
  },
}));

export default useMatchesStore;
