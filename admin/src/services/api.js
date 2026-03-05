// services/api.js
import axios from 'axios';

const API = "http://localhost:2000";

const api = axios.create({
  baseURL: API,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Device API
export const deviceApi = {
  ping: () => api.get('/api/device/ping'),
  status: () => api.get('/api/device/status'),
  info: () => api.get('/api/device/info'),
  test: () => api.get('/api/device/test'),
  config: (data) => api.post('/api/device/config', data)
};

// Attendance API
export const attendanceApi = {
  list: (name = 'main', limit = 100) => 
    api.get(`/api/attendance?name=${name}&limit=${limit}`),
  today: () => api.get('/api/attendance/today'),
  stats: (days = 7) => api.get(`/api/attendance/stats?days=${days}`),
  search: (q) => api.get(`/api/attendance/search?q=${encodeURIComponent(q)}`),
  byEmployee: (employeeNo) => api.get(`/api/attendance/employee/${employeeNo}`),
  byDate: (date) => api.get(`/api/attendance/date/${date}`),
  test: () => api.get('/api/attendance/test'),
  addTest: () => api.post('/api/attendance/add-test')
};

// Enroll API
export const enrollApi = {
  start: (data) => api.post('/api/enroll/start', data),
  preview: () => `${API}/api/enroll/preview.jpg`,
  captureFace: (employeeNo) => 
    api.post(`/api/enroll/capture-face?employeeNo=${employeeNo}`),
  confirm: (data) => api.post('/api/enroll/confirm', data),
  state: () => api.get('/api/enroll/state'),
  cancel: () => api.post('/api/enroll/cancel')
};

export default api;