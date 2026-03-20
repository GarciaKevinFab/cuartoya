import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
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
      localStorage.removeItem('cuartoya_token');
      localStorage.removeItem('cuartoya_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const listingsAPI = {
  feed: (params) => api.get('/listings/feed', { params }),
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
  update: (id, data) => api.patch(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
  myListings: () => api.get('/listings/mine'),
  stats: () => api.get('/listings/stats'),
};

export const swipesAPI = {
  swipe: (data) => api.post('/swipes', data),
  pending: () => api.get('/swipes/pending'),
  respond: (id, data) => api.post(`/swipes/${id}/respond`, data),
};

export const matchesAPI = {
  list: () => api.get('/matches'),
  messages: (matchId, params) => api.get(`/matches/${matchId}/messages`, { params }),
  sendMessage: (matchId, data) => api.post(`/matches/${matchId}/messages`, data),
  markRead: (matchId) => api.patch(`/matches/${matchId}/read`),
};

export const usersAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  block: (userId) => api.post(`/users/${userId}/block`),
  unblock: (userId) => api.delete(`/users/${userId}/block`),
};

export const paymentsAPI = {
  plans: () => api.get('/payments/plans'),
  subscribe: (data) => api.post('/payments/subscribe', data),
  mySubscription: () => api.get('/payments/subscription'),
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
  users: (page) => api.get('/admin/users', { params: { page } }),
  banUser: (id, reason) => api.put(`/admin/users/${id}/ban`, { reason }),
  reports: () => api.get('/admin/reports'),
  resolveReport: (id, action) => api.put(`/admin/reports/${id}/resolve`, { action }),
};

export default api;
