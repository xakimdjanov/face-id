import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { studentGroupService, attendanceService } from "../../services/api";
import toast from "react-hot-toast";
import { HiOutlineArrowLeft, HiOutlineChevronLeft, HiOutlineChevronRight, HiCheck, HiX, HiClock } from "react-icons/hi";
import { FiLoader } from "react-icons/fi";

const TeacherListDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const groupId = state?.groupId;

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSelect, setActiveSelect] = useState(null);

  const now = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentMonth, currentYear]);

  // Quick lookup for attendance statuses
  const attendanceMap = useMemo(() => {
    const map = new Map();
    attendance.forEach(att => {
      const dateKey = att.date?.split('T')[0];
      const key = `${att.studentId}-${dateKey}`;
      map.set(key, att.status);
    });
    return map;
  }, [attendance]);

  const fetchData = useCallback(async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      const [studentRes, attRes] = await Promise.all([
        studentGroupService.getById(groupId),
        attendanceService.getAll()
      ]);
      setStudents(studentRes?.data?.data || studentRes?.data || []);
      setAttendance(attRes?.data?.data || attRes?.data || []);
    } catch (error) {
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId) navigate("/teacher/attendance");
    else fetchData();
  }, [groupId, fetchData, navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveSelect(null);
    if (activeSelect) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => window.removeEventListener("click", handleClickOutside);
  }, [activeSelect]);

  const handleMark = async (studentId, day, status) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      toast.error("Cannot mark attendance for future dates");
      return;
    }

    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    try {
      await attendanceService.register({ studentId, groupId, status, date: dateString });
      toast.success("Saved");
      setActiveSelect(null);
      
      setAttendance(prev => {
        const filtered = prev.filter(a => !(Number(a.studentId) === Number(studentId) && a.date.startsWith(dateString)));
        return [...filtered, { studentId, status, date: dateString }];
      });
    } catch (error) {
      toast.error("Failed to save");
    }
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-slate-50 gap-4">
      <FiLoader className="w-12 h-12 animate-spin text-indigo-600" />
      <p className="text-slate-400 font-bold animate-pulse">Loading Journal...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[100vw] min-h-screen bg-[#f8fafc]">
      {/* Navigation */}
      <button 
        onClick={() => navigate(-1)} 
        className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 mb-8 font-bold transition-all"
      >
        <div className="p-2 rounded-xl bg-white shadow-sm group-hover:bg-indigo-50 transition-all">
          <HiOutlineArrowLeft size={18} />
        </div>
        Back to Groups
      </button>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 font-black text-2xl uppercase">
            {state?.groupName?.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-none mb-2">{state?.groupName}</h1>
            <p className="text-slate-400 font-medium flex items-center gap-2 text-sm">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              Attendance Journal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-[1.5rem] border border-slate-100">
          <button 
            onClick={(e) => { e.stopPropagation(); setCurrentMonth(m => m === 0 ? 11 : m - 1); }}
            className="p-3 bg-white rounded-2xl shadow-sm hover:text-indigo-600 transition-all active:scale-90"
          >
            <HiOutlineChevronLeft size={20} />
          </button>
          <div className="px-6 text-center">
            <span className="block font-black text-slate-800 uppercase tracking-tighter text-sm">
              {monthNames[currentMonth]}
            </span>
            <span className="text-[10px] font-bold text-slate-400">{currentYear}</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setCurrentMonth(m => m === 11 ? 0 : m + 1); }}
            className="p-3 bg-white rounded-2xl shadow-sm hover:text-indigo-600 transition-all active:scale-90"
          >
            <HiOutlineChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-visible">
        <div className="overflow-x-auto scrollbar-hide pb-32">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase sticky left-0 bg-slate-50 z-40 border-r border-slate-100 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.05)]">
                  Student Name
                </th>
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const isToday = now.getDate() === day && now.getMonth() === currentMonth && now.getFullYear() === currentYear;
                  const isFuture = new Date(currentYear, currentMonth, day) > now;
                  return (
                    <th key={i} className={`px-2 py-6 text-[10px] font-black text-center min-w-[50px]
                      ${isToday ? 'bg-indigo-50 text-indigo-600' : isFuture ? 'text-slate-200' : 'text-slate-400'}`}>
                      {day}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student, sIdx) => (
                <tr key={student.id} className="group hover:bg-slate-50/50">
                  <td className="px-8 py-4 font-bold text-slate-700 whitespace-nowrap sticky left-0 bg-white z-30 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.05)] border-r border-slate-50 group-hover:bg-slate-50 text-sm">
                    <span className="text-[10px] text-slate-300 mr-2 font-mono">{sIdx + 1}.</span>
                    {student.student?.fullname}
                  </td>
                  {[...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1;
                    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const status = attendanceMap.get(`${student.studentId}-${dateKey}`);
                    const isActive = activeSelect === `${student.id}-${day}`;
                    const isToday = now.getDate() === day && now.getMonth() === currentMonth && now.getFullYear() === currentYear;
                    const isFuture = new Date(currentYear, currentMonth, day) > now;

                    return (
                      <td key={i} className={`p-1 relative border-l border-slate-50/50 ${isToday ? 'bg-indigo-50/30' : ''}`}>
                        <button 
                          disabled={isFuture}
                          onClick={(e) => { e.stopPropagation(); setActiveSelect(isActive ? null : `${student.id}-${day}`); }}
                          className={`w-9 h-9 rounded-xl mx-auto flex items-center justify-center transition-all duration-300
                            ${isFuture ? 'opacity-10 cursor-not-allowed bg-transparent' : 'active:scale-90 cursor-pointer'}
                            ${status === 'present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 
                              status === 'absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 
                              status === 'late' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 
                              !isFuture ? 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-400' : ''}
                          `}
                        >
                          <span className="text-[10px] font-black italic">
                            {status === 'present' ? 'P' : status === 'absent' ? 'A' : status === 'late' ? 'L' : ''}
                          </span>
                        </button>

                        {isActive && !isFuture && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[100] bg-white border border-slate-100 shadow-2xl rounded-[1.2rem] p-1.5 flex flex-col gap-0.5 min-w-[110px] animate-in slide-in-from-top-2 duration-200"
                          >
                            <StatusBtn icon={<HiCheck />} label="Present" color="text-emerald-600" hover="hover:bg-emerald-50" onClick={() => handleMark(student.studentId, day, "present")} />
                            <StatusBtn icon={<HiX />} label="Absent" color="text-rose-600" hover="hover:bg-rose-50" onClick={() => handleMark(student.studentId, day, "absent")} />
                            <StatusBtn icon={<HiClock />} label="Late" color="text-amber-600" hover="hover:bg-amber-50" onClick={() => handleMark(student.studentId, day, "late")} />
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
      <div className="mt-8 flex flex-wrap gap-4 items-center">
        <LegendItem color="bg-emerald-500" label="Present (P)" />
        <LegendItem color="bg-rose-500" label="Absent (A)" />
        <LegendItem color="bg-amber-500" label="Late (L)" />
        <div className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-6 py-3 rounded-full border border-slate-100 shadow-sm">
          Total Students: {students.length}
        </div>
      </div>
    </div>
  );
};

const StatusBtn = ({ icon, label, color, hover, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-2.5 px-3 py-2 ${hover} ${color} rounded-lg text-[10px] font-black transition-colors w-full`}>
    {React.cloneElement(icon, { size: 14 })} {label}
  </button>
);

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
    <div className={`w-2.5 h-2.5 ${color} rounded-full`}></div>
    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{label}</span>
  </div>
);

export default TeacherListDetails;