import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  FiUserPlus,
  FiCamera,
  FiCheckCircle,
  FiSearch,
  FiWifi,
  FiWifiOff,
  FiArrowLeft,
  FiSmartphone,
  FiPhone,
  FiUser,
  FiInfo,
  FiArrowRight,
  FiLoader,
  FiChevronRight,
  FiCheck,
  FiUpload,
  FiPlus
} from "react-icons/fi";
import { HiOutlineUserAdd, HiOutlineStatusOnline, HiOutlineFingerPrint } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  branchService,
  groupService,
  studentGroupService,
  employeeService,
  deviceService,
  courseService,
} from "../../services/api";

const API = "http://localhost:5000";
const WS_URL = "ws://localhost:5000/ws/enroll";

export default function AdminAddUserFace() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState("offline");
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [previewTick, setPreviewTick] = useState(0);
  const [branches, setBranches] = useState([]);
  const [branchUsers, setBranchUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableGroups, setAvailableGroups] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userBranchId, setUserBranchId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    employeeNo: "",
    cardNo: "",
    phone: "",
    role: "student",
    branchId: "",
    groupId: "",
    courseId: "",
    userId: null,
  });

  const [faceCaptured, setFaceCaptured] = useState(false);
  const [enrollStarted, setEnrollStarted] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const previewTimerRef = useRef(null);

  // ==================== INITIAL LOAD ====================
  useEffect(() => {
    const init = async () => {
      try {
        const res = await branchService.getAll();
        setBranches(Array.isArray(res.data) ? res.data : []);

        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user?.branchId) {
            const bId = user.branchId.toString();
            setUserBranchId(bId);
            setFormData((prev) => ({ ...prev, branchId: bId }));
            loadBranchFullData(bId);
          }
        }
      } catch (err) {
        toast.error("Ma'lumotlarni yuklashda xato");
      }
    };
    init();
  }, []);

  const handleUploadFace = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("faceFile", file);
    form.append("employeeNo", formData.employeeNo);

    try {
      setLoading(true);
      const res = await employeeService.uploadFace(form);
      if (res.data?.success) {
        setFaceCaptured(true);
        toast.success("Rasm yuklandi");
      }
    } catch (err) {
      toast.error("Rasm yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  // Device status tekshirish
  useEffect(() => {
    const checkDeviceStatus = async () => {
      try {
        const res = await deviceService.ping();
        setDeviceStatus(res.data?.success ? "online" : "offline");
      } catch {
        setDeviceStatus("offline");
      }
    };

    checkDeviceStatus();
    const interval = setInterval(checkDeviceStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadBranchFullData = async (branchId) => {
    try {
      const [uRes, gRes, cRes] = await Promise.all([
        branchService.getById(branchId),
        groupService.getAll(),
        courseService.getAll(),
      ]);

      setBranchUsers(uRes.data?.users || []);
      const allGroups = gRes.data?.data || (Array.isArray(gRes.data) ? gRes.data : []);
      const allCourses = cRes.data?.data || (Array.isArray(cRes.data) ? cRes.data : []);

      setAvailableGroups(allGroups.filter((g) => Number(g.branchId) === Number(branchId)));
      setAvailableCourses(allCourses.filter((c) => Number(c.branchId) === Number(branchId)));
    } catch (err) {
      console.error("Filial ma'lumotlari yuklanmadi");
    }
  };

  // ==================== USER SELECTION ====================
  const selectExistingUser = async (user) => {
    setLoading(true);
    try {
      const baseInfo = {
        name: user.fullname || "",
        employeeNo: user.id?.toString() || "",
        phone: user.phone || "",
        role: user.role || "student",
        userId: user.id,
        branchId: user.branchId?.toString() || formData.branchId,
        groupId: "",
        courseId: ""
      };

      if (user.role === "student") {
        const groupRes = await studentGroupService.getByStudent(user.id);
        const studentGroups = groupRes.data.data || [];
        if (studentGroups.length > 0) {
          const firstGroup = studentGroups[0];
          baseInfo.groupId = firstGroup.group.id.toString();
          baseInfo.courseId = firstGroup.group.course.id.toString();
        }
      }

      setFormData(prev => ({ ...prev, ...baseInfo }));
      setSearchTerm(user.fullname);
      setShowUserDropdown(false);
    } catch (error) {
      toast.error("Ma'lumotlarni olishda xato");
    } finally {
      setLoading(false);
    }
  };

  // ==================== WEBSOCKET ====================
  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => setWsStatus("connected");
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "CARD") {
        setFormData((p) => ({ ...p, cardNo: String(msg.cardNo) }));
        toast.success("Karta aniqlandi!");
      }
    };
    ws.onclose = () => {
      setWsStatus("disconnected");
      reconnectTimerRef.current = setTimeout(connectWS, 3000);
    };
  }, []);

  useEffect(() => {
    connectWS();
    return () => {
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connectWS]);

  useEffect(() => {
    if (enrollStarted) {
      previewTimerRef.current = setInterval(() => setPreviewTick((t) => t + 1), 700);
    }
    return () => clearInterval(previewTimerRef.current);
  }, [enrollStarted]);

  // ==================== API HANDLERS ====================
  const handleStartEnroll = async () => {
    if (!formData.name || !formData.employeeNo || !formData.branchId) {
      return toast.error("Majburiy maydonlarni to'ldiring");
    }
    setLoading(true);
    try {
      const res = await employeeService.startEnroll({
        ...formData,
        branchId: parseInt(formData.branchId),
      });
      if (res.data?.success) {
        setEnrollStarted(true);
        setStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureFace = async () => {
    setLoading(true);
    try {
      const res = await employeeService.captureFace(formData.employeeNo);
      if (res.data?.success) {
        setFaceCaptured(true);
        toast.success("Yuz rasmi olindi");
      }
    } catch (err) {
      toast.error("Kamera xatosi");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        branchId: parseInt(formData.branchId),
        userId: formData.userId ? parseInt(formData.userId) : undefined,
        groupId: formData.role === "student" ? parseInt(formData.groupId) : undefined,
        courseId: formData.role === "student" ? parseInt(formData.courseId) : undefined,
      };

      const res = await employeeService.confirm(payload);
      if (res.data?.success) {
        setStep(3);
        toast.success("Muvaffaqiyatli saqlandi!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Server xatosi");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate("/admin/attendance");

  // ==================== RENDERING ====================

  const StepIndicator = () => (
    <div className="flex items-center justify-between max-w-2xl mx-auto px-4 mb-12 relative">
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
      <div className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(step - 1) * 50}%` }} />
      
      {[1, 2, 3].map((s) => (
        <div key={s} className="relative z-10 flex flex-col items-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-4 ${
            step >= s ? "bg-blue-600 border-blue-100 text-white shadow-xl shadow-blue-200" : "bg-white border-slate-100 text-slate-300"
          }`}>
            {step > s ? <FiCheck strokeWidth={3} /> : (
              s === 1 ? <FiUser /> : s === 2 ? <FiCamera /> : <FiCheckCircle />
            )}
          </div>
          <span className={`absolute top-16 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${step >= s ? "text-blue-600" : "text-slate-400"}`}>
            {s === 1 ? "Ma'lumotlar" : s === 2 ? "Biometrika" : "Tayyor"}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-blue-100/50 shadow-sm">
          <div className="flex items-center gap-5">
            <button onClick={handleBack} className="p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all active:scale-95 border border-slate-100">
              <FiArrowLeft size={20} />
            </button>
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
               <HiOutlineUserAdd size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Yangi Foydalanuvchi</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`h-2 w-2 rounded-full ${deviceStatus === "online" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qurilma Statusi: {deviceStatus}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex items-center bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Filial:</span>
               <span className="text-xs font-bold text-slate-700 capitalize">
                 {branches.find(b => b.id.toString() === formData.branchId)?.name || "Noma'lum"}
               </span>
             </div>
             <button onClick={handleBack} className="hidden md:flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">
               <FiArrowRight /> Ro'yxatga qaytish
             </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="relative">
          <StepIndicator />

          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Form Section */}
              <div className="lg:col-span-7 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div className="relative">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Bazadan qidirish (Tavsiya etiladi)</p>
                  <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="text"
                      className="w-full bg-slate-50/50 border-2 border-slate-50 pl-11 p-4 rounded-2xl outline-none focus:border-blue-500/20 focus:bg-white transition-all text-sm font-bold text-slate-800 placeholder:text-slate-300"
                      placeholder="Ism yoki telefon raqami..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        const filtered = branchUsers.filter(u =>
                          (u.fullname || u.name || "").toLowerCase().includes(e.target.value.toLowerCase()) ||
                          (u.phone || "").includes(e.target.value)
                        );
                        setFilteredUsers(filtered);
                        setShowUserDropdown(e.target.value.length > 1);
                      }}
                    />
                  </div>
                  {showUserDropdown && filteredUsers.length > 0 && (
                    <div className="absolute z-[100] w-full bg-white border border-slate-100 shadow-2xl rounded-2xl mt-2 max-h-72 overflow-y-auto p-2 scroll-smooth">
                      {filteredUsers.map((u) => (
                        <div key={u.id} className="p-4 hover:bg-blue-50 rounded-xl cursor-pointer border-b border-slate-50 last:border-0 transition-colors group" onClick={() => selectExistingUser(u)}>
                          <div className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{u.fullname || u.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                             <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600">{u.role}</span>
                             <span>•</span>
                             <span>{u.phone || "Tel yo'q"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Foydalanuvchi Turi</label>
                    <select className="w-full bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-slate-700" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                      <option value="student">Talaba</option>
                      <option value="teacher">O'qituvchi</option>
                      <option value="manager">Rahbar</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">ID Raqami (Qurilma uchun)</label>
                    <input className="w-full bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-slate-700 placeholder:text-slate-300" placeholder="12345" value={formData.employeeNo} onChange={(e) => setFormData({ ...formData, employeeNo: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">F-I-SH (To'liq Ism)</label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input className="w-full bg-slate-50/50 border-none pl-11 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-slate-800" placeholder="Ali Valiyev" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Telefon Raqami</label>
                  <div className="relative">
                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input className="w-full bg-slate-50/50 border-none pl-11 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-slate-800" placeholder="+998" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>

                {formData.role === "student" ? (
                  <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Kurs</label>
                      <select className="w-full bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-slate-700" value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}>
                        <option value="">Tanlang...</option>
                        {availableCourses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Guruh</label>
                      <select className="w-full bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-slate-700" value={formData.groupId} onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}>
                        <option value="">Tanlang...</option>
                        {availableGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4 text-blue-700 shadow-sm shadow-blue-100/50">
                    <div className="p-2 bg-blue-100 rounded-xl"><FiInfo size={16} /></div>
                    <span className="text-xs font-bold uppercase tracking-tight">
                      {formData.role} uchun guruh tanlash talab etilmaydi.
                    </span>
                  </div>
                )}

                <button onClick={handleStartEnroll} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-[22px] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                  {loading ? <FiLoader className="animate-spin" size={18} /> : null}
                  Keyingi Bosqich
                  {!loading && <FiChevronRight size={18} />}
                </button>
              </div>

              {/* Preview Side */}
              <div className="lg:col-span-5 h-full min-h-[400px]">
                <div className="bg-slate-900 rounded-[40px] h-full w-full relative overflow-hidden shadow-2xl border-[12px] border-white ring-1 ring-slate-100 group">
                   <img
                    src={`${API}/api/employee/preview.jpg?t=${previewTick}`}
                    className="w-full h-full object-cover transition-all duration-700"
                    onError={(e) => (e.target.src = "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1587&auto=format&fit=crop")}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />
                  
                  <div className="absolute top-6 left-6 flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-rose-600/90 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                      Live Feed
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 right-8">
                     <p className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-1 opacity-60">Status Check</p>
                     <p className="text-white text-lg font-bold leading-tight">Iltimos, kamera markaziga qarang</p>
                  </div>

                  <div className="absolute inset-0 border-[40px] border-white/5 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 animate-in zoom-in-95 duration-500">
               {/* Left Controls */}
               <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Biometrik Tasdiq</h3>
                    <p className="text-sm font-bold text-slate-400">Yuz va karta ma'lumotlarini biriktirish</p>
                  </div>

                  <div className="space-y-4">
                     <div className={`p-6 rounded-3xl border-2 transition-all flex items-center gap-5 ${faceCaptured ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-50"}`}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${faceCaptured ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                           {faceCaptured ? <FiCheck strokeWidth={3} size={24} /> : <FiCamera size={24}/>}
                        </div>
                        <div className="flex-1">
                           <div className="font-black text-slate-800 uppercase text-xs tracking-widest">Yuz Skaneri</div>
                           <div className={`text-[11px] font-bold mt-1 ${faceCaptured ? "text-emerald-600" : "text-slate-400"}`}>
                              {faceCaptured ? "Tasvir muvaffaqiyatli saqlandi" : "Kameraga qarab tugmani bosing"}
                           </div>
                        </div>
                     </div>

                     <div className={`p-6 rounded-3xl border-2 transition-all flex items-center gap-5 ${formData.cardNo ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-50"}`}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${formData.cardNo ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"}`}>
                           {formData.cardNo ? <HiOutlineFingerPrint size={28}/> : <FiSmartphone size={24}/>}
                        </div>
                        <div className="flex-1">
                           <div className="font-black text-slate-800 uppercase text-xs tracking-widest">RFID Karta</div>
                           <div className={`text-[11px] font-bold mt-1 ${formData.cardNo ? "text-blue-600" : "text-slate-400"}`}>
                              {formData.cardNo ? `ID: ${formData.cardNo}` : "Kartani qurilmaga yaqinlashtiring"}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                     <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleCaptureFace} className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2">
                           <FiCamera /> Skanerlash
                        </button>
                        <label className="bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all text-center cursor-pointer flex items-center justify-center gap-2">
                           <FiUpload /> Yuklash
                           <input type="file" accept="image/*" className="hidden" onChange={handleUploadFace} />
                        </label>
                     </div>

                     <button onClick={handleConfirm} disabled={!faceCaptured && !formData.cardNo} className="bg-emerald-500 hover:bg-emerald-600 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-emerald-100 transition-all mt-4 disabled:opacity-30 disabled:grayscale">
                        Barchasini Yakunlash
                     </button>
                     <button onClick={() => setStep(1)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2 hover:text-blue-600 transition-colors">
                        ← Ma'lumotlarni tahrirlash
                     </button>
                  </div>
               </div>

               {/* Large Live Preview */}
               <div className="bg-slate-900 rounded-[50px] relative overflow-hidden shadow-2xl border-[16px] border-white ring-1 ring-slate-100">
                  <img src={`${API}/api/employee/preview.jpg?t=${previewTick}`} className={`w-full h-full object-cover transition-all duration-1000 ${faceCaptured ? 'scale-110 blur-sm brightness-50' : ''}`} />
                  
                  {faceCaptured && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in duration-500">
                       <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/50 mb-6">
                         <FiCheck strokeWidth={4} size={48} />
                       </div>
                       <p className="text-white text-2xl font-black uppercase tracking-[0.3em] drop-shadow-lg">Tayyor!</p>
                    </div>
                  )}

                  {!faceCaptured && (
                    <div className="absolute inset-0 pointer-events-none">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-2 border-dashed border-white/40 rounded-[60px]" />
                       <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
                    </div>
                  )}
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-lg mx-auto bg-white p-12 rounded-[50px] shadow-2xl shadow-blue-500/5 text-center border border-slate-100 animate-in zoom-in duration-500 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="w-24 h-24 bg-emerald-500 text-white rounded-[32px] flex items-center justify-center shadow-2xl shadow-emerald-200 mx-auto mb-8 animate-bounce">
                  <FiCheck strokeWidth={4} size={48} />
                </div>
                
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2">Muvaffaqiyatli!</h2>
                <p className="text-slate-400 font-bold mb-10 px-6 leading-relaxed">
                  <span className="text-blue-600 font-extrabold">{formData.name}</span> tizimga muvaffaqiyatli qo'shildi va qurilmaga biriktirildi.
                </p>

                <div className="space-y-4">
                  <button onClick={() => {
                      setStep(1);
                      setFormData({
                        name: "",
                        employeeNo: "",
                        cardNo: "",
                        phone: "",
                        role: "student",
                        branchId: userBranchId || "",
                        groupId: "",
                        courseId: "",
                        userId: null,
                      });
                      setFaceCaptured(false);
                      setEnrollStarted(false);
                      setSearchTerm("");
                    }} 
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white p-5 rounded-[22px] font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <FiPlus size={18} /> Yangi Qo'shish
                  </button>
                  
                  <button onClick={() => navigate("/admin/attendance")} className="w-full bg-white hover:bg-slate-50 text-blue-600 p-5 rounded-[22px] font-black uppercase text-xs tracking-widest border-2 border-blue-50 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-3">
                    Davomatga Qaytish <FiArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
