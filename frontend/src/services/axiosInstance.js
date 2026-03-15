  import axios from "axios";

  const API_BASE_URL = "http://localhost:5000";

  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
  });

  // ✅ Request: token qo‘shish
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  // ✅ Response: 401 bo‘lsa tokenni o‘chirish (ixtiyoriy, lekin foydali)
  axiosInstance.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
      }
      return Promise.reject(error);
    }
  );

  export default axiosInstance;
