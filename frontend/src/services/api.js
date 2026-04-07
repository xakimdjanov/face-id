import axios from 'axios';

const API_BASE_URL = "https://snubbier-cicatrisant-clara.ngrok-free.dev"; // 5000 portga o'zgartirildi

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420"
  },
});

// Request interceptor - token qo'shish
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - 401 xatolarni handle qilish
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      // Redirect to login page if needed
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// MANUAL ATTENDANCE (ORQALI DAVOMAT) - Removed since only Face-ID is used
/*
export const attendanceService = {
  register: (data) => axiosInstance.post("/api/attendance", data),
  getAll: () => axiosInstance.get("/api/attendance"),
  getGroupId: (groupId) =>
    axiosInstance.get(`/api/attendance/group/${groupId}`),
  getStudentId: (studentId) =>
    axiosInstance.get(`/api/attendance/${studentId}`),
  update: (id, data) => axiosInstance.put(`/api/attendance/${id}`, data),
  delete: (id) => axiosInstance.delete(`/api/attendance/${id}`),
};
*/

// BRANCH (FILIAL)
export const branchService = {
  register: (data) => axiosInstance.post("/api/branches", data),
  getAll: () => axiosInstance.get("/api/branches"),
  getById: (id) => axiosInstance.get(`/api/branches/${id}/users`),
  update: (id, data) => axiosInstance.put(`/api/branches/${id}`, data),
  assignManager: (id, data) =>
    axiosInstance.put(`/api/branches/${id}/assign-manager`, data),
  delete: (id) => axiosInstance.delete(`/api/branches/${id}`),
};

// COURSE (KURS)
export const courseService = {
  register: (data) => axiosInstance.post("/api/courses", data),
  getAll: () => axiosInstance.get("/api/courses"),
  update: (id, data) => axiosInstance.put(`/api/courses/${id}`, data),
  delete: (id) => axiosInstance.delete(`/api/courses/${id}`),
};

// GROUP (GURUH)
export const groupService = {
  create: (data) => axiosInstance.post("/api/groups", data),
  getAll: () => axiosInstance.get("/api/groups"),
  update: (id, data) =>
    axiosInstance.put(`/api/groups/${id}/assign-teacher`, data),
  updateData: (id, data) => axiosInstance.put(`/api/groups/${id}`, data),
  delete: (id) => axiosInstance.delete(`/api/groups/${id}`),
};


// STUDENT GROUP (STUDENT GURUHLARI)
export const studentGroupService = {
  create: (data) => axiosInstance.post("/api/student-groups", data),
  getAll: () => axiosInstance.get("/api/student-groups"), 
  getById: (groupId) => axiosInstance.get(`/api/student-groups/group/${groupId}`),
  getByStudent: (studentId) => axiosInstance.get(`/api/student-groups/student/${studentId}`),
  delete: (id) => axiosInstance.delete(`/api/student-groups/${id}`),
};

// USERS (FOYDALANUVCHILAR)
export const userService = {
  register: (data) => axiosInstance.post("/api/postUser", data),
  login: (credentials) => axiosInstance.post("/api/signin", credentials),
  getAll: () => axiosInstance.get("/api/getUsers"),
  getById: (id) => axiosInstance.get(`/api/getUserById/${id}`),
  update: (id, data) => axiosInstance.put(`/api/updateUser/${id}`, data),
  delete: (id) => axiosInstance.delete(`/api/deleteUser/${id}`),
};

