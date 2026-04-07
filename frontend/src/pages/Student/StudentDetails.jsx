import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { attendanceFaceService, studentGroupService, employeeService } from "../../services/api";
import { 
  HiOutlineArrowLeft,
  HiOutlineUsers,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineRefresh
} from "react-icons/hi";
import { FiLoader, FiClock, FiActivity } from "react-icons/fi";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isSameDay } from "date-fns";
import { uz } from "date-fns/locale";
import toast from "react-hot-toast";

const StudentDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const groupNameFromState = location.state?.groupName;
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const myStudentId = user.id;

  const [faceLogs, setFaceLogs] = useState([]);
  const [groupRoster, setGroupRoster] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      const [faceRes, rosterRes, empRes] = await Promise.all([
        attendanceFaceService.getAll({ startDate: start, endDate: end, limit: 5000 }),
        studentGroupService.getById(groupId),
        employeeService.getAll()
      ]);

      setFaceLogs(faceRes?.data?.data || faceRes?.data || []);
      setGroupRoster(rosterRes?.data?.data || rosterRes?.data || []);
      setEmployees(empRes?.data?.data || empRes?.data || []);
    } catch (error) {
      console.error("Xatolik:", error);
      toast.error("Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [groupId, currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Map UserID to EmployeeNo for roster
  const userToEmp = useMemo(() => {
    const map = {};
    employees.forEach(e => { if (e.userId) map[String(e.userId)] = e.employeeNo; });
    return map;
  }, [employees]);

  // Days in month
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Yuklanmoqda...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-white hover:bg-blue-600 text-slate-400 hover:text-white rounded-2xl shadow-sm border border-slate-100 transition-all active:scale-90 group">
             <HiOutlineArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none mb-1.5">
              {groupNameFromState || "Guruh Jurnali"}
            </h1>
            <div className="flex items-center gap-2">
               <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 uppercase text-[9px] font-black tracking-widest">
                  <HiOutlineUsers size={14} />
                  {groupRoster.length} Talaba
               </span>
               <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-400 rounded-lg border border-slate-100 uppercase text-[9px] font-black tracking-widest">
                  <FiActivity size={14} />
                  Face-ID Jurnal
               </span>
            </div>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all active:scale-90 shadow-sm">
            <HiOutlineChevronLeft size={20} />
          </button>
          <div className="px-6 text-center min-w-[140px]">
            <span className="block text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-0.5">Oyni tanlang</span>
            <span className="font-black text-slate-800 capitalize text-sm">
               {format(currentMonth, "MMMM yyyy", { locale: uz })}
            </span>
          </div>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all active:scale-90 shadow-sm">
            <HiOutlineChevronRight size={20} />
          </button>
          <button onClick={fetchData} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:rotate-180 duration-500">
             <HiOutlineRefresh size={18} />
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar pb-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FBFCFE]">
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sticky left-0 bg-[#FBFCFE] z-40 border-r border-slate-100/50 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.02)] min-w-[220px]">Talaba F.I.SH</th>
                {days.map(day => (
                  <th key={day.toString()} className={`px-2 py-6 text-center border-l border-slate-100/30 min-w-[55px] ${isSameDay(day, new Date()) ? 'bg-blue-50/50' : ''}`}>
                    <div className="flex flex-col items-center">
                      <span className={`text-[9px] font-black uppercase tracking-tighter mb-1 ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-slate-300'}`}>
                        {format(day, "eee", { locale: uz })}
                      </span>
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500'}`}>
                        {format(day, "d")}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {groupRoster.map((item) => {
                const student = item.student || {};
                const isMe = student.id === myStudentId;
                const employeeNo = userToEmp[String(student.id)];

                return (
                  <tr key={item.id} className={`${isMe ? 'bg-blue-50/30' : 'hover:bg-blue-50/10'} group transition-all`}>
                    <td className={`px-10 py-5 sticky left-0 z-30 border-r border-slate-50 group-hover:bg-[#F8FBFF] shadow-[4px_0_10px_-5px_rgba(0,0,0,0.03)] transition-all ${isMe ? 'bg-blue-50/50' : 'bg-white'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs uppercase shadow-inner ${isMe ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                          {student.fullname?.charAt(0) || "S"}
                        </div>
                        <div>
                           <p className={`font-black text-sm uppercase tracking-tight leading-none ${isMe ? 'text-blue-700' : 'text-slate-700'}`}>
                             {student.fullname || "Noma'lum"}
                           </p>
                           {isMe && <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md uppercase tracking-widest mt-1.5 inline-block">Siz</span>}
                        </div>
                      </div>
                    </td>

                    {days.map(day => {
                      const dateKey = format(day, "yyyy-MM-dd");
                      const hasLogs = faceLogs.some(log => 
                        log.employeeNo === employeeNo && 
                        log.eventTime.startsWith(dateKey)
                      );

                      return (
                        <td key={day.toString()} className={`p-1 border-l border-slate-50/50 ${isSameDay(day, new Date()) ? 'bg-blue-50/10' : ''}`}>
                          {hasLogs ? (
                            <div className="w-10 h-10 rounded-[1.25rem] mx-auto flex items-center justify-center bg-emerald-500 text-white shadow-lg shadow-emerald-100 animate-in zoom-in duration-300">
                               <span className="text-[11px] font-black italic">K</span>
                            </div>
                          ) : (
                            <div className="w-1.5 h-1.5 bg-slate-100 rounded-full mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-center gap-8">
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-[1.25rem] border border-slate-100 shadow-sm">
          <div className="w-3 h-3 bg-emerald-500 rounded-lg shadow-sm"></div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">Kelgan (Face-ID)</span>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-[1.25rem] border border-slate-100 shadow-sm">
          <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">Ma'lumot yo'q</span>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;