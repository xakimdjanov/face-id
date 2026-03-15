import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { attendanceService, paymentService } from "../../services/api";
import { 
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineCash,
  HiOutlineUsers,
  HiChevronLeft,
  HiChevronRight
} from "react-icons/hi";
import { FiLoader } from "react-icons/fi";
import toast from "react-hot-toast";

const StudentDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const groupNameFromState = location.state?.groupName;
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const myStudentId = user.id;

  const [attendanceData, setAttendanceData] = useState([]);
  const [myPayments, setMyPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Oyni boshqarish uchun state (Default: joriy sana)
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [attRes, payRes] = await Promise.all([
        attendanceService.getAll(),
        paymentService.getAll()
      ]);

      const allAtt = attRes?.data?.data || attRes?.data || [];
      const allPay = payRes?.data?.data || payRes?.data || [];

      setAttendanceData(allAtt.filter(a => Number(a.groupId) === Number(groupId)));
      setMyPayments(allPay.filter(p => 
        Number(p.studentId) === Number(myStudentId) && Number(p.groupId) === Number(groupId)
      ));
    } catch (error) {
      console.error("Xatolik:", error);
      toast.error("Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [groupId, myStudentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tanlangan oy bo'yicha sanalarni filtrlaymiz
  const filteredDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const dates = attendanceData
      .map(a => a.date)
      .filter(dateStr => {
        const d = new Date(dateStr);
        return d.getFullYear() === year && d.getMonth() === month;
      });

    return [...new Set(dates)].sort((a, b) => new Date(a) - new Date(b));
  }, [attendanceData, currentDate]);

  // Talabalar ro'yxati
  const students = useMemo(() => {
    const studentMap = {};
    attendanceData.forEach(item => {
      if (item.student) studentMap[item.student.id] = item.student.fullname;
    });
    return Object.entries(studentMap).map(([id, fullname]) => ({ id: Number(id), fullname }));
  }, [attendanceData]);

  const isPaid = useMemo(() => myPayments.some(p => p.status === "paid"), [myPayments]);

  // Oyni o'zgartirish funksiyalari
  const changeMonth = (offset) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <FiLoader className="w-10 h-10 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[98%] mx-auto min-h-screen bg-slate-50 font-sans">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 font-bold mb-3 text-sm hover:translate-x-[-4px] transition-transform">
            <HiOutlineArrowLeft size={18} /> BACK
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <HiOutlineUsers size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                {attendanceData[0]?.group?.name || groupNameFromState || "Group Journal"}
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attendance tracking</p>
            </div>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-indigo-600">
            <HiChevronLeft size={24} />
          </button>
          <div className="px-6 text-center min-w-[150px]">
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Selected Month</p>
            <p className="text-sm font-black text-slate-700">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-indigo-600">
            <HiChevronRight size={24} />
          </button>
        </div>

        {/* My Payment status badge */}
        <div className={`flex items-center gap-4 px-6 py-4 rounded-3xl border-2 transition-all ${
          isPaid ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
        }`}>
          <HiOutlineCash size={24} />
          <div>
            <p className="text-[10px] font-black uppercase opacity-60">My Payment</p>
            <p className="text-sm font-black">{isPaid ? "PAID" : "UNPAID"}</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-white z-20 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">Student Name</th>
                {filteredDates.length > 0 ? filteredDates.map(date => (
                  <th key={date} className="p-4 text-center border-l border-slate-100 min-w-[80px]">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-slate-400 mb-1">
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="text-sm font-black text-indigo-600">
                        {new Date(date).getDate()}
                      </span>
                    </div>
                  </th>
                )) : (
                   <th className="p-6 text-center text-slate-400 text-xs font-medium">No records for this month</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((st) => {
                const isMe = st.id === myStudentId;
                return (
                  <tr key={st.id} className={`${isMe ? 'bg-indigo-50/40' : 'hover:bg-slate-50/30'} transition-colors`}>
                    <td className={`p-6 sticky left-0 z-10 ${isMe ? 'bg-indigo-50' : 'bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${isMe ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                          {st.fullname.charAt(0)}
                        </div>
                        <span className={`font-bold text-sm tracking-tight ${isMe ? 'text-indigo-700' : 'text-slate-600'}`}>
                          {st.fullname} {isMe && <span className="ml-1 text-[10px] bg-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded-md">YOU</span>}
                        </span>
                      </div>
                    </td>

                    {filteredDates.map(date => {
                      const record = attendanceData.find(a => a.studentId === st.id && a.date === date);
                      return (
                        <td key={date} className="p-4 text-center border-l border-slate-50">
                          {record?.status === 'present' ? (
                            <HiOutlineCheckCircle className="mx-auto text-emerald-500" size={24} />
                          ) : record?.status === 'late' ? (
                            <HiOutlineClock className="mx-auto text-amber-500" size={24} />
                          ) : record?.status === 'absent' ? (
                            <HiOutlineXCircle className="mx-auto text-rose-500" size={24} />
                          ) : (
                            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full mx-auto"></div>
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
      
      {/* Legend */}
      <div className="mt-6 flex justify-center gap-8">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <HiOutlineCheckCircle className="text-emerald-500" size={16} /> Present
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <HiOutlineClock className="text-amber-500" size={16} /> Late
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <HiOutlineXCircle className="text-rose-500" size={16} /> Absent
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;