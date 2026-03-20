import axios from 'axios';

// API URL dinamica: usa el mismo host desde donde se accede la web
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const host = window.location.hostname;
  return `http://${host}:8000/api/v1`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cuartoya_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Evitar redireccion en rutas publicas de auth
      const publicPaths = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
      const isPublic = publicPaths.some((p) => error.config?.url?.includes(p));
      if (!isPublic) {
        localStorage.removeItem('cuartoya_token');
        localStorage.removeItem('cuartoya_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/me/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const listingsAPI = {
  feed: (params) => api.get('/listings', { params }),
  getById: (id) => api.get(`/listings/${id}`),
  create: (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'photos') {
        value.forEach((photo) => formData.append('photos', photo));
      } else if (key === 'amenities' || key === 'rules') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    return api.post('/listings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
  myListings: () => api.get('/listings/my'),
  stats: () => api.get('/users/me/stats'),
};

export const swipesAPI = {
  swipe: (data) => api.post('/swipes', data),
  pending: () => api.get('/swipes/pending'),
  accept: (id) => api.post(`/swipes/${id}/accept`),
  reject: (id) => api.post(`/swipes/${id}/reject`),
  respond: (id, data) => api.post(`/swipes/${id}/${data.action || 'accept'}`),
};

export const matchesAPI = {
  list: () => api.get('/matches'),
  detail: (matchId) => api.get(`/matches/${matchId}`),
  messages: (matchId, params) => api.get(`/matches/${matchId}/messages`, { params }),
  sendMessage: (matchId, data) => api.post(`/matches/${matchId}/messages`, data),
  markRead: (matchId, messageId) => api.put(`/matches/${matchId}/messages/${messageId}/read`),
};

export const usersAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  block: (userId) => api.post(`/reports/users/${userId}/block`),
  unblock: (userId) => api.delete(`/reports/users/${userId}/block`),
  blockedList: () => api.get('/reports/users/me/blocked'),
};

export const paymentsAPI = {
  subscribe: (data) => api.post('/payments/subscribe', data),
  boost: (data) => api.post('/payments/boost', data),
  history: () => api.get('/payments/history'),
  cancel: () => api.post('/payments/cancel'),
};

export const verificationAPI = {
  verifyDni: (dni) => api.post('/verification/dni', { dni }),
  getStatus: () => api.get('/verification/status'),
};

export const favoritesAPI = {
  add: (listingId) => api.post(`/favorites/${listingId}`),
  remove: (listingId) => api.delete(`/favorites/${listingId}`),
  list: () => api.get('/favorites'),
};

export const reportsAPI = {
  create: (data) => api.post('/reports', data),
  myReports: () => api.get('/reports/my'),
};

export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  users: (params) => api.get('/admin/users', { params }),
  banUser: (id, data) => api.put(`/admin/users/${id}/ban`, data),
  reports: (params) => api.get('/admin/reports', { params }),
  resolveReport: (id, data) => api.put(`/admin/reports/${id}/resolve`, data),
  listings: (params) => api.get('/admin/listings', { params }),
  deleteListing: (id) => api.delete(`/admin/listings/${id}`),
  revenue: () => api.get('/admin/revenue'),
};

export default api;
