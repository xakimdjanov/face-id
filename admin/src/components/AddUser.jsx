import React, { useEffect, useState, useRef, useCallback } from 'react';
import { FiUserPlus, FiCamera, FiCheckCircle, FiXCircle, FiWifi, FiWifiOff } from 'react-icons/fi';
import { BsFillCameraVideoFill } from 'react-icons/bs';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

const API = "http://localhost:2000";
const WS_URL = "ws://localhost:2000/ws/enroll";

// Axios instance
const api = axios.create({
  baseURL: API,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// API functions
const deviceApi = {
  ping: () => api.get('/api/device/ping')
};

const enrollApi = {
  start: (data) => api.post('/api/enroll/start', data),
  preview: () => `${API}/api/enroll/preview.jpg`,
  captureFace: (employeeNo) => api.post(`/api/enroll/capture-face?employeeNo=${employeeNo}`),
  confirm: (data) => api.post('/api/enroll/confirm', data),
  cancel: () => api.post('/api/enroll/cancel')
};

export default function AddUser() {
  const [step, setStep] = useState(1); // 1: form, 2: enroll, 3: success
  const [loading, setLoading] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState("offline");
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [previewTick, setPreviewTick] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    employeeNo: "",
    cardNo: "",
    phone: "",
    department: "",
  });
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [enrollStarted, setEnrollStarted] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const previewTimerRef = useRef(null);

  const canStartEnroll = formData.name.trim().length > 0 && formData.employeeNo.trim().length > 0;
  const canCaptureFace = enrollStarted;
  const canConfirm = (formData.cardNo.trim().length > 0 || faceCaptured);

  // WebSocket ulanish
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setWsStatus("connected");
      return;
    }

    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }

    try {
      setWsStatus("connecting");
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setWsStatus("timeout");
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * reconnectAttempts.current, 10000);
          reconnectTimerRef.current = setTimeout(connectWebSocket, delay);
        }
      }, 5000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        setWsStatus("connected");
        reconnectAttempts.current = 0;
        toast.success('Qurilmaga ulandi', { id: 'ws-success', duration: 2000 });
      };

      ws.onclose = () => {
        clearTimeout(connectionTimeout);
        setWsStatus("disconnected");
        reconnectAttempts.current += 1;
        const delay = Math.min(1000 * reconnectAttempts.current, 10000);
        reconnectTimerRef.current = setTimeout(connectWebSocket, delay);
      };

      ws.onerror = () => {
        setWsStatus("error");
        toast.error('Qurilma bilan aloqa uzildi', { id: 'ws-error' });
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "CARD" && msg.cardNo) {
            setFormData(prev => ({ ...prev, cardNo: String(msg.cardNo) }));
            toast.success('Karta o\'qildi!', { duration: 2000 });
          }
        } catch (err) {
          console.error("WS xatosi:", err);
        }
      };
    } catch (err) {
      setWsStatus("error");
    }
  }, []);

  useEffect(() => {
    connectWebSocket();
    pingDevice();
    
    const interval = setInterval(pingDevice, 10000);
    
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      clearInterval(interval);
    };
  }, [connectWebSocket]);

  useEffect(() => {
    if (enrollStarted) {
      previewTimerRef.current = setInterval(() => {
        setPreviewTick(x => x + 1);
      }, 700);
    }
    return () => {
      if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    };
  }, [enrollStarted]);

  async function pingDevice() {
    try {
      const res = await deviceApi.ping();
      setDeviceStatus(res.data.success ? "online" : "offline");
    } catch {
      setDeviceStatus("offline");
    }
  }

  function resetForm() {
    setFormData({ name: "", employeeNo: "", cardNo: "", phone: "", department: "" });
    setFaceCaptured(false);
    setEnrollStarted(false);
    setStep(1);
  }

  async function handleStartEnroll() {
    if (!canStartEnroll) {
      toast.error('Ism va EmployeeNo majburiy');
      return;
    }

    setLoading(true);
    try {
      const res = await enrollApi.start({
        name: formData.name.trim(),
        employeeNo: formData.employeeNo.trim(),
        phone: formData.phone?.trim() || undefined,
        department: formData.department?.trim() || undefined,
      });

      if (res.data.success) {
        setEnrollStarted(true);
        setStep(2);
        toast.success('Enroll boshlandi. Xodim qurilmaga qarasin yoki kartani tekkizsin.', { duration: 3000 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Start xatosi');
    } finally {
      setLoading(false);
    }
  }

  async function handleCaptureFace() {
    if (!enrollStarted) {
      toast.error('Avval Start Enroll tugmasini bosing');
      return;
    }

    setLoading(true);
    try {
      const res = await enrollApi.captureFace(formData.employeeNo);
      
      if (res.data.success) {
        setFaceCaptured(true);
        toast.success('Yuz rasmi muvaffaqiyatli olindi', { duration: 3000 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Yuzni olishda xatolik');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!canConfirm) {
      toast.error('Karta yoki yuz rasmi kerak');
      return;
    }

    setLoading(true);
    try {
      const res = await enrollApi.confirm({
        employeeNo: formData.employeeNo.trim(),
        name: formData.name.trim(),
        cardNo: formData.cardNo.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        department: formData.department.trim() || undefined,
      });

      if (res.data.success) {
        setStep(3);
        toast.success('Xodim muvaffaqiyatli qo\'shildi!', { duration: 3000 });
        setTimeout(resetForm, 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Confirm xatosi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">👤 Yangi xodim qo'shish</h1>
              <p className="text-sm text-gray-500 mt-1">
                {step === 1 && "Ma'lumotlarni to'ldiring"}
                {step === 2 && "Xodim qurilmaga qarasin va kartani tekkizsin"}
                {step === 3 && "Xodim muvaffaqiyatli qo'shildi!"}
              </p>
            </div>
            
            {/* Statuslar */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                deviceStatus === 'online' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {deviceStatus === 'online' ? <FiWifi className="w-4 h-4" /> : <FiWifiOff className="w-4 h-4" />}
                <span className="font-medium">Qurilma {deviceStatus === 'online' ? 'Online' : 'Offline'}</span>
              </div>
              
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                wsStatus === 'connected' ? 'bg-green-50 text-green-600' : 
                wsStatus === 'connecting' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  wsStatus === 'connected' ? 'bg-green-500' : 
                  wsStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span>
                  {wsStatus === 'connected' ? 'Ulangan' : 
                   wsStatus === 'connecting' ? 'Ulanmoqda...' : 'Uzilgan'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Form */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Chap taraf - Forma */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ism <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ali Valiyev"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employeeNo}
                    onChange={(e) => setFormData({ ...formData, employeeNo: e.target.value })}
                    placeholder="1001"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Karta raqami
                  </label>
                  <input
                    type="text"
                    value={formData.cardNo}
                    onChange={(e) => setFormData({ ...formData, cardNo: e.target.value })}
                    placeholder="Kartani tekkizganda avtomatik tushadi"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-green-50"
                    readOnly
                  />
                  {wsStatus === 'connected' && (
                    <p className="text-xs text-green-600 mt-1">🟢 Kartani tekkizishingiz mumkin</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bo'lim
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="IT, HR, Marketing"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                </div>

                <button
                  onClick={handleStartEnroll}
                  disabled={!canStartEnroll || loading}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? '⏳' : <FiUserPlus className="w-5 h-5" />}
                  {loading ? 'Yuborilmoqda...' : 'Start Enroll'}
                </button>
              </div>

              {/* O'ng taraf - Preview */}
              <div className="bg-gray-900 rounded-2xl overflow-hidden h-[400px] relative">
                {deviceStatus === 'online' ? (
                  <img
                    src={`${enrollApi.preview()}?t=${previewTick}`}
                    alt="Device preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100%25" height="100%25"%3E%3Crect width="100%25" height="100%25" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" fill="%23666" text-anchor="middle" dy=".3em"%3EPreview yo\'q%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <p className="text-gray-400">Qurilma offline</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Enroll */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Chap taraf - Status */}
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="font-medium text-blue-800 mb-2">Ma'lumotlar</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Ism:</span> <span className="font-medium">{formData.name}</span></p>
                    <p><span className="text-gray-600">Employee No:</span> <span className="font-medium">{formData.employeeNo}</span></p>
                    <p><span className="text-gray-600">Karta:</span> <span className="font-medium">{formData.cardNo || '✗'}</span></p>
                    <p><span className="text-gray-600">Yuz:</span> <span className="font-medium">{faceCaptured ? '✅' : '✗'}</span></p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleCaptureFace}
                    disabled={!canCaptureFace || loading || faceCaptured}
                    className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                      faceCaptured 
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    <FiCamera className="w-5 h-5" />
                    {faceCaptured ? 'Yuz olindi ✓' : 'Capture Face'}
                  </button>

                  <button
                    onClick={handleConfirm}
                    disabled={!canConfirm || loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? '⏳' : <FiCheckCircle className="w-5 h-5" />}
                    {loading ? 'Yuborilmoqda...' : 'Confirm + Add'}
                  </button>

                  <button
                    onClick={() => setStep(1)}
                    className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors"
                  >
                    Orqaga
                  </button>
                </div>
              </div>

              {/* O'ng taraf - Preview */}
              <div className="bg-gray-900 rounded-2xl overflow-hidden h-[400px] relative">
                <img
                  src={`${enrollApi.preview()}?t=${previewTick}`}
                  alt="Device preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100%25" height="100%25"%3E%3Crect width="100%25" height="100%25" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" fill="%23666" text-anchor="middle" dy=".3em"%3EPreview yo\'q%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Xodim qo'shildi!</h2>
            <p className="text-gray-500 mb-6">{formData.name} muvaffaqiyatli qo'shildi</p>
            <button
              onClick={resetForm}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-xl transition-colors"
            >
              Yana xodim qo'shish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}