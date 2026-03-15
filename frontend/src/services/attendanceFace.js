import axios from './api';

/**
 * ATTENDANCE FACE (Yuz orqali davomat) service
 * Hikvision qurilmadan kelgan face recognition ma'lumotlari
 */

export const attendanceFaceService = {
  // Barcha attendance loglarni olish
  getAll: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axios.get(`/api/attendance-face${queryParams ? `?${queryParams}` : ''}`);
  },

  // Bugungi attendance loglarni olish
  getToday: () => axios.get("/api/attendance-face/today"),

  // Attendance log ni ID bo'yicha olish
  getById: (id) => axios.get(`/api/attendance-face/${id}`),

  // Xodimning attendance loglarini olish
  getByEmployee: (employeeNo, params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axios.get(`/api/attendance-face/employee/${employeeNo}${queryParams ? `?${queryParams}` : ''}`);
  },

  // Attendance statistikasini olish
  getStats: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axios.get(`/api/attendance-face/stats${queryParams ? `?${queryParams}` : ''}`);
  },

  // Yangi attendance log yaratish (manual)
  create: (data) => axios.post("/api/attendance-face", data),

  // Test attendance log yaratish (diagnostika uchun)
  testCreate: (data) => axios.post("/api/attendance-face/test", data),

  // Attendance log ni yangilash
  update: (id, data) => axios.put(`/api/attendance-face/${id}`, data),

  // Attendance log ni o'chirish
  delete: (id) => axios.delete(`/api/attendance-face/${id}`),

  // Bir nechta attendance loglarni ommaviy o'chirish
  bulkDelete: (ids) => axios.post("/api/attendance-face/bulk-delete", { ids }),

  // Attendance loglarni export qilish (CSV)
  export: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axios.get(`/api/attendance-face/export${queryParams ? `?${queryParams}` : ''}`, {
      responseType: 'blob'
    });
  },

  // Verify mode bo'yicha statistika
  getVerifyModeStats: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axios.get(`/api/attendance-face/stats/verify-mode${queryParams ? `?${queryParams}` : ''}`);
  },

  // Kunlik statistika
  getDailyStats: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axios.get(`/api/attendance-face/stats/daily${queryParams ? `?${queryParams}` : ''}`);
  },

  // Top xodimlar statistikasi
  getTopEmployees: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axios.get(`/api/attendance-face/stats/top-employees${queryParams ? `?${queryParams}` : ''}`);
  },

  // Xodimning oxirgi attendance logini olish
  getLastByEmployee: (employeeNo) => 
    axios.get(`/api/attendance-face/employee/${employeeNo}/last`),

  // WebSocket orqali real-time ulanish
  connectWebSocket: (onMessage, onError, onClose) => {
    const ws = new WebSocket('ws://localhost:5000/ws/enroll');
    
    ws.onopen = () => console.log('🔌 WebSocket connected');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (e) {
        console.error('WebSocket message parse error:', e);
      }
    };
    ws.onerror = onError;
    ws.onclose = onClose;
    
    return ws;
  },

  // Real-time yangilanishlarga obuna bo'lish
  subscribeToRealtime: (callback) => {
    return attendanceFaceService.connectWebSocket(
      (data) => {
        if (data.type === 'FACE_ATTENDANCE' || data.type === 'CARD') {
          callback(data);
        }
      },
      (error) => console.error('Realtime subscription error:', error)
    );
  }
};