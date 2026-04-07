import React, { useEffect, useState } from "react";
import { branchService, userService } from "../../services/api";
import { 
  HiOutlineOfficeBuilding, 
  HiOutlineAcademicCap, 
  HiOutlineUserGroup, 
  HiOutlineShieldCheck,
  HiOutlineTrendingUp
} from "react-icons/hi";
import { CgSpinner } from "react-icons/cg";
import {Link} from "react-router-dom"

const SuperDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    managers: 0,
    admins: 0,
  });

  const fetchData = async () => {
    try {
      const [branchRes, userRes] = await Promise.all([
        branchService.getAll(),
        userService.getAll()
      ]);

      setBranches(branchRes.data || []);
      setUsers(userRes.data || []);

      const data = userRes.data || [];
      setStats({
        students: data.filter(u => u.role === "student").length,
        teachers: data.filter(u => u.role === "teacher").length,
        managers: data.filter(u => u.role === "manager").length,
        admins: data.filter(u => u.role === "admin" || u.role === "superadmin").length,
      });
    } catch (error) {
      console.error("Dashboard data error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statCards = [
    { label: "Barcha filiallar", value: branches.length, icon: HiOutlineOfficeBuilding, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "O'quvchilar", value: stats.students, icon: HiOutlineUserGroup, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "O'qituvchilar", value: stats.teachers, icon: HiOutlineAcademicCap, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Filial rahbarlari", value: stats.managers, icon: HiOutlineShieldCheck, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <CgSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Tizim holati</h1>
          <p className="text-gray-500 mt-1 font-medium italic">Xush kelibsiz! Bugungi asosiy ko'rsatkichlar bilan tanishing.</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                <card.icon size={24} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-800 tracking-tighter">{card.value}</p>
              <h3 className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-wide">{card.label}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full">
        {/* LATEST USERS TABLE */}
        <div className="xl:col-span-2 bg-white rounded-[2.2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Yaqinda qo'shilganlar</h2>
            <Link to="/super/users"><button className="text-xs font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">Barchasi</button></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Foydalanuvchi</th>
                  <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Roli</th>
                  <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Filiali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.slice(0, 5).map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs border border-gray-200">
                          {user.fullname.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{user.fullname}</p>
                          <p className="text-[11px] font-bold text-gray-500">{user.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-[10px] font-black text-gray-500 uppercase">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-bold text-gray-600">
                      {user.branch?.name || "Global / Umumiy"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperDashboard;