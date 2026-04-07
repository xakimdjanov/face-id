import React, { useEffect, useState, useCallback } from "react";
import { groupService, studentGroupService, attendanceFaceService } from "../../services/api";
import toast from "react-hot-toast";
import { FiUsers, FiBookOpen, FiCheckCircle, FiXCircle, FiClock, FiActivity, FiChevronRight } from "react-icons/fi";
import { HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlinePresentationChartBar } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

const TeacherDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    groups: 0,
    students: 0,
    present: 0,
    absent: 0
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Face-ID loglarini olish (faqat bugun uchun stats hisoblash uchun)
      const today = new Date().toISOString().split("T")[0];
      
      const [groupRes, faceRes] = await Promise.all([
        groupService.getAll(),
        attendanceFaceService.getAll({ startDate: today, limit: 5000 })
      ]);

      const groupData = groupRes?.data?.data || groupRes?.data || [];
      const faceLogs = faceRes?.data?.data || faceRes?.data || [];
      
      const teacherGroups = groupData.filter(g => Number(g.teacherId) === Number(user.id));
      setGroups(teacherGroups);

      let studentList = [];
      const groupIds = teacherGroups.map(g => g.id);
      
      const studentPromises = groupIds.map(id => studentGroupService.getById(id));
      const studentResults = await Promise.all(studentPromises);
      
      studentResults.forEach(res => {
        const data = res?.data?.data || res?.data || [];
        studentList = [...studentList, ...data];
      });
      setStudents(studentList);

      // Statistika: Face-ID bo'yicha bugun kelganlar (unikal employeeNo)
      const presentCount = new Set(faceLogs.map(log => log.employeeNo)).size;

      setStats({
        groups: teacherGroups.length,
        students: studentList.length,
        present: presentCount,
        absent: Math.max(0, studentList.length - presentCount)
      });

    } catch (error) {
      console.error("Dashboard error:", error);
      toast.error("Ma'lumotlarni yangilashda xato!");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-white shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Jonli Tahlil</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">O'qituvchi Paneli</h1>
          <p className="text-slate-500 font-medium">Xush kelibsiz, <span className="text-blue-600 font-bold">{user.fullname}</span>!</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Bugungi Sana</p>
              <p className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
           </div>
           <div className="p-4 bg-blue-600 rounded-[1.5rem] shadow-xl shadow-blue-200 text-white">
             <HiOutlinePresentationChartBar size={24} />
           </div>
        </div>
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Guruhlarim" value={stats.groups} icon={<FiBookOpen />} color="blue" />
        <StatCard title="Jami Talabalar" value={stats.students} icon={<FiUsers />} color="slate" />
        <StatCard title="Bugun Kelganlar" value={stats.present} icon={<FiCheckCircle />} color="emerald" />
        <StatCard title="Kelmaganlar" value={stats.absent} icon={<FiXCircle />} color="rose" />
      </div>

      {/* MY GROUPS SECTION */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Guruhlarim</h2>
           <button onClick={fetchData} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-blue-600">
              <FiActivity size={18} />
           </button>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#FBFCFE]">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  <th className="px-8 py-6">Guruh Nomi</th>
                  <th className="px-8 py-6">Yo'nalish</th>
                  <th className="px-8 py-6 text-center">Dars Vaqti</th>
                  <th className="px-8 py-6 text-center">Talabalar</th>
                  <th className="px-8 py-6 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {groups.length > 0 ? groups.map((g) => {
                  const count = students.filter(s => Number(s.groupId) === Number(g.id)).length;
                  return (
                    <tr key={g.id} className="group hover:bg-blue-50/20 transition-all">
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                               {g.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-700">{g.name}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                          {g.course?.name || "Asosiy"}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-500 font-bold text-xs bg-slate-50 py-2 px-3 rounded-xl mx-auto w-fit">
                          <FiClock className="text-blue-500" />
                          {g.startTime} — {g.endTime}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="text-slate-800 font-black text-sm">{count}</span>
                        <span className="text-[10px] text-slate-400 font-bold ml-1 tracking-tighter">ta</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => navigate("/teacher/deatils", { state: { groupId: g.id, groupName: g.name } })}
                          className="inline-flex items-center gap-2 p-3 bg-slate-50 hover:bg-blue-600 text-slate-400 hover:text-white rounded-2xl transition-all active:scale-95 border border-slate-100 shadow-sm"
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Jurnal</span>
                          <FiChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                       <div className="flex flex-col items-center gap-3">
                          <HiOutlineAcademicCap size={60} className="text-slate-200" />
                          <p className="text-slate-400 font-black text-sm uppercase tracking-widest">Hozircha guruhlar yo'q</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for Stats
const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: "bg-blue-600 text-blue-600 border-blue-100 shadow-blue-100",
    slate: "bg-slate-800 text-slate-800 border-slate-100 shadow-slate-100",
    emerald: "bg-emerald-500 text-emerald-500 border-emerald-100 shadow-emerald-100",
    rose: "bg-rose-500 text-rose-500 border-rose-100 shadow-rose-100",
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-6 group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 cursor-default relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl bg-opacity-10 shadow-lg ${colors[color]} relative z-10 group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">{title}</p>
        <div className="flex items-baseline gap-1">
          <h2 className="text-3xl font-black text-slate-800 leading-none">{value}</h2>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;