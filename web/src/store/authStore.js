import { create } from 'zustand';
import { authAPI } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  loadFromStorage: () => {
    const token = localStorage.getItem('cuartoya_token');
    const userStr = localStorage.getItem('cuartoya_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('cuartoya_token');
        localStorage.removeItem('cuartoya_user');
      }
    }
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.login(credentials);
      const token = data.access_token || data.token;
      const user = data.user;
      localStorage.setItem('cuartoya_token', token);
      localStorage.setItem('cuartoya_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al iniciar sesion',
      };
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.register(userData);
      const token = data.access_token || data.token;
      const user = data.user;
      localStorage.setItem('cuartoya_token', token);
      localStorage.setItem('cuartoya_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al registrarse',
      };
    }
  },

  logout: () => {
    localStorage.removeItem('cuartoya_token');
    localStorage.removeItem('cuartoya_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateUser: (updates) => {
    const currentUser = get().user;
    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem('cuartoya_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  fetchMe: async () => {
    try {
      const { data } = await authAPI.me();
      localStorage.setItem('cuartoya_user', JSON.stringify(data));
      set({ user: data });
    } catch {
      get().logout();
    }
  },
}));
