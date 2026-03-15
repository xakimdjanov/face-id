import React, { useEffect, useState } from "react";
import {
  FiPlus,
  FiRefreshCw,
  FiWifi,
  FiWifiOff,
} from "react-icons/fi";
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
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [attendanceFilters, setAttendanceFilters] = useState({
    startDate: "",
    endDate: "",
    employeeNo: "",
    verifyMode: "",
    limit: 50,
    page: 1,
  });

  const [attendancePagination, setAttendancePagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
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
        setUsers(res.data || res.data?.data || []);
      } catch (err) {
        console.log(err);
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
        console.log(err);
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
  const fetchAttendanceList = async () => {
    if (!userBranchId) return;
    setAttendanceLoading(true);
    try {
      const res = await attendanceFaceService.getAll({
        ...attendanceFilters,
        branchId: userBranchId,
      });
      const data = res?.data?.data || [];

      setAttendanceList((prev) => {
        const prevStr = JSON.stringify(prev);
        const newStr = JSON.stringify(data);
        if (prevStr === newStr) return prev;
        return data;
      });

      setAttendancePagination(
        res.data.pagination || {
          total: data.length,
          page: attendanceFilters.page,
          limit: attendanceFilters.limit,
          totalPages: Math.ceil(data.length / attendanceFilters.limit),
        }
      );
    } catch (err) {
      console.log(err);
      toast.error("Davomat yuklab bo'lmadi");
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Har qanday filtr o'zgarganda bir marta yuklash
  useEffect(() => {
    if (userBranchId) {
      fetchAttendanceList();
    }
  }, [
    userBranchId,
    attendanceFilters.startDate,
    attendanceFilters.endDate,
    attendanceFilters.page,
    attendanceFilters.limit,
  ]);

  // Faqat "today" rejimida har 3 soniyada yangilash
  useEffect(() => {
    if (!userBranchId) return;
    if (activePeriod !== "today") return;

    const interval = setInterval(() => {
      fetchAttendanceList();
    }, 3000);

    return () => clearInterval(interval);
  }, [userBranchId, activePeriod]);

  // Helper functions (o'zgarmagan)
  const getUserRole = (userId) => {
    if (!userId) return "xodim";
    const user = users.find((u) => Number(u.id) === Number(userId));
    return user?.role || "xodim";
  };

  const getEmployeeStatus = (att) => {
    if (!att.firstIn) return "KELMADI";
    return att.lastOut ? "KETGAN" : "BINODA";
  };

  const getStudentSchedule = (userId) => {
    const sg = studentGroups.find((s) => Number(s.studentId) === Number(userId));
    return sg ? {
      name: sg.group.name,
      start: sg.group.startTime,
      end: sg.group.endTime,
      days: sg.group.days,
    } : null;
  };

  const getDayShort = (dateStr) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[new Date(dateStr).getDay()];
  };

  const getStudentAttendanceStatus = (att) => {
    const schedule = getStudentSchedule(att.userId);
    if (!schedule) return "—";
    const day = getDayShort(att.firstIn || att.date);
    if (!schedule.days.includes(day)) return "DARS YO'Q";

    const start = new Date(`${att.date}T${schedule.start}`);
    const end = new Date(`${att.date}T${schedule.end}`);
    let total = 0;
    const pairs = Math.min(att.ins.length, att.outs.length);
    for (let i = 0; i < pairs; i++) {
      const inTime = new Date(att.ins[i]);
      const outTime = new Date(att.outs[i]);
      const realStart = inTime > start ? inTime : start;
      const realEnd = outTime < end ? outTime : end;
      if (realEnd > realStart) total += realEnd - realStart;
    }
    return (total / (1000 * 60)) >= 30 ? "KELDI" : "KELMADI";
  };

  const getDisplayName = (att) => {
    if (att.employee?.name && !att.employee.name.toLowerCase().startsWith("user")) {
      return att.employee.name;
    }
    const rawName = att.rawData?.AccessControllerEvent?.name?.trim();
    if (rawName && !rawName.toLowerCase().startsWith("user")) return rawName;
    return att.employeeNo || "—";
  };

  const getEventLabel = (att) => {
    const event = att.rawData?.AccessControllerEvent;
    if (!event) return att.eventType;
    if (event.attendanceStatus === "checkIn") return "KIRISH";
    if (event.attendanceStatus === "checkOut") return "CHIQISH";
    return att.eventType;
  };

  const formatTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : "—";

  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString("uz-UZ") : "—";

  const calculateWorkTime = (ins, outs) => {
    let total = 0;
    const pairs = Math.min(ins.length, outs.length);
    for (let i = 0; i < pairs; i++) {
      const start = new Date(ins[i]);
      const end = new Date(outs[i]);
      if (end > start) total += end - start;
    }
    const hours = Math.floor(total / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} soat ${minutes} daqiqa`;
  };

  const groupAttendance = (list) => {
    const map = {};
    list.forEach((item) => {
      const name = getDisplayName(item);
      const date = formatDate(item.eventTime);
      const userId = item.rawData?.AccessControllerEvent?.employeeNoString;
      const key = `${userId}_${date}`;
      const label = getEventLabel(item);
      const time = item.eventTime;

      if (!map[key]) map[key] = { name, date, userId, ins: [], outs: [] };
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
        lastOut: outsSorted[outsSorted.length - 1] || null,
      };
    });
  };

  const groupedAttendance = groupAttendance(attendanceList);
  const filteredAttendance = roleFilter === "all"
    ? groupedAttendance
    : groupedAttendance.filter((att) => getUserRole(att.userId) === roleFilter);

  // Filter funksiyalari
  const setTodayFilter = () => {
    const today = new Date().toISOString().slice(0, 10);
    setAttendanceFilters((prev) => ({ ...prev, startDate: today, endDate: today, page: 1 }));
    setActivePeriod("today");
    setMonthFilter("");
  };

  const setWeekFilter = () => {
    const now = new Date();
    const first = new Date(now);
    first.setDate(now.getDate() - now.getDay());
    const last = new Date(first);
    last.setDate(first.getDate() + 6);
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
    const value = monthIndex === "" ? "" : String(monthIndex);
    setMonthFilter(value);

    if (value === "") {
      setActivePeriod("");
      return;
    }

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

  // Dastlabki yuklanishda bugungi kunni tanlash
  useEffect(() => {
    setTodayFilter();
  }, []);

  // Loglarni tozalash - modal bilan
  const handleClearDeviceLogs = async () => {
    setShowClearConfirm(false);
    try {
      const res = await deviceService.clearLogs();
      if (res.data.success) {
        toast.success("Qurilma loglari muvaffaqiyatli tozalandi");
      } else {
        toast.error("Tozalash muvaffaqiyatsiz yakunlandi");
      }
    } catch (err) {
      console.error("Clear logs error:", err);
      toast.error("Loglarni tozalashda xatolik yuz berdi");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header / Filter Panel */}
        <div className="bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-5 border border-gray-100/50">
          <div className="flex flex-wrap items-center justify-between gap-5 md:gap-6">

            {/* Role filter */}
            <div className="min-w-[180px]">
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 shadow-sm transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/30 hover:border-gray-300 outline-none cursor-pointer"
                >
                  <option value="all">Barcha rollar</option>
                  <option value="student">Talabalar</option>
                  <option value="teacher">O‘qituvchilar</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Rahbarlar</option>
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Period filters */}
            <div className="flex items-center gap-1.5 rounded-2xl bg-gray-100/60 p-1.5 shadow-inner">
              <button
                onClick={setTodayFilter}
                className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                  activePeriod === "today"
                    ? "bg-white shadow text-blue-700"
                    : "text-gray-600 hover:bg-white hover:text-blue-700 hover:shadow"
                } active:scale-95`}
              >
                Bugun
              </button>

              <button
                onClick={setWeekFilter}
                className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                  activePeriod === "week"
                    ? "bg-white shadow text-purple-700"
                    : "text-gray-600 hover:bg-white hover:text-purple-700 hover:shadow"
                } active:scale-95`}
              >
                Hafta
              </button>

              <div className="h-5 w-px bg-gray-300 mx-1.5" />

              <select
                value={monthFilter}
                onChange={(e) => handleMonthChange(e.target.value)}
                className={`rounded-xl bg-transparent px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  activePeriod === "month" ? "text-indigo-700 font-semibold" : "text-gray-600 hover:text-gray-900"
                } focus:ring-0 focus:outline-none`}
              >
                <option value="">Oylar</option>
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            </div>

            {/* Actions & Status */}
            <div className="flex flex-wrap items-center gap-4 md:gap-5">
              <div
                className={`flex items-center gap-2.5 rounded-2xl border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all ${
                  deviceStatus === "online"
                    ? "border-emerald-200 bg-emerald-50/80 text-emerald-700"
                    : "border-rose-200 bg-rose-50/80 text-rose-700"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full animate-pulse ${
                    deviceStatus === "online" ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                {deviceStatus === "online" ? "Online" : "Offline"}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="rounded-2xl border border-gray-200 bg-white p-2.5 text-gray-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 shadow-sm"
                  title="Loglarni tozalash"
                >
                  <FiRefreshCw className="h-5 w-5" />
                </button>

                <button
                  onClick={() => navigate("/admin/addface")}
                  className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/50 transition-all hover:bg-indigo-700 hover:shadow-md active:scale-[0.98]"
                >
                  <FiPlus className="h-5 w-5" />
                  Qo‘shish
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {attendanceLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="text-xs uppercase tracking-wider text-gray-600">
                    <th className="p-4 text-left">#</th>
                    <th className="p-4 text-left">Xodim</th>
                    <th className="p-4 text-left">Sana</th>
                    <th className="p-4 text-left">Kirish</th>
                    <th className="p-4 text-left">Chiqish</th>
                    <th className="p-4 text-left">Role</th>
                    <th className="p-4 text-left">Ish vaqti / Dars</th>
                    <th className="p-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAttendance.map((att, index) => {
                    const role = getUserRole(att.userId);
                    const isStudent = role === "student";

                    return (
                      <React.Fragment key={`${att.userId}-${att.date}`}>
                        <tr
                          className="hover:bg-slate-50 transition cursor-pointer"
                          onClick={() => setOpenRow(openRow === index ? null : index)}
                        >
                          <td className="p-4 text-gray-500">{index + 1}</td>
                          <td className="p-4 font-semibold text-gray-800">{att.name}</td>
                          <td className="p-4 text-gray-600">{att.date}</td>
                          <td className="p-4">
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                              {formatTime(att.firstIn)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
                              {formatTime(att.lastOut)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                              isStudent ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                            }`}>
                              {role}
                            </span>
                          </td>
                          <td className="p-4 text-sm">
                            {isStudent ? (
                              (() => {
                                const sch = getStudentSchedule(att.userId);
                                return sch ? (
                                  <div className="text-xs space-y-1">
                                    <div className="font-semibold text-gray-800">{sch.name}</div>
                                    <div className="text-gray-600">
                                      {sch.start.slice(0, 5)} – {sch.end.slice(0, 5)}
                                    </div>
                                  </div>
                                ) : "—";
                              })()
                            ) : (
                              <span className="font-medium text-gray-800">
                                {calculateWorkTime(att.ins, att.outs)}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {isStudent ? (
                              (() => {
                                const status = getStudentAttendanceStatus(att);
                                const styles = {
                                  KELDI: "bg-emerald-100 text-emerald-800",
                                  KELMADI: "bg-rose-100 text-rose-800",
                                  "DARS YO'Q": "bg-gray-100 text-gray-600",
                                };
                                return (
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
                                    {status}
                                  </span>
                                );
                              })()
                            ) : (
                              (() => {
                                const status = getEmployeeStatus(att);
                                const styles = {
                                  BINODA: "bg-emerald-100 text-emerald-800",
                                  KETGAN: "bg-blue-100 text-blue-800",
                                  KELMADI: "bg-rose-100 text-rose-800",
                                };
                                return (
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
                                    {status}
                                  </span>
                                );
                              })()
                            )}
                          </td>
                        </tr>

                        {openRow === index && (
                          <tr className="bg-slate-50">
                            <td colSpan={8} className="p-5">
                              <div className="grid md:grid-cols-2 gap-8 text-sm">
                                <div>
                                  <p className="font-semibold text-gray-800 mb-2">Qo'shimcha kirishlar:</p>
                                  {att.ins.slice(1).length ? (
                                    att.ins.slice(1).map((t, i) => (
                                      <div key={i} className="text-gray-600">↳ {formatTime(t)}</div>
                                    ))
                                  ) : (
                                    <div className="text-gray-500 italic">—</div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800 mb-2">Qo'shimcha chiqishlar:</p>
                                  {att.outs.slice(0, -1).length ? (
                                    att.outs.slice(0, -1).map((t, i) => (
                                      <div key={i} className="text-gray-600">↳ {formatTime(t)}</div>
                                    ))
                                  ) : (
                                    <div className="text-gray-500 italic">—</div>
                                  )}
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
                      <td colSpan={8} className="py-16 text-center text-gray-500">
                        Tanlangan filtr bo‘yicha ma’lumot topilmadi...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal for clear logs */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Loglarni tozalash</h3>
            <p className="mt-3 text-gray-600">
              Qurilmadagi barcha loglar o‘chiriladi.<br />
              Bu amalni qaytarib bo‘lmaydi. Rostan ham davom ettirasizmi?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleClearDeviceLogs}
                className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Tozalash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}