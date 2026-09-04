import axios from 'axios';
import { User, PatientProfile, Reminder, GameItem, CognitiveProfile, DailyRecommendations } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT Bearer Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('cognivive_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional: Clear token if expired
      // localStorage.removeItem('cognivive_token');
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  }
};

// Games endpoints
export const gamesApi = {
  getAll: async (): Promise<{ success: boolean; games: GameItem[] }> => {
    const res = await apiClient.get('/games');
    return res.data;
  },
  getState: async (gameId: string) => {
    const res = await apiClient.get(`/games/${gameId}/state`);
    return res.data;
  },
  recordSession: async (sessionData: any) => {
    const res = await apiClient.post('/games/session', sessionData);
    return res.data;
  }
};

// Reminders endpoints
export const remindersApi = {
  getToday: async (): Promise<{ success: boolean; reminders: Reminder[] }> => {
    const res = await apiClient.get('/reminders/today');
    return res.data;
  },
  acknowledge: async (id: string, voiceConfirmed = false, notes = '') => {
    const res = await apiClient.post(`/reminders/${id}/acknowledge`, { voiceConfirmed, notes });
    return res.data;
  }
};

// Profile & Recommendations
export const profileApi = {
  getCognitive: async (): Promise<{ success: boolean; profile: CognitiveProfile; patientInfo: any }> => {
    const res = await apiClient.get('/profile/cognitive');
    return res.data;
  },
  getRecommendations: async (): Promise<{ success: boolean; recommendations: DailyRecommendations }> => {
    const res = await apiClient.get('/profile/recommendations');
    return res.data;
  }
};

// AI & Voice Proxy
export const aiApi = {
  parseVoice: async (text: string, language = 'en') => {
    const res = await apiClient.post('/ai/voice-parse', { text, language });
    return res.data;
  },
  triggerSos: async (notes = '') => {
    const res = await apiClient.post('/ai/sos-trigger', { notes });
    return res.data;
  }
};
