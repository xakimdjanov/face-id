import React, { useEffect, useState } from "react";
import {
  FiPlus,
  FiWifi,
  FiWifiOff,
  FiClock,
  FiCalendar,
  FiUser,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { HiOutlineClipboardCheck } from "react-icons/hi";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  attendanceFaceService,
  deviceService,
  userService,
  studentGroupService,
} from "../../services/api";

export default function AdminAttendance() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [userBranchId, setUserBranchId] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState("offline");
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [openRow, setOpenRow] = useState(null);
  const [studentGroups, setStudentGroups] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [activePeriod, setActivePeriod] = useState("today");

  const [attendanceFilters, setAttendanceFilters] = useState({
    startDate: "",
    endDate: "",
    employeeNo: "",
    verifyMode: "",
    limit: 100,
    page: 1,
  });

  const months = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
  ];

  // USER LOAD
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    setUserBranchId(user?.branchId);
  }, []);

  const [users, setUsers] = useState([]);
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await userService.getAll();
        setUsers(res.data?.data || res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    const loadStudentGroups = async () => {
      try {
        const res = await studentGroupService.getAll();
        const groups = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setStudentGroups(groups);
      } catch (err) {
        console.error(err);
      }
    };
    loadStudentGroups();
  }, []);

  // DEVICE STATUS
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

  // ATTENDANCE LOAD
  const fetchAttendanceList = async (silent = false) => {
    if (!userBranchId) return;
    if (!silent) setAttendanceLoading(true);
    try {
      const res = await attendanceFaceService.getAll({
        ...attendanceFilters,
        branchId: userBranchId,
      });
      const data = res?.data?.data || [];

      setAttendanceList((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
        return data;
      });
    } catch (err) {
      if (!silent) toast.error("Davomat yuklab bo'lmadi");
    } finally {
      if (!silent) setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (userBranchId) fetchAttendanceList();
  }, [userBranchId, attendanceFilters.startDate, attendanceFilters.endDate]);

  useEffect(() => {
    if (!userBranchId || activePeriod !== "today") return;
    const interval = setInterval(() => fetchAttendanceList(true), 3000);
    return () => clearInterval(interval);
  }, [userBranchId, activePeriod]);

  // Helpers
  const getUserRoleLabel = (employeeNo, employeeId, name) => {
    const normSearchName = String(name || "").replace(/\s+/g, '').toLowerCase();
    const user = users.find((u) => 
      (employeeId && Number(u.id) === Number(employeeId)) || 
      (employeeNo && String(u.employeeNo).trim() === String(employeeNo).trim()) ||
      (normSearchName !== "" && String(u.fullname || u.name || "").replace(/\s+/g, '').toLowerCase() === normSearchName)
    );
    const roleMap = {
      student: "Talaba",
      teacher: "O'qituvchi",
      admin: "Admin",
      manager: "Rahbar"
    };
    return roleMap[user?.role] || "Xodim";
  };

  const getUserRole = (employeeNo, employeeId, name) => {
    const normSearchName = String(name || "").replace(/\s+/g, '').toLowerCase();
    const user = users.find((u) => 
      (employeeId && Number(u.id) === Number(employeeId)) || 
      (employeeNo && String(u.employeeNo).trim() === String(employeeNo).trim()) ||
      (normSearchName !== "" && String(u.fullname || u.name || "").replace(/\s+/g, '').toLowerCase() === normSearchName)
    );
    return user?.role || "xodim";
  };

  const getAttendanceStatus = (att) => {
    if (!att.firstIn) return "KELMADI";
    if (!att.lastOut) return "BINODA";
    return new Date(att.lastIn) > new Date(att.lastOut) ? "BINODA" : "KETGAN";
  };

  const getStudentSchedule = (employeeNo, employeeId, name) => {
    const normSearchName = String(name || "").replace(/\s+/g, '').toLowerCase();
    const user = users.find((u) => 
      (employeeId && Number(u.id) === Number(employeeId)) || 
      (employeeNo && String(u.employeeNo).trim() === String(employeeNo).trim()) ||
      (normSearchName !== "" && String(u.fullname || u.name || "").replace(/\s+/g, '').toLowerCase() === normSearchName)
    );
    const sg = studentGroups.find((s) => Number(s.studentId) === Number(user?.id));
    return sg ? {
      name: sg.group.name,
      start: sg.group.startTime,
      end: sg.group.endTime,
    } : null;
  };

  const getDisplayName = (att) => {
    if (att.employee?.name && !att.employee.name.toLowerCase().startsWith("user")) return att.employee.name;
    const rawName = att.rawData?.AccessControllerEvent?.name?.trim();
    if (rawName && !rawName.toLowerCase().startsWith("user")) return rawName;
    return att.employeeNo || "—";
  };

  const getEventLabel = (att) => {
    const event = att.rawData?.AccessControllerEvent;
    if (event?.attendanceStatus === "checkIn") return "KIRISH";
    if (event?.attendanceStatus === "checkOut") return "CHIQISH";
    return att.eventType || "UNKNOWN";
  };

  const formatTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : "—";
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const calculateWorkTime = (ins, outs) => {
    let total = 0;
    const pairs = Math.min(ins.length, outs.length);
    for (let i = 0; i < pairs; i++) {
      const start = new Date(ins[i]);
      const end = new Date(outs[i]);
      if (end > start) total += end - start;
    }
    const hours = Math.floor(total / 3600000);
    const minutes = Math.floor((total % 3600000) / 60000);
    return `${hours} soat ${minutes} daqiqa`;
  };

  const groupAttendance = (list) => {
    const map = {};
    list.forEach((item) => {
      const name = getDisplayName(item);
      const date = formatDate(item.eventTime);
      const normalizedName = name.replace(/\s+/g, '').toLowerCase();
      const key = `${normalizedName}_${date}`;

      const empId = item.employee?.id || item.employeeId;
      const empNo = item.employeeNo || item.rawData?.AccessControllerEvent?.employeeNoString;
      const label = getEventLabel(item);
      const time = item.eventTime;

      if (!map[key]) {
        map[key] = { 
            name, 
            date, 
            employeeNo: empNo, 
            employeeId: empId,
            ins: [], 
            outs: [],
            all: []
        };
      }
      
      map[groupMapKey(key)].all.push(item); // Not really needed, just for structure
      if (label === "KIRISH") map[key].ins.push(time);
      if (label === "CHIQISH") map[key].outs.push(time);
    });

    return Object.values(map).map((item) => {
      const insSorted = item.ins.sort((a, b) => new Date(a) - new Date(b));
      const outsSorted = item.outs.sort((a, b) => new Date(a) - new Date(b));
      return {
        ...item,
        ins: insSorted,
        outs: outsSorted,
        firstIn: insSorted[0] || null,
        lastIn: insSorted[insSorted.length - 1] || null,
        lastOut: outsSorted[outsSorted.length - 1] || null,
      };
    });
  };

  // Helper for key normalization
  const groupMapKey = (key) => key; 

  const groupedAttendance = groupAttendance(attendanceList);
  const filteredAttendance = roleFilter === "all"
    ? groupedAttendance
    : groupedAttendance.filter((att) => getUserRole(att.employeeNo, att.employeeId, att.name) === roleFilter);

  // Filters
  const setTodayFilter = () => {
    const today = new Date().toISOString().slice(0, 10);
    setAttendanceFilters((prev) => ({ ...prev, startDate: today, endDate: today, page: 1 }));
    setActivePeriod("today");
    setMonthFilter("");
  };

  const setWeekFilter = () => {
    const now = new Date();
    const first = new Date(now.setDate(now.getDate() - now.getDay()));
    const last = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    setAttendanceFilters((prev) => ({
      ...prev,
      startDate: first.toISOString().slice(0, 10),
      endDate: last.toISOString().slice(0, 10),
      page: 1,
    }));
    setActivePeriod("week");
    setMonthFilter("");
  };

  const handleMonthChange = (monthIndex) => {
    setMonthFilter(monthIndex);
    if (monthIndex === "") return;
    const year = new Date().getFullYear();
    const first = new Date(year, Number(monthIndex), 1);
    const last = new Date(year, Number(monthIndex) + 1, 0);
    setAttendanceFilters((prev) => ({
      ...prev,
      startDate: first.toISOString().slice(0, 10),
      endDate: last.toISOString().slice(0, 10),
      page: 1,
    }));
    setActivePeriod("month");
  };

  useEffect(() => { setTodayFilter(); }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Panel */}
        <div className="bg-white shadow-sm rounded-3xl p-6 border border-blue-50 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                <HiOutlineClipboardCheck size={28} />
            </div>
            <div>
                <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Davomat Kontroli</h1>
                <div className="flex items-center gap-2 mt-0.5">
                    <div className={`h-2 w-2 rounded-full ${deviceStatus === "online" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{deviceStatus}</span>
                </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
             >
                <option value="all">Barcha Rollar</option>
                <option value="student">Talabalar</option>
                <option value="teacher">O‘qituvchilar</option>
                <option value="manager">Rahbarlar</option>
             </select>

             <div className="flex bg-slate-100 p-1 rounded-xl">
               <button onClick={setTodayFilter} className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-all ${activePeriod === "today" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}>Bugun</button>
               <button onClick={setWeekFilter} className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-all ${activePeriod === "week" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}>Hafta</button>
             </div>

             <select
                value={monthFilter}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
             >
                <option value="">Oylar</option>
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
             </select>

             <button
                onClick={() => navigate("/admin/addface")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-black uppercase shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
             >
                <FiPlus size={20} />
                Qo‘shish
             </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {attendanceLoading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-16">№</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Foydalanuvchi</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Sana</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Kirish</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Chiqish</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Asosiy Role</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Ish Vaqti / Dars</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAttendance.map((att, index) => {
                  const role = getUserRole(att.employeeNo, att.employeeId, att.name);
                  const isStudent = role === "student";
                  const isOpen = openRow === index;

                  return (
                    <React.Fragment key={index}>
                      <tr
                        className="hover:bg-blue-50/20 transition-all cursor-pointer"
                        onClick={() => setOpenRow(isOpen ? null : index)}
                      >
                        <td className="p-5 text-center text-sm font-bold text-gray-400">{index + 1}</td>
                        <td className="p-5 font-bold text-gray-800 text-sm">{att.name}</td>
                        <td className="p-5 text-gray-500 font-bold text-xs uppercase">{att.date}</td>
                        <td className="p-5">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black border border-emerald-100">
                            {formatTime(att.firstIn)}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-black border border-rose-100">
                            {formatTime(att.lastOut)}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${
                            isStudent ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            {getUserRoleLabel(att.employeeNo, att.employeeId, att.name)}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex flex-col">
                            <span className="text-gray-800 font-bold text-xs">
                              {calculateWorkTime(att.ins, att.outs)}
                            </span>
                            {isStudent && (
                              (() => {
                                const sch = getStudentSchedule(att.employeeNo, att.employeeId, att.name);
                                return sch ? (
                                  <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter truncate max-w-[150px]">
                                    {sch.name} ({sch.start.slice(0, 5)}–{sch.end.slice(0, 5)})
                                  </span>
                                ) : null;
                              })()
                            )}
                          </div>
                        </td>
                          <td className="p-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                                    getAttendanceStatus(att) === "BINODA" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                    getAttendanceStatus(att) === "KETGAN" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                    "bg-rose-50 text-rose-600 border-rose-100"
                                }`}>
                                    {getAttendanceStatus(att)}
                                </span>
                                {isOpen ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
                            </div>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={8} className="p-8">
                                <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-600"><FiClock size={48} /></div>
                                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                            Kirish amallari
                                        </h4>
                                        <div className="space-y-3">
                                            {att.ins.length > 0 ? (
                                                att.ins.map((t, i) => (
                                                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                                        <span className="text-gray-400 font-bold text-[10px]"># {i+1} urinish</span>
                                                        <span className="text-gray-800 font-black text-sm">{formatTime(t)}</span>
                                                    </div>
                                                ))
                                            ) : <p className="text-gray-400 italic text-xs">Ma'lumot yo'q</p>}
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 text-rose-600"><FiClock size={48} /></div>
                                        <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
                                            Chiqish amallari
                                        </h4>
                                        <div className="space-y-3">
                                            {att.outs.length > 0 ? (
                                                att.outs.map((t, i) => (
                                                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                                        <span className="text-gray-400 font-bold text-[10px]"># {i+1} urinish</span>
                                                        <span className="text-gray-800 font-black text-sm">{formatTime(t)}</span>
                                                    </div>
                                                ))
                                            ) : <p className="text-gray-400 italic text-xs">Ma'lumot yo'q</p>}
                                        </div>
                                    </div>
                                </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {filteredAttendance.length === 0 && !attendanceLoading && (
                    <tr>
                      <td colSpan={8} className="py-32 text-center">
                         <div className="inline-flex p-8 bg-slate-50 rounded-full text-slate-200 mb-4">
                            <FiCalendar size={64} />
                         </div>
                         <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Ma'lumot topilmadi</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}