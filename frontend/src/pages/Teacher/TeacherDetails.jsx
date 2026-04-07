import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { studentGroupService, attendanceFaceService, employeeService } from "../../services/api";
import {
  HiOutlineArrowLeft,
  HiOutlineUserGroup,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineRefresh,
  HiOutlineChevronDown,
} from "react-icons/hi";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { uz } from "date-fns/locale";
import { FiLoader, FiCalendar, FiClock, FiActivity } from "react-icons/fi";
import toast from "react-hot-toast";

const TeacherDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const groupId = state?.groupId;

  const [students, setStudents] = useState([]);
  const [faceLogs, setFaceLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (key) => setExpandedRows((p) => ({ ...p, [key]: !p[key] }));

  const fetchData = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      const [sgRes, faceRes, empRes] = await Promise.all([
        studentGroupService.getById(groupId),
        attendanceFaceService.getAll({ startDate: start, endDate: end, limit: 5000 }),
        employeeService.getAll(),
      ]);

      setStudents(sgRes?.data?.data || sgRes?.data || []);
      setFaceLogs(faceRes?.data?.data || faceRes?.data || []);
      setEmployees(empRes?.data?.data || empRes?.data || []);
    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik!");
    } finally {
      setLoading(false);
    }
  }, [groupId, currentMonth]);

  useEffect(() => {
    if (!groupId) navigate("/teacher/groups");
    else fetchData();
  }, [groupId, fetchData, navigate]);

  const userToEmp = useMemo(() => {
    const map = {};
    employees.forEach((e) => { if (e.userId) map[String(e.userId)] = e.employeeNo; });
    return map;
  }, [employees]);

  const nameToEmp = useMemo(() => {
    const map = {};
    employees.forEach((e) => { if (e.name) map[e.name.trim().toLowerCase()] = e.employeeNo; });
    return map;
  }, [employees]);

  const studentSessions = useMemo(() => {
    const result = {};
    students.forEach((s) => {
      const studentName = (s.student?.fullname || s.fullname || "").trim().toLowerCase();
      const empNo = userToEmp[String(s.studentId)] || nameToEmp[studentName];
      const groupsDict = {};
      if (empNo) {
        faceLogs.forEach((log) => {
          if (log.employeeNo !== empNo) return;
          const day = format(new Date(log.eventTime), "yyyy-MM-dd");
          if (!groupsDict[day]) groupsDict[day] = [];
          groupsDict[day].push(log);
        });
      }
      result[s.studentId] = Object.entries(groupsDict).map(([day, dayLogs]) => {
        const sorted = [...dayLogs].sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime));
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const diffMs = new Date(last.eventTime) - new Date(first.eventTime);
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        return {
          day,
          first,
          last,
          isCompleted: first.id !== last.id,
          duration: diffMs > 0 ? `${hours}s ${minutes}dq` : "Binoda",
          logs: sorted,
        };
      }).sort((a, b) => new Date(b.day) - new Date(a.day));
    });
    return result;
  }, [students, faceLogs, userToEmp, nameToEmp]);

  if (loading) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen space-y-8 animate-in fade-in duration-500">
      {/* Header Buttons */}
      <div className="flex items-center justify-between">
         <button onClick={() => navigate(-1)} className="group flex items-center gap-2 p-2 px-4 bg-white hover:bg-blue-600 text-slate-400 hover:text-white rounded-2xl shadow-sm border border-slate-100 transition-all active:scale-95">
           <HiOutlineArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
           <span className="text-[10px] font-black uppercase tracking-widest">Orqaga</span>
         </button>

         <button onClick={fetchData} className="p-4 bg-white hover:bg-blue-50 text-blue-600 rounded-2xl shadow-sm border border-blue-100 transition-all active:rotate-180 duration-500">
           <HiOutlineRefresh size={20} />
         </button>
      </div>

      {/* Hero Card */}
      <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-white p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 opacity-50 blur-3xl rounded-full -mr-20 -mt-20" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-200">
            {state?.groupName?.charAt(0)}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">{state?.groupName}</h1>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 uppercase text-[9px] font-black tracking-widest">
                  <HiOutlineUserGroup size={14} />
                  {students.length} Talaba
               </div>
               <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-400 rounded-lg border border-slate-100 uppercase text-[9px] font-black tracking-widest">
                  <FiActivity size={14} />
                  Oylik Hisobot
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm relative z-10 self-start md:self-auto">
          <button onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all">
            <HiOutlineChevronLeft size={20} />
          </button>
          <div className="px-6 text-center min-w-[160px]">
            <span className="block text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Tanlangan Oy</span>
            <span className="font-black text-slate-800 capitalize text-sm">
              {format(currentMonth, "MMMM yyyy", { locale: uz })}
            </span>
          </div>
          <button onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all">
            <HiOutlineChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Student List */}
      <div className="grid grid-cols-1 gap-4">
        {students.length > 0 ? students.map((s) => {
          const name = s.student?.fullname || s.fullname || "Noma'lum";
          const sessions = studentSessions[s.studentId] || [];
          const studentName = (s.student?.fullname || s.fullname || "").trim().toLowerCase();
          const empNo = userToEmp[String(s.studentId)] || nameToEmp[studentName];
          const isOpen = expandedRows[s.studentId];

          return (
            <div key={s.studentId} className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${isOpen ? 'shadow-xl shadow-slate-200 ring-2 ring-blue-100 border-blue-100' : 'border-slate-50 shadow-sm'}`}>
              <div 
                className="flex items-center justify-between px-8 py-6 cursor-pointer hover:bg-blue-50/20 transition-all group"
                onClick={() => toggleRow(s.studentId)}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm uppercase transition-all duration-300 ${isOpen ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-base uppercase tracking-tight leading-none group-hover:text-blue-700 transition-colors">{name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                       <span className="px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">{empNo ? `ID: ${empNo}` : "Face ID yo'q"}</span>
                       <span className={`w-2 h-2 rounded-full ${empNo ? 'bg-emerald-400' : 'bg-rose-300'}`} />
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isOpen ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 border border-slate-100'}`}>
                    {sessions.length} ta dars
                  </div>
                  <HiOutlineChevronDown className={`text-slate-300 group-hover:text-blue-600 transition-all duration-500 scale-150 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </div>
              </div>

              {/* Attendance Table per Student */}
              {isOpen && (
                <div className="p-8 pt-0 animate-in slide-in-from-top-4 duration-500">
                  <div className="bg-slate-50/50 rounded-[1.5rem] border border-slate-50 overflow-hidden">
                    {sessions.length === 0 ? (
                      <div className="py-12 text-center flex flex-col items-center gap-3">
                        <FiCalendar className="text-slate-200" size={48} />
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Yozuv topilmadi</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-[#FBFCFE] border-b border-slate-100">
                            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              <th className="px-10 py-5">Sana</th>
                              <th className="px-10 py-5">Birinchi Kirish</th>
                              <th className="px-10 py-5">Oxirgi Chiqish</th>
                              <th className="px-10 py-5 text-right">Davomiylik</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
                            {sessions.map((session) => (
                              <tr key={session.day} className="hover:bg-white transition-colors group/row">
                                <td className="px-10 py-4 text-slate-400 font-mono">
                                   {format(new Date(session.day), "dd.MM.yyyy")}
                                </td>
                                <td className="px-10 py-4">
                                   <div className="flex items-center gap-2 text-emerald-600 font-black">
                                      <FiClock className="text-emerald-300" />
                                      {format(new Date(session.first.eventTime), "HH:mm")}
                                   </div>
                                </td>
                                <td className="px-10 py-4">
                                  {session.isCompleted ? (
                                    <div className="flex items-center gap-2 text-rose-500 font-black">
                                       <FiClock className="text-rose-200" />
                                       {format(new Date(session.last.eventTime), "HH:mm")}
                                    </div>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black tracking-widest uppercase">Binoda</span>
                                  )}
                                </td>
                                <td className="px-10 py-4 text-right">
                                   <span className="text-blue-600 font-black px-3 py-1 bg-blue-50 rounded-lg">{session.duration}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="py-32 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 shadow-sm">
             <HiOutlineUserGroup className="mx-auto text-slate-200 mb-6" size={60} />
             <p className="text-slate-400 font-black text-xl tracking-wide uppercase">Guruhda talabalar yo'q</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDetails;