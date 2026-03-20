import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://api.cuartoya.com/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Error reading auth token:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('auth_user');
      } catch (err) {
        console.warn('Error clearing auth data:', err);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  register: (data) =>
    api.post('/auth/register', data),
  me: () =>
    api.get('/auth/me'),
  updateProfile: (data) =>
    api.put('/auth/profile', data),
  uploadAvatar: (formData) =>
    api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  registerPushToken: (pushToken) =>
    api.post('/auth/push-token', { pushToken }),
};

export const listingsAPI = {
  getFeed: (params) =>
    api.get('/listings/feed', { params }),
  getById: (id) =>
    api.get(`/listings/${id}`),
  create: (data) =>
    api.post('/listings', data),
  update: (id, data) =>
    api.put(`/listings/${id}`, data),
  delete: (id) =>
    api.delete(`/listings/${id}`),
  getMine: () =>
    api.get('/listings/mine'),
  uploadPhotos: (id, formData) =>
    api.post(`/listings/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  boost: (id) =>
    api.post(`/listings/${id}/boost`),
};

export const matchesAPI = {
  like: (listingId) =>
    api.post(`/matches/like/${listingId}`),
  pass: (listingId) =>
    api.post(`/matches/pass/${listingId}`),
  superLike: (listingId) =>
    api.post(`/matches/super-like/${listingId}`),
  getMatches: () =>
    api.get('/matches'),
  getMessages: (matchId, params) =>
    api.get(`/matches/${matchId}/messages`, { params }),
  sendMessage: (matchId, text) =>
    api.post(`/matches/${matchId}/messages`, { text }),
};

export const subscriptionsAPI = {
  getPlans: () =>
    api.get('/subscriptions/plans'),
  subscribe: (planId) =>
    api.post('/subscriptions/subscribe', { planId }),
  cancel: () =>
    api.post('/subscriptions/cancel'),
  getCurrent: () =>
    api.get('/subscriptions/current'),
};

export const verificationAPI = {
  verifyDni: (dni) =>
    api.post('/verification/dni', { dni }),
  getStatus: () =>
    api.get('/verification/status'),
};

export const favoritesAPI = {
  add: (listingId) =>
    api.post(`/favorites/${listingId}`),
  remove: (listingId) =>
    api.delete(`/favorites/${listingId}`),
  list: () =>
    api.get('/favorites'),
};

export const reportsAPI = {
  create: (data) =>
    api.post('/reports', data),
};

export default api;
