import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  FiUserPlus, FiCamera, FiCheckCircle, FiClock, 
  FiCalendar, FiGlobe, FiWifi, FiWifiOff, FiArrowLeft, FiHash, FiSettings, FiX 
} from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

// Konfiguratsiya
const API_BASE = "http://localhost:2000";
const WS_URL = "ws://localhost:2000/ws/enroll";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

const DAYS_OF_WEEK = [
  { id: 1, name: 'Du' }, { id: 2, name: 'Se' }, { id: 3, name: 'Ch' },
  { id: 4, name: 'Pa' }, { id: 5, name: 'Ju' }, { id: 6, name: 'Sha' }, { id: 7, name: 'Ya' }
];

export default function AddUser() {
  // --- States ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal holati
  const [deviceStatus, setDeviceStatus] = useState("offline");
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [previewTick, setPreviewTick] = useState(0);
  const [faceCaptured, setFaceCaptured] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    employeeNo: "",
    cardNo: "",
    phone: "",
    department: "",
    workStartTime: "09:00",
    workEndTime: "18:00",
    workDays: [1, 2, 3, 4, 5],
    timezone: "Asia/Tashkent"
  });

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const previewTimerRef = useRef(null);

  // --- Functions ---
  const fetchAndSetNextId = async () => {
    try {
      const res = await api.get('/api/attendance?limit=1000'); 
      const rows = res.data.rows || [];
      let nextId = 1001;
      if (rows.length > 0) {
        const numbers = rows.map(r => parseInt(r.employeeNo)).filter(n => !isNaN(n));
        if (numbers.length > 0) nextId = Math.max(...numbers) + 1;
      }
      setFormData(prev => ({ ...prev, employeeNo: String(nextId) }));
    } catch (err) { console.error("ID generatsiya xatosi:", err); }
  };

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    try {
      setWsStatus("connecting");
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => setWsStatus("connected");
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "CARD" && data.cardNo) {
          setFormData(prev => ({ ...prev, cardNo: String(data.cardNo) }));
          toast.success(`Karta o'qildi: ${data.cardNo}`);
        }
      };
      ws.onclose = () => {
        setWsStatus("disconnected");
        reconnectTimerRef.current = setTimeout(connectWebSocket, 3000);
      };
    } catch (err) { setWsStatus("error"); }
  }, []);

  const checkDevice = async () => {
    try {
      const res = await api.get('/api/device/ping');
      setDeviceStatus(res.data.success ? "online" : "offline");
    } catch { setDeviceStatus("offline"); }
  };

  useEffect(() => {
    connectWebSocket();
    checkDevice();
    fetchAndSetNextId();
    const interval = setInterval(checkDevice, 10000);
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      clearInterval(interval);
    };
  }, [connectWebSocket]);

  useEffect(() => {
    if (step < 3) {
      previewTimerRef.current = setInterval(() => setPreviewTick(p => p + 1), 1000);
    } else {
      clearInterval(previewTimerRef.current);
    }
    return () => clearInterval(previewTimerRef.current);
  }, [step]);

  // --- Handlers ---
  const handleStartEnroll = async () => {
    if (!formData.name || !formData.employeeNo) return toast.error("Ism va ID majburiy!");
    setLoading(true);
    try {
      const res = await api.post('/api/enroll/start', { name: formData.name, employeeNo: formData.employeeNo });
      if (res.data.success) { setStep(2); toast.success("Biometrika boshlandi"); }
    } catch (err) { toast.error(err.response?.data?.message || "Xato"); }
    finally { setLoading(false); }
  };

  const handleCaptureFace = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/api/enroll/capture-face?employeeNo=${formData.employeeNo}`);
      if (res.data.success) { setFaceCaptured(true); toast.success("Yuz saqlandi"); }
    } catch { toast.error("Yuzni aniqlab bo'lmadi"); }
    finally { setLoading(false); }
  };

  const handleConfirm = async () => {
    if (!faceCaptured && !formData.cardNo) return toast.error("Karta yoki yuz bo'lishi shart!");
    setLoading(true);
    try {
      const res = await api.post('/api/enroll/confirm', formData);
      if (res.data.success) { setStep(3); toast.success("Xodim qo'shildi"); }
    } catch { toast.error("Saqlashda xato"); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setFormData({
      name: "", employeeNo: "", cardNo: "", phone: "", 
      department: "", workStartTime: "09:00", workEndTime: "18:00",
      workDays: [1, 2, 3, 4, 5], timezone: "Asia/Tashkent"
    });
    setStep(1);
    setFaceCaptured(false);
    fetchAndSetNextId();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <Toaster position="top-right" />

      {/* MODAL: Ish vaqti sozlamalari */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <FiClock className="text-blue-600"/> Ish vaqtini sozlash
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <FiX size={24}/>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">Boshlanishi</label>
                    <input 
                      type="time" 
                      value={formData.workStartTime} 
                      onChange={(e) => setFormData({...formData, workStartTime: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl text-xl font-black outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">Tugashi</label>
                    <input 
                      type="time" 
                      value={formData.workEndTime} 
                      onChange={(e) => setFormData({...formData, workEndTime: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl text-xl font-black outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                  <FiSettings className="text-blue-600 mt-1"/>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Belgilangan vaqtlar davomat hisobotida <b>qat'iy</b> asos sifatida qabul qilinadi.
                  </p>
                </div>

                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95"
                >
                  SAQLASH
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-100">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">👤 Yangi Xodim</h1>
            <p className="text-gray-500 font-medium">Biometrik ro'yxatga olish tizimi</p>
          </div>
          <div className="flex gap-3">
            <StatusBadge icon={deviceStatus === 'online' ? <FiWifi /> : <FiWifiOff />} label={`Device: ${deviceStatus}`} color={deviceStatus === 'online' ? 'green' : 'red'} />
            <StatusBadge icon={<div className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`} />} label={`Reader: ${wsStatus}`} color="gray" />
          </div>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-3 bg-white rounded-3xl shadow-xl p-8 border border-gray-100 space-y-8">
              <section>
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">Shaxsiy ma'lumotlar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="To'liq ismi *" value={formData.name} onChange={v => setFormData({...formData, name: v})} placeholder="Masalan: Ali Valiyev" />
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-2">
                        <FiHash className="text-blue-500"/> Xodim ID (Avto)
                    </label>
                    <input type="text" value={formData.employeeNo} onChange={(e) => setFormData({...formData, employeeNo: e.target.value})} className="w-full px-5 py-3.5 bg-blue-50 border-2 border-blue-100 rounded-2xl font-bold text-blue-700 outline-none" />
                  </div>
                  <InputField label="Telefon" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} placeholder="+998 90..." />
                  <InputField label="Bo'lim" value={formData.department} onChange={v => setFormData({...formData, department: v})} placeholder="IT bo'limi" />
                </div>
              </section>

              {/* Ish tartibi qismi (Modalni ochish) */}
              <section className="p-6 bg-gray-50 rounded-[32px] border border-dashed border-gray-300">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Belgilangan ish vaqti</h4>
                    <div className="flex items-center gap-4 text-2xl font-black text-gray-800">
                      <span>{formData.workStartTime}</span>
                      <span className="text-gray-300">—</span>
                      <span>{formData.workEndTime}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-bold shadow-sm transition-all"
                  >
                    <FiSettings /> SOZLAMALAR
                  </button>
                </div>
              </section>

              <section className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700"><FiCalendar className="text-purple-500"/> Ish kunlari</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button key={day.id} onClick={() => setFormData(prev => ({
                      ...prev, workDays: prev.workDays.includes(day.id) ? prev.workDays.filter(d => d !== day.id) : [...prev.workDays, day.id].sort()
                    }))} className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all ${formData.workDays.includes(day.id) ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'bg-white text-gray-400 border border-gray-100'}`}>
                      {day.name}
                    </button>
                  ))}
                </div>
              </section>

              <button 
                onClick={handleStartEnroll}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 disabled:bg-gray-200"
              >
                {loading ? "Yuklanmoqda..." : <><FiUserPlus size={20} /> RO'YXATGA OLISHNI BOSHLASH</>}
              </button>
            </div>

            <div className="lg:col-span-2">
              <CameraPreview tick={previewTick} status={deviceStatus} />
              <div className="mt-4 bg-blue-50 p-5 rounded-3xl border border-blue-100">
                <p className="text-blue-800 text-sm font-bold flex items-center gap-2">
                  <FiGlobe /> {formData.timezone} (O'zbekiston)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Enrollment */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto bg-white rounded-[40px] shadow-2xl p-10 animate-in zoom-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <CameraPreview tick={previewTick} status={deviceStatus} height="h-[450px]" />
              <div className="flex flex-col justify-center space-y-6">
                <div className="p-8 bg-gray-50 rounded-[32px] space-y-4">
                  <h2 className="text-xl font-black mb-4">Biometrik tasdiq</h2>
                  <EnrollStatusLabel label="F.I.SH" value={formData.name} success={true} />
                  <EnrollStatusLabel label="Ish vaqti" value={`${formData.workStartTime} - ${formData.workEndTime}`} success={true} />
                  <EnrollStatusLabel label="Karta" value={formData.cardNo || "O'qitilmoqda..."} success={!!formData.cardNo} />
                  <EnrollStatusLabel label="Yuz" value={faceCaptured ? "Tayyor" : "Olinmagan"} success={faceCaptured} />
                </div>
                <div className="grid gap-3">
                  <button onClick={handleCaptureFace} disabled={loading || faceCaptured} className={`py-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${faceCaptured ? 'bg-green-100 text-green-700' : 'bg-orange-500 text-white hover:scale-[1.02]'}`}>
                    <FiCamera /> {faceCaptured ? "Rasm saqlandi" : "Yuzni suratga olish"}
                  </button>
                  <button onClick={handleConfirm} disabled={loading} className="py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg">
                    SAQLASH VA TASDIQLASH
                  </button>
                  <button onClick={() => setStep(1)} className="py-3 text-gray-400 font-bold hover:text-gray-600">
                    Tahrirlashga qaytish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="max-w-md mx-auto bg-white rounded-[40px] shadow-2xl p-12 text-center animate-in bounce-in">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <FiCheckCircle size={48} />
            </div>
            <h2 className="text-3xl font-black mb-2">Muvaffaqiyatli!</h2>
            <p className="text-gray-500 mb-10"><strong>{formData.name}</strong> tizimga muvaffaqiyatli qo'shildi. ID: {formData.employeeNo}</p>
            <button onClick={resetForm} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold hover:shadow-2xl transition-all">
              YANA QO'SHISH
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Helper Components ---
function InputField({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 ml-1">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
      />
    </div>
  );
}

function StatusBadge({ icon, label, color }) {
  const colors = {
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
    gray: "bg-gray-50 text-gray-600 border-gray-100"
  };
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black tracking-wider uppercase ${colors[color]}`}>
      {icon} {label}
    </div>
  );
}

function CameraPreview({ tick, status, height = "h-[450px]" }) {
  return (
    <div className={`relative w-full ${height} bg-slate-900 rounded-[40px] overflow-hidden border-8 border-white shadow-2xl group`}>
      {status === 'online' ? (
        <img 
          src={`${API_BASE}/api/enroll/preview.jpg?t=${tick}`} 
          alt="Live" 
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000"; }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 italic">
            <FiWifiOff size={32} className="mb-2 opacity-30"/>
            <span className="font-bold">Device Offline</span>
        </div>
      )}
      <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-white text-[10px] font-black tracking-widest uppercase">Live Camera</span>
      </div>
    </div>
  );
}

function EnrollStatusLabel({ label, value, success }) {
  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
      <span className="text-sm text-gray-500 font-bold">{label}</span>
      <span className={`text-sm font-black ${success ? 'text-green-600' : 'text-orange-500 animate-pulse'}`}>
        {value}
      </span>
    </div>
  );
}