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
  FiUsers,
  FiMapPin,
  FiPhone,
  FiBriefcase,
  FiUser,
  FiAward,
  FiClock,
  FiHash,
  FiBookOpen,
  FiAlertCircle,
  FiInfo,
  FiArrowRight,
} from "react-icons/fi";
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
      console.log(err);
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
      const allGroups =
        gRes.data?.data || (Array.isArray(gRes.data) ? gRes.data : []);
      const allCourses =
        cRes.data?.data || (Array.isArray(cRes.data) ? cRes.data : []);

      setAvailableGroups(
        allGroups.filter((g) => Number(g.branchId) === Number(branchId)),
      );
      setAvailableCourses(
        allCourses.filter((c) => Number(c.branchId) === Number(branchId)),
      );
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

    setFormData(prev => ({
      ...prev,
      ...baseInfo
    }));

    setSearchTerm(user.fullname);
    setShowUserDropdown(false);

  } catch (error) {

    console.log(error);
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
      previewTimerRef.current = setInterval(
        () => setPreviewTick((t) => t + 1),
        700,
      );
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
        groupId:
          formData.role === "student" ? parseInt(formData.groupId) : undefined,
        courseId:
          formData.role === "student" ? parseInt(formData.courseId) : undefined,
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

  const handleBack = () => {
    navigate("/admin/attendance");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <Toaster />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <FiArrowLeft className="text-xl" />
            </button>
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
              <FiUserPlus className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Yangi foydalanuvchi qo'shish
              </h1>
              <p className="text-sm text-gray-500">
                Qurilmaga yuz va karta ma'lumotlarini biriktirish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                deviceStatus === "online"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {deviceStatus === "online" ? <FiWifi /> : <FiWifiOff />}
              Qurilma: {deviceStatus.toUpperCase()}
            </div>

            <button
              onClick={handleBack}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center gap-2 transition-all"
            >
              <FiArrowRight /> Davomat ro'yxati
            </button>
          </div>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            1
          </div>
          <div className="w-16 h-1 bg-gray-200 rounded">
            <div
              className={`h-full bg-blue-600 rounded transition-all ${step >= 2 ? "w-full" : "w-0"}`}
            ></div>
          </div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            2
          </div>
          <div className="w-16 h-1 bg-gray-200 rounded">
            <div
              className={`h-full bg-blue-600 rounded transition-all ${step >= 3 ? "w-full" : "w-0"}`}
            ></div>
          </div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            3
          </div>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            {/* Form Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm space-y-5 border border-gray-100">
              {/* Search Field */}
              <div className="relative">
                <label className="text-sm font-semibold text-gray-700 mb-1 block">
                  Foydalanuvchini qidirish
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Ism yoki telefon..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                     const filtered = branchUsers.filter(u =>
  (u.fullname || "").toLowerCase().includes(e.target.value.toLowerCase()) ||
  (u.phone || "").includes(e.target.value)
);
                      setFilteredUsers(filtered);
                      setShowUserDropdown(e.target.value.length > 1);
                    }}
                  />
                </div>
                {showUserDropdown && filteredUsers.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border shadow-2xl rounded-xl mt-2 max-h-64 overflow-y-auto">
                    {filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        className="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                        onClick={() => selectExistingUser(u)}
                      >
                        <div className="font-bold text-gray-900">
                          {u.fullname}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <FiPhone className="w-3 h-3" />{" "}
                          {u.phone || "Telefon yo'q"} |{" "}
                          <span className="capitalize">{u.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">
                    Roli
                  </label>
                  <select
                    className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">
                    ID (Employee No)
                  </label>
                  <input
                    className="w-full p-3 bg-gray-50 border rounded-xl outline-none"
                    value={formData.employeeNo}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeNo: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">
                  Foydalanuvchi ismi
                </label>
                <input
                  className="w-full p-3 bg-gray-50 border rounded-xl outline-none"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">
                  Telefon raqami
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    className="w-full pl-10 p-3 bg-gray-50 border rounded-xl outline-none"
                    value={formData.phone || ""} // SHU YERNI TEKSHIRING
                    placeholder="+998"
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              {formData.role === "student" ? (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">
                      Kurs
                    </label>
                    <select
                      className="w-full p-3 bg-gray-50 border rounded-xl"
                      value={formData.courseId}
                      onChange={(e) =>
                        setFormData({ ...formData, courseId: e.target.value })
                      }
                    >
                      <option value="">Tanlang...</option>
                      {availableCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">
                      Guruh
                    </label>
                    <select
                      className="w-full p-3 bg-gray-50 border rounded-xl"
                      value={formData.groupId}
                      onChange={(e) =>
                        setFormData({ ...formData, groupId: e.target.value })
                      }
                    >
                      <option value="">Tanlang...</option>
                      {availableGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 rounded-xl flex items-center gap-3 text-blue-700 text-sm">
                  <FiInfo className="flex-shrink-0" />
                  <span>
                    {formData.role.charAt(0).toUpperCase() +
                      formData.role.slice(1)}{" "}
                    uchun guruh tanlash talab etilmaydi.
                  </span>
                </div>
              )}

              <button
                onClick={handleStartEnroll}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all"
              >
                {loading ? "Jarayon yuklanmoqda..." : "Bosqichni boshlash"}
              </button>
            </div>

            {/* Preview Section */}
            <div className="bg-gray-900 rounded-3xl flex items-center justify-center overflow-hidden border-8 border-white shadow-2xl h-[500px] relative">
              <img
                src={`${API}/api/employee/preview.jpg?t=${previewTick}`}
                className="w-full h-full object-cover"
                onError={(e) =>
                  (e.target.src =
                    "https://placehold.co/600x400/111/444?text=Kamera+Offline")
                }
              />
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />{" "}
                LIVE PREVIEW
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in duration-300">
            {/* LEFT SIDE */}
            <div className="bg-white p-8 rounded-2xl shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-gray-800">
                Biometrik tasdiqlash
              </h2>

              <div
                className={`p-5 rounded-2xl flex items-center gap-4 border ${
                  faceCaptured ? "bg-green-50 border-green-200" : "bg-gray-50"
                }`}
              >
                <FiCamera
                  className={faceCaptured ? "text-green-500" : "text-gray-400"}
                  size={24}
                />

                <div>
                  <div className="font-bold">Yuzni suratga olish</div>
                  <div className="text-sm">
                    {faceCaptured
                      ? "Muvaffaqiyatli olindi ✓"
                      : "Kameraga qarab tugmani bosing"}
                  </div>
                </div>
              </div>

              <div
                className={`p-5 rounded-2xl flex items-center gap-4 border ${
                  formData.cardNo ? "bg-blue-50 border-blue-200" : "bg-gray-50"
                }`}
              >
                <FiSmartphone
                  className={
                    formData.cardNo ? "text-blue-500" : "text-gray-400"
                  }
                  size={24}
                />

                <div>
                  <div className="font-bold">Karta (RFID)</div>
                  <div className="text-sm text-blue-600 font-mono">
                    {formData.cardNo
                      ? `Karta ID: ${formData.cardNo}`
                      : "ID kartani qurilmaga yaqinlashtiring"}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCaptureFace}
                  className="w-full bg-orange-500 text-white p-4 rounded-xl font-bold"
                >
                  Kameradan olish
                </button>

                <label className="w-full block bg-gray-200 text-center p-4 rounded-xl font-bold cursor-pointer">
                  Fayldan yuklash
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadFace}
                  />
                </label>

                <button
                  onClick={handleConfirm}
                  disabled={!faceCaptured && !formData.cardNo}
                  className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold disabled:bg-gray-200"
                >
                  Saqlash
                </button>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="bg-gray-800 rounded-3xl overflow-hidden shadow-2xl relative h-[450px]">
              <img
                src={`${API}/api/employee/preview.jpg?t=${previewTick}`}
                className="w-full h-full object-cover"
              />

              {faceCaptured && (
                <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[2px] flex items-center justify-center">
                  <FiCheckCircle className="text-white w-20 h-20" />
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-md mx-auto bg-white p-12 rounded-3xl shadow-2xl text-center border animate-in zoom-in">
            <FiCheckCircle size={60} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Muvaffaqiyatli!
            </h2>
            <p className="text-gray-500 mb-8">
              <b>{formData.name}</b> ro'yxatdan o'tkazildi.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
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
                }}
                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold"
              >
                Yangi foydalanuvchi qo'shish
              </button>
              <button
                onClick={() => navigate("/admin/attendance")}
                className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold"
              >
                Davomat ro'yxatini ko'rish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
