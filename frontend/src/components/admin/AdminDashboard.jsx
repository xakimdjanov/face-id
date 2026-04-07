import React, { useEffect, useState, useCallback } from 'react';
import { 
  HiOutlineUsers, 
  HiOutlineAcademicCap,
  HiOutlineViewGrid,
  HiOutlinePlusCircle,
  HiOutlineBookOpen,
  HiOutlineUserCircle,
  HiOutlineArrowRight
} from "react-icons/hi";
import { userService, groupService, courseService } from "../../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    studentsCount: 0,
    groupsCount: 0,
    teachersCount: 0,
    coursesCount: 0
  });
  const [recentTeachers, setRecentTeachers] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    if (!user.branchId) return;
    setLoading(true);
    try {
      const [uRes, gRes, cRes] = await Promise.all([
        userService.getAll(),
        groupService.getAll(),
        courseService.getAll()
      ]);

      const usersData = uRes?.data?.data || uRes?.data || [];
      const groupsData = gRes?.data?.data || gRes?.data || [];
      const coursesData = cRes?.data?.data || cRes?.data || [];

      const branchStudents = usersData.filter(u => u.role === 'student' && Number(u.branchId) === Number(user.branchId));
      const branchTeachers = usersData.filter(u => u.role === 'teacher' && Number(u.branchId) === Number(user.branchId));
      const branchGroups = groupsData.filter(g => Number(g.branchId) === Number(user.branchId));
      const branchCourses = coursesData.filter(c => Number(c.branchId) === Number(user.branchId));

      setStats({
        studentsCount: branchStudents.length,
        groupsCount: branchGroups.length,
        teachersCount: branchTeachers.length,
        coursesCount: branchCourses.length
      });

      setRecentTeachers(branchTeachers.slice(0, 5));
    } catch (error) {
      toast.error("Ma'lumotlarni yuklab bo'lmadi");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user.branchId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    { label: "Jami talabalar", value: stats.studentsCount, icon: <HiOutlineUsers size={32} />, color: "blue", path: "/admin/students" },
    { label: "Faol guruhlar", value: stats.groupsCount, icon: <HiOutlineAcademicCap size={32} />, color: "amber", path: "/admin/groups" },
    { label: "O'qituvchilar", value: stats.teachersCount, icon: <HiOutlineUserCircle size={32} />, color: "emerald", path: "/admin/teachers" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#f8fafc] min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">
            Xush kelibsiz, <span className="text-blue-600">{user.fullname || 'Administrator'}</span>
          </h1>
          <p className="text-gray-400 text-sm font-medium italic mt-1">
            Filialning bugungi statistik ko'rsatkichlari va boshqaruv paneli.
          </p>
        </div>
        <div className="relative z-10 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 shadow-sm">
           <span className="text-sm font-black text-blue-600 uppercase tracking-widest">
             {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
           </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div 
            key={i}
            onClick={() => navigate(card.path)}
            className="bg-white p-8 rounded-[2rem] border border-gray-100 cursor-pointer group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${card.color}-50 rounded-bl-full opacity-50 -mr-12 -mt-12`}></div>
            <div className="flex flex-col gap-6 relative z-10">
                <div className={`w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center`}>
                   <div className={`text-${card.color}-600`}>{card.icon}</div>
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{card.label}</p>
                    <h3 className="text-3xl font-black text-gray-800 tracking-tighter">{card.value}</h3>
                </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <HiOutlineViewGrid size={20} />
                  </div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em]">Tezkor amallar</h3>
                </div>
                <div className="space-y-4">
                    <button 
                      onClick={() => navigate('/admin/students')}
                      className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-blue-600 text-gray-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all group border border-gray-100 hover:border-blue-600"
                    >
                        <span>Talaba qo'shish</span>
                        <HiOutlinePlusCircle size={20} className="text-blue-600 group-hover:text-white transition-colors" />
                    </button>
                    <button 
                      onClick={() => navigate('/admin/groups')}
                      className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-blue-600 text-gray-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all group border border-gray-100 hover:border-blue-600"
                    >
                        <span>Yangi guruh ochish</span>
                        <HiOutlinePlusCircle size={20} className="text-blue-600 group-hover:text-white transition-colors" />
                    </button>
                    <button 
                      onClick={() => navigate('/admin/teachers')}
                      className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-blue-600 text-gray-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all group border border-gray-100 hover:border-blue-600"
                    >
                        <span>O'qituvchi qo'shish</span>
                        <HiOutlinePlusCircle size={20} className="text-blue-600 group-hover:text-white transition-colors" />
                    </button>
                </div>
            </div>
          </div>

          {/* Recent Teachers */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <HiOutlineUserCircle size={20} />
                    </div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em]">O'qituvchilar tarkibi</h3>
                  </div>
                  <button 
                    onClick={() => navigate('/admin/teachers')}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
                  >
                    Barchasi <HiOutlineArrowRight size={14} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-50">
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ism sharifi</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Telefon</th>
                          <th className="py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Holat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {recentTeachers.length === 0 ? (
                          <tr><td colSpan="3" className="py-10 text-center text-gray-400 font-bold italic">O'qituvchilar mavjud emas</td></tr>
                        ) : recentTeachers.map((teacher, i) => (
                          <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                                  {teacher.fullname?.charAt(0)}
                                </div>
                                <span className="font-bold text-gray-700 text-sm">{teacher.fullname}</span>
                              </div>
                            </td>
                            <td className="py-4 text-xs font-bold text-gray-500">{teacher.phone}</td>
                            <td className="py-4 text-right">
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">Faol</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
            </div>
          </div>
      </div>

    </div>
  );
};

export default AdminDashboard;