import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { studentGroupService, attendanceFaceService, employeeService } from "../../services/api";
import toast from "react-hot-toast";
import { HiOutlineArrowLeft, HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";
import { FiLoader, FiActivity } from "react-icons/fi";

const TeacherListDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const groupId = state?.groupId;

  const [students, setStudents] = useState([]);
  const [faceLogs, setFaceLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSelect, setActiveSelect] = useState(null); // Used only for viewing details now

  const now = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const monthNames = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
  ];

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentMonth, currentYear]);

  const faceActivityMap = useMemo(() => {
    const map = new Map();
    if (!faceLogs.length || !employees.length) return { activity: map, userToEmp: {} };

    const userToEmp = {};
    employees.forEach(e => { if (e.userId) userToEmp[e.userId] = e.employeeNo; });

    faceLogs.forEach(log => {
      const dateKey = log.eventTime?.split('T')[0];
      const key = `${log.employeeNo}-${dateKey}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(log);
    });

    return { activity: map, userToEmp };
  }, [faceLogs, employees]);

  const fetchData = useCallback(async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      const start = new Date(currentYear, currentMonth, 1).toISOString();
      const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

      const [studentRes, faceRes, empRes] = await Promise.all([
        studentGroupService.getById(groupId),
        attendanceFaceService.getAll({ startDate: start, endDate: end, limit: 2000 }),
        employeeService.getAll()
      ]);

      setStudents(studentRes?.data?.data || studentRes?.data || []);
      setFaceLogs(faceRes?.data?.data || faceRes?.data || []);
      setEmployees(empRes?.data?.data || empRes?.data || []);
    } catch (error) {
       toast.error("Ma'lumotlarni yuklashda xatolik!");
    } finally {
      setLoading(false);
    }
  }, [groupId, currentMonth, currentYear]);

  useEffect(() => {
    if (!groupId) navigate("/teacher/attendance");
    else fetchData();
  }, [groupId, fetchData, navigate]);

  useEffect(() => {
    const handleClickOutside = () => setActiveSelect(null);
    if (activeSelect) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => window.removeEventListener("click", handleClickOutside);
  }, [activeSelect]);

  if (loading) return (
    <div className="flex flex-col h-[80vh] items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Jurnal yuklanmoqda...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-full overflow-hidden min-h-screen space-y-8 animate-in fade-in duration-500">
      {/* Navigation & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-sm">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="p-4 bg-white hover:bg-blue-600 text-slate-400 hover:text-white rounded-2xl shadow-sm border border-slate-100 transition-all active:scale-90 group">
              <HiOutlineArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
           </button>
           <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-100 font-black text-2xl uppercase">
                {state?.groupName?.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none mb-1.5">{state?.groupName}</h1>
                <p className="text-slate-400 font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Face ID Avtomatik Jurnal
                </p>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-start md:self-auto">
          <button 
            onClick={(e) => { e.stopPropagation(); setCurrentMonth(m => m === 0 ? 11 : m - 1); fetchData(); }}
            className="p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all active:scale-90 shadow-sm"
          >
            <HiOutlineChevronLeft size={20} />
          </button>
          <div className="px-6 text-center min-w-[140px]">
            <span className="block font-black text-slate-800 uppercase tracking-tighter text-xs">
              {monthNames[currentMonth]}
            </span>
            <span className="text-[10px] font-black text-blue-400 tracking-widest leading-none">{currentYear}</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setCurrentMonth(m => m === 11 ? 0 : m + 1); fetchData(); }}
            className="p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all active:scale-90 shadow-sm"
          >
            <HiOutlineChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar pb-32">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FBFCFE]">
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sticky left-0 bg-[#FBFCFE] z-40 border-r border-slate-100/50 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.02)] min-w-[200px]">
                  Talaba Ism-Sharifi
                </th>
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const d = new Date(currentYear, currentMonth, day);
                  const isToday = now.getDate() === day && now.getMonth() === currentMonth && now.getFullYear() === currentYear;
                  const isFuture = d > now;
                  const dayName = d.toLocaleDateString('uz-UZ', { weekday: 'short' });

                  return (
                    <th key={i} className={`px-2 py-6 text-center border-l border-slate-100/30 group/th min-w-[55px] ${isToday ? 'bg-blue-50/50' : ''}`}>
                       <p className={`text-[10px] font-black uppercase tracking-tighter mb-1 transition-colors ${isToday ? 'text-blue-600' : isFuture ? 'text-slate-200' : 'text-slate-300'}`}>
                          {dayName}
                       </p>
                       <div className={`w-8 h-8 rounded-xl mx-auto flex items-center justify-center text-[11px] font-black transition-all ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : isFuture ? 'text-slate-200' : 'text-slate-500'}`}>
                          {day}
                       </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student, sIdx) => (
                <tr key={student.id} className="group hover:bg-blue-50/10">
                  <td className="px-10 py-5 font-black text-slate-700 whitespace-nowrap sticky left-0 bg-white z-30 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.03)] border-r border-slate-50 group-hover:bg-[#F8FBFF] transition-all">
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] text-slate-300 font-mono tracking-tighter">{String(sIdx + 1).padStart(2, '0')}.</span>
                       <span className="text-sm uppercase tracking-tight">{student.student?.fullname || student.fullname}</span>
                    </div>
                  </td>
                  {[...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1;
                    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isActive = activeSelect === `${student.id}-${day}`;
                    const isToday = now.getDate() === day && now.getMonth() === currentMonth && now.getFullYear() === currentYear;
                    const isFuture = new Date(currentYear, currentMonth, day) > now;

                    const logs = faceActivityMap.activity?.get(`${faceActivityMap.userToEmp[student.studentId]}-${dateKey}`);
                    const isPresent = logs && logs.length > 0;

                    return (
                      <td key={i} className={`p-1 position-relative border-l border-slate-50/50 ${isToday ? 'bg-blue-50/20' : ''}`}>
                        <button 
                          disabled={isFuture || !isPresent}
                          onClick={(e) => { e.stopPropagation(); if(isPresent) setActiveSelect(isActive ? null : `${student.id}-${day}`); }}
                          className={`w-10 h-10 rounded-[1.25rem] mx-auto flex items-center justify-center transition-all duration-300 relative border-2
                            ${isFuture ? 'opacity-5 cursor-not-allowed border-transparent' : isPresent ? 'cursor-pointer' : 'cursor-default border-transparent'}
                            ${isPresent ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' : 
                              !isFuture ? 'bg-slate-50 border-slate-100 text-slate-200' : ''}
                          `}
                        >
                          <span className="text-[11px] font-black italic">
                            {isPresent ? 'K' : !isFuture ? '' : ''}
                          </span>
                        </button>

                        {isActive && isPresent && !isFuture && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[100] bg-white border border-slate-100 shadow-2xl rounded-[2rem] p-4 flex flex-col gap-1 min-w-[160px] animate-in zoom-in-95 duration-200"
                          >
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                               <FiActivity size={12} />Face ID Skan
                            </p>
                            
                            {(() => {
                               const sorted = [...logs].sort((a,b) => new Date(a.eventTime) - new Date(b.eventTime));
                               const first = sorted[0];
                               const last = sorted[sorted.length - 1];
                               const duration = new Date(last.eventTime) - new Date(first.eventTime);
                               const h = Math.floor(duration / 3600000);
                               const m = Math.floor((duration % 3600000) / 60000);

                               return (
                                 <div className="space-y-2">
                                    <div className="space-y-1">
                                       <div className="flex justify-between text-[10px] font-bold text-slate-400"><span>Kirish:</span> <span className="text-emerald-600">{new Date(first.eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                                       <div className="flex justify-between text-[10px] font-bold text-slate-400"><span>Chiqish:</span> <span className="text-rose-500">{new Date(last.eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                                       {duration > 0 && (
                                         <div className="text-[9px] font-black text-blue-600 uppercase tracking-tight bg-blue-50 py-1.5 rounded-lg text-center mt-2 border border-blue-100">
                                            {h}s {m}m binoda bo'ldi
                                         </div>
                                       )}
                                    </div>
                                    <p className="text-[8px] text-slate-300 font-bold uppercase text-center mt-1">Jami: {logs.length} ta skan</p>
                                 </div>
                               );
                            })()}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-6 px-4">
        <div className="flex flex-wrap gap-4 items-center">
            <LegendItem color="bg-emerald-500 shadow-emerald-200" label="Keldi (K)" />
            <LegendItem color="bg-slate-100 border-slate-200" label="Yozuv yo'q" />
            <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 px-4 py-2 rounded-2xl">
               <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse shadow-sm shadow-blue-400"></div>
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Face ID Avtomatik Rejim</span>
            </div>
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-8 py-3 rounded-full border border-slate-100 shadow-sm flex items-center gap-4">
           Guruh talabalari: <span className="text-slate-800 text-sm font-black">{students.length} ta</span>
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-[1.25rem] border border-slate-100 shadow-sm group hover:border-blue-100 transition-colors">
    <div className={`w-3 h-3 ${color} rounded-lg shadow-sm`}></div>
    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{label}</span>
  </div>
);

export default TeacherListDetails;