// EMPLOYEE (XODIM) - ENROLL UCHUN
export const employeeService = {
  startEnroll: (data) => axiosInstance.post("/api/employee/start", data),
  getAll: () => axiosInstance.get("/api/employee"),
  preview: () => `${API_BASE_URL}/api/employee/preview.jpg`,
  captureFace: (employeeNo) =>
    axiosInstance.post(`/api/employee/capture-face?employeeNo=${employeeNo}`),
  uploadFace: (formData) =>
    axiosInstance.post("/api/employee/upload-face", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  confirm: (data) => axiosInstance.post("/api/employee/confirm", data),
  cancel: (employeeNo) =>
    axiosInstance.post("/api/employee/cancel", { employeeNo }),
  getState: (employeeNo) =>
    axiosInstance.get(`/api/employee/state?employeeNo=${employeeNo}`),
};

// DEVICE (QURILMA)
export const deviceService = {
  setConfig: (data) => axiosInstance.post("/api/device/config", data),
  ping: () => axiosInstance.get("/api/device/ping"),
  status: () => axiosInstance.get("/api/device/status"),
  info: () => axiosInstance.get("/api/device/info"),
  test: () => axiosInstance.get("/api/device/test"),
  restartStream: () => axiosInstance.post("/api/device/restart-stream"),
  testDevice: () => axiosInstance.get("/api/device/test-device"),
  clearLogs: () => axiosInstance.post("/api/clear-logs")
};

// ATTENDANCE FACE (YUZ ORQALI DAVOMAT)
export const attendanceFaceService = {
  // Barcha attendance loglarni olish
  getAll: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axiosInstance.get(`/api/attendance-face${queryParams ? `?${queryParams}` : ''}`);
  },

  // Talabaning o'z attendance loglarini olish
  getMyAttendance: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axiosInstance.get(`/api/attendance-face/my${queryParams ? `?${queryParams}` : ''}`);
  },

  // Bugungi attendance loglarni olish
  getToday: () => axiosInstance.get("/api/attendance-face/today"),

  // Attendance log ni ID bo'yicha olish
  getById: (id) => axiosInstance.get(`/api/attendance-face/${id}`),

  // Xodimning attendance loglarini olish
  getByEmployee: (employeeNo, params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axiosInstance.get(`/api/attendance-face/employee/${employeeNo}${queryParams ? `?${queryParams}` : ''}`);
  },

  // Attendance statistikasini olish
  getStats: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axiosInstance.get(`/api/attendance-face/stats${queryParams ? `?${queryParams}` : ''}`);
  },

  // Yangi attendance log yaratish (manual)
  create: (data) => axiosInstance.post("/api/attendance-face", data),

  // Test attendance log yaratish (diagnostika uchun)
  testCreate: (data) => axiosInstance.post("/api/attendance-face/test", data),

  // Attendance log ni yangilash
  update: (id, data) => axiosInstance.put(`/api/attendance-face/${id}`, data),

  // Attendance log ni o'chirish
  delete: (id) => axiosInstance.delete(`/api/attendance-face/${id}`),

  // Bir nechta attendance loglarni ommaviy o'chirish
  bulkDelete: (ids) => axiosInstance.post("/api/attendance-face/bulk-delete", { ids }),

  // Attendance loglarni export qilish (CSV)
  export: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axiosInstance.get(`/api/attendance-face/export${queryParams ? `?${queryParams}` : ''}`, {
      responseType: 'blob'
    });
  },

  // Verify mode bo'yicha statistika
  getVerifyModeStats: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axiosInstance.get(`/api/attendance-face/stats/verify-mode${queryParams ? `?${queryParams}` : ''}`);
  },

  // Kunlik statistika
  getDailyStats: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axiosInstance.get(`/api/attendance-face/stats/daily${queryParams ? `?${queryParams}` : ''}`);
  },

  // Top xodimlar statistikasi
  getTopEmployees: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axiosInstance.get(`/api/attendance-face/stats/top-employees${queryParams ? `?${queryParams}` : ''}`);
  },

  // Xodimning oxirgi attendance logini olish
  getLastByEmployee: (employeeNo) => 
    axiosInstance.get(`/api/attendance-face/employee/${employeeNo}/last`),

  // WebSocket orqali real-time ulanish
  connectWebSocket: (onMessage, onError, onClose) => {
    const wsURL = API_BASE_URL.replace("https://", "wss://").replace("http://", "ws://");
    const ws = new WebSocket(`${wsURL}/ws/enroll`);
    
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

// DEFAULT EXPORT
export default axiosInstance;