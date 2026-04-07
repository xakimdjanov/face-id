import React, { useEffect, useState, useCallback } from "react";
import {
  groupService,
  userService,
  studentGroupService
} from "../../services/api";
import { 
  HiOutlineUserGroup, HiOutlineAcademicCap, 
  HiOutlineCollection, 
  HiOutlineTrendingUp,
  HiOutlineLightningBolt,
  HiOutlineCalendar
} from "react-icons/hi";
import toast from "react-hot-toast";

const ManagerDashboard = () => {
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));

  const [stats, setStats] = useState({
    groups: 0,
    teachers: 0,
    students: 0,
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user.branchId) return;

    try {
      setLoading(true);
      const [groupRes, userRes] = await Promise.all([
        groupService.getAll(),
        userService.getAll()
      ]);

      const allGroups = groupRes?.data?.data || groupRes?.data || [];
      const allUsers = userRes?.data?.data || userRes?.data || [];

      const branchGroups = allGroups.filter(g => Number(g.branchId) === Number(user.branchId));
      
      const branchTeachers = allUsers.filter(
        u => u.role === "teacher" && Number(u.branchId) === Number(user.branchId)
      );

      const studentPromises = branchGroups.map(g => studentGroupService.getById(g.id));
      const studentResults = await Promise.all(studentPromises);
      
      const allStudentEntries = studentResults.flatMap(res => res?.data?.data || res?.data || []);
      const uniqueStudentIds = [...new Set(allStudentEntries.map(s => s.studentId))];

      setStats({
        groups: branchGroups.length,
        teachers: branchTeachers.length,
        students: uniqueStudentIds.length
      });

      setRecentStudents(allStudentEntries.slice(-5).reverse());
      
    } catch (error) {
      console.error("Dashboard error:", error);
      toast.error("Ma'lumotlarni yangilashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [user.branchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Statistikalar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-10">
      
      {/* WELCOME HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200">
             <HiOutlineLightningBolt size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase tracking-tighter">Filial Tahlili</h1>
            <p className="text-slate-500 font-medium mt-1">Xush kelibsiz, <span className="text-blue-600 font-black leading-none">{user.fullname}</span>. Bugungi holat bilan tanishing.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
           <HiOutlineCalendar className="text-blue-500" size={20} />
           <span className="font-bold text-slate-700">{new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Faol guruhlar" 
          value={stats.groups} 
          icon={<HiOutlineCollection size={28}/>} 
          color="bg-blue-600 shadow-blue-100" 
        />
        <StatCard 
          title="O'qituvchilar" 
          value={stats.teachers} 
          icon={<HiOutlineAcademicCap size={28}/>} 
          color="bg-slate-800 shadow-slate-100" 
        />
        <StatCard 
          title="Jami talabalar" 
          value={stats.students} 
          icon={<HiOutlineUserGroup size={28}/>} 
          color="bg-blue-500 shadow-blue-100" 
        />
      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
          <div className="p-10 flex justify-between items-center border-b border-slate-50">
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-1">Yaqinda qo'shilganlar</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Filial bo'yicha oxirgi 5 ta talaba</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
               <HiOutlineTrendingUp size={18} />
               <span className="text-[10px] font-black uppercase tracking-widest">Aktivlik</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Talaba ismi-sharifi</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Telefon raqami</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentStudents.length > 0 ? recentStudents.map((entry, idx) => (
                  <tr key={idx} className="group hover:bg-blue-50/10 transition-all duration-300">
                    <td className="px-10 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-blue-600 flex items-center justify-center font-black text-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {entry.student?.fullname?.charAt(0) || "S"}
                        </div>
                        <span className="text-sm font-black text-slate-700 tracking-tight uppercase">{entry.student?.fullname || "Ismsiz talaba"}</span>
                      </div>
                    </td>
                    <td className="px-10 py-5 text-sm text-slate-500 font-bold">
                      {entry.student?.phone || "Kiritilmagan"}
                    </td>
                    <td className="px-10 py-5 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                         <div className="w-1 h-1 bg-emerald-600 rounded-full animate-pulse" />
                         Faol
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="py-24 text-center">
                       <div className="flex flex-col items-center gap-4">
                          <HiOutlineUserGroup size={60} className="text-slate-100" />
                          <p className="text-slate-400 font-black text-sm uppercase tracking-widest italic">Hozircha ma'lumotlar mavjud emas.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-2xl hover:shadow-blue-200/40 hover:border-blue-100 transition-all duration-500 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-10 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    
    <div className={`w-16 h-16 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg relative z-10 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div className="relative z-10">
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">{title}</p>
      <div className="flex items-baseline gap-1">
        <h2 className="text-3xl font-black text-slate-800 leading-none">{value}</h2>
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">ta</span>
      </div>
    </div>
  </div>
);

export default ManagerDashboard;