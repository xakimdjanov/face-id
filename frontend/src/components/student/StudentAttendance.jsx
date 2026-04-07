import React, { useState, useEffect, useMemo } from "react";
import { 
  HiOutlineClipboardCheck, 
  HiOutlineCalendar, 
  HiOutlineRefresh,
  HiOutlineExclamationCircle,
  HiOutlineClock,
} from "react-icons/hi";
import { attendanceFaceService } from "../../services/api";
import toast, { Toaster } from "react-hot-toast";
import { format, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { uz } from "date-fns/locale";
import { 
  HiOutlineChevronDown, 
  HiOutlineChevronUp,
} from "react-icons/hi";

const StudentAttendance = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedDays, setExpandedDays] = useState({});

  const toggleDay = (day) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await attendanceFaceService.getMyAttendance(params);
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [startDate, endDate]);

  const sessionSummaries = useMemo(() => {
    if (!logs.length) return [];
    const groups = {};
    logs.forEach(log => {
      const day = format(new Date(log.eventTime), 'yyyy-MM-dd');
      if (!groups[day]) groups[day] = [];
      groups[day].push(log);
    });

    return Object.entries(groups).map(([day, dayLogs]) => {
      const sorted = [...dayLogs].sort((a,b) => new Date(a.eventTime) - new Date(b.eventTime));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const diffMs = new Date(last.eventTime) - new Date(first.eventTime);
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      
      return {
        day,
        first,
        last,
        duration: diffMs > 0 ? `${hours}s ${minutes}dq` : "Binoda",
        isCompleted: first.id !== last.id
      };
    }).sort((a,b) => new Date(b.day) - new Date(a.day));
  }, [logs]);

  const periodStats = useMemo(() => {
    if (!logs.length) return { today: "0s 0m", week: "0s 0m", month: "0s 0m" };
    const now = new Date();
    const sDay = startOfDay(now);
    const sWeek = startOfWeek(now, { weekStartsOn: 1 });
    const sMonth = startOfMonth(now);

    const calculateTotal = (filterFn) => {
      const filtered = logs.filter(log => filterFn(new Date(log.eventTime)));
      const groups = {};
      filtered.forEach(log => {
        const d = format(new Date(log.eventTime), 'yyyy-MM-dd');
        if (!groups[d]) groups[d] = [];
        groups[d].push(log);
      });
      let totalMs = 0;
      Object.values(groups).forEach(dayLogs => {
        const sorted = dayLogs.sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime));
        totalMs += Math.max(0, new Date(sorted[sorted.length - 1].eventTime) - new Date(sorted[0].eventTime));
      });
      const hours = Math.floor(totalMs / 3600000);
      const minutes = Math.floor((totalMs % 3600000) / 60000);
      return `${hours}s ${minutes}m`;
    };

    return {
      today: calculateTotal(d => d >= sDay),
      week: calculateTotal(d => d >= sWeek),
      month: calculateTotal(d => d >= sMonth)
    };
  }, [logs]);

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50 min-h-screen">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mening davomatim</h1>
          <p className="text-slate-500 text-sm mt-1">Kirib-chiqish tarixingizni kuzating</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-xl border border-slate-200 flex items-center shadow-sm">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 px-2"
            />
            <span className="text-slate-300 mx-1">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 px-2"
            />
          </div>
          <button 
            onClick={fetchLogs}
            className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
            <HiOutlineRefresh size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Bugun", val: periodStats.today, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Shu hafta", val: periodStats.week, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Shu oy", val: periodStats.month, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center font-bold`}>
              <HiOutlineClock size={24} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                <p className="text-lg font-black text-slate-800">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px] gap-3">
             <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Yuklanmoqda...</p>
          </div>
        ) : sessionSummaries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Sana</th>
                  <th className="px-6 py-4">Kirish</th>
                  <th className="px-6 py-4">Chiqish</th>
                  <th className="px-6 py-4">Vaqt</th>
                  <th className="px-6 py-4 text-right">Batafsil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-600">
                {sessionSummaries.map((session) => {
                  const isExpanded = expandedDays[session.day];
                  const dayLogs = logs.filter(l => format(new Date(l.eventTime), 'yyyy-MM-dd') === session.day)
                                     .sort((a,b) => new Date(a.eventTime) - new Date(b.eventTime));

                  return (
                    <React.Fragment key={session.day}>
                      <tr className="hover:bg-slate-50/50 cursor-pointer transition-colors" onClick={() => toggleDay(session.day)}>
                        <td className="px-6 py-4 font-bold text-slate-700">
                            {format(new Date(session.day), "dd.MM.yyyy", { locale: uz })}
                        </td>
                        <td className="px-6 py-4 text-emerald-600">{format(new Date(session.first.eventTime), 'HH:mm')}</td>
                        <td className="px-6 py-4 text-rose-500">
                            {session.isCompleted ? format(new Date(session.last.eventTime), 'HH:mm') : "Binoda"}
                        </td>
                        <td className="px-6 py-4 text-blue-600 italic">{session.duration}</td>
                        <td className="px-6 py-4 text-right">
                            {isExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/30">
                          <td colSpan={5} className="px-10 py-4 border-l-4 border-blue-500/20">
                            <div className="space-y-3">
                                {dayLogs.map((log) => {
                                    const isIn = (log.eventType?.toUpperCase().trim() === 'IN' || log.rawData?.AccessControllerEvent?.attendanceStatus === 'checkIn');
                                    return (
                                        <div key={log.id} className="flex items-center gap-6 text-[11px] font-bold">
                                            <span className="text-slate-400 w-10">{format(new Date(log.eventTime), 'HH:mm')}</span>
                                            <span className={isIn ? "text-emerald-500" : "text-rose-500"}>
                                                {isIn ? "KIRDI" : "CHIQDI"}
                                            </span>
                                            <span className="text-slate-300 font-normal uppercase tracking-tighter hidden sm:inline">
                                                {log.verifyMode || "Face"}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-slate-300 space-y-2">
            <HiOutlineExclamationCircle size={48} />
            <p className="font-bold text-xs uppercase tracking-widest">Ma'lumot topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;