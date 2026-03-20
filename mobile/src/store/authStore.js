import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  isLoading: false,

  loadToken: async () => {
    try {
      set({ isLoading: true });
      const token = await SecureStore.getItemAsync('auth_token');
      const userJson = await SecureStore.getItemAsync('auth_user');
      const user = userJson ? JSON.parse(userJson) : null;
      set({ token, user, isLoading: false });

      if (token) {
        try {
          const response = await authAPI.me();
          const freshUser = response.data.user || response.data;
          await SecureStore.setItemAsync('auth_user', JSON.stringify(freshUser));
          set({ user: freshUser });
        } catch (err) {
          if (err.response?.status === 401) {
            await SecureStore.deleteItemAsync('auth_token');
            await SecureStore.deleteItemAsync('auth_user');
            set({ token: null, user: null });
          }
        }
      }
    } catch (err) {
      console.warn('Error loading token:', err);
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;

      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('auth_user', JSON.stringify(user));

      set({ token, user, isLoading: false });
      return { token, user };
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.register(data);
      const { token, user } = response.data;

      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('auth_user', JSON.stringify(user));

      set({ token, user, isLoading: false });
      return { token, user };
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  updateUser: async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data.user || response.data;
      await SecureStore.setItemAsync('auth_user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return updatedUser;
    } catch (err) {
      throw err;
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_user');
    } catch (err) {
      console.warn('Error clearing auth data:', err);
    }
    set({ token: null, user: null });
  },
}));

export default useAuthStore;
