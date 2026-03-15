import React, { useEffect, useState, useCallback } from 'react';
import { 
  HiOutlineUsers, 
  HiOutlineAcademicCap, 
  HiOutlineCurrencyDollar, 
  HiOutlineTrendingUp,
  HiOutlineArrowSmUp,
  HiOutlineArrowSmDown,
  HiOutlineDotsVertical
} from "react-icons/hi";
import { userService, groupService, paymentService } from "../../services/api";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    studentsCount: 0,
    groupsCount: 0,
    monthlyPayments: 0,
    totalRevenue: 0,
    recentPayments: []
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user.branchId) return;
    setLoading(true);
    try {
      const [uRes, gRes, pRes] = await Promise.all([
        userService.getAll(),
        groupService.getAll(),
        paymentService.getAll()
      ]);

      const usersData = uRes?.data?.data || uRes?.data || [];
      const groupsData = gRes?.data?.data || gRes?.data || [];
      const allPayments = pRes?.data?.data || pRes?.data || [];

      // Filter by Branch
      const branchStudents = usersData.filter(u => u.role === 'student' && Number(u.branchId) === Number(user.branchId));
      const branchGroups = groupsData.filter(g => Number(g.branchId) === Number(user.branchId));
      
      // Calculate Revenue (for current month as an example)
      const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
      const branchPayments = allPayments.filter(p => 
        branchGroups.some(bg => Number(bg.id) === Number(p.groupId))
      );

      const totalRevenue = branchPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const monthlyRevenue = branchPayments
        .filter(p => p.month === currentMonth)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      setStats({
        studentsCount: branchStudents.length,
        groupsCount: branchGroups.length,
        monthlyPayments: monthlyRevenue,
        totalRevenue: totalRevenue,
        recentPayments: branchPayments.slice(-5).reverse() // Last 5 payments
      });
    } catch (error) {
      toast.error("Failed to fetch dashboard statistics");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user.branchId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const cards = [
    { 
      title: "Total Students", 
      value: stats.studentsCount, 
      icon: HiOutlineUsers, 
      color: "text-blue-600", 
      bg: "bg-blue-50",
      trend: "+12%", 
      trendUp: true 
    },
    { 
      title: "Active Groups", 
      value: stats.groupsCount, 
      icon: HiOutlineAcademicCap, 
      color: "text-indigo-600", 
      bg: "bg-indigo-50",
      trend: "Stable", 
      trendUp: true 
    },
    { 
      title: "Monthly Revenue", 
      value: `${stats.monthlyPayments.toLocaleString()} UZS`, 
      icon: HiOutlineTrendingUp, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50",
      trend: "Current Month", 
      trendUp: true 
    },
    { 
      title: "Total Balance", 
      value: `${stats.totalRevenue.toLocaleString()} UZS`, 
      icon: HiOutlineCurrencyDollar, 
      color: "text-amber-600", 
      bg: "bg-amber-50",
      trend: "All Time", 
      trendUp: true 
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#fbfcfd] min-h-screen animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Welcome back, <span className="text-indigo-600">{user.fullname || 'Admin'}</span>
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
            System Overview
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <span className="text-xs font-black px-4 py-2 bg-slate-50 rounded-xl text-slate-500">
             {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
           </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-indigo-100 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className={`${card.bg} ${card.color} p-4 rounded-2xl transition-transform group-hover:scale-110`}>
                <card.icon size={26} />
              </div>
              <button className="text-slate-300 hover:text-slate-500"><HiOutlineDotsVertical /></button>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.title}</p>
              <h3 className="text-2xl font-black text-slate-800 mb-2">{card.value}</h3>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${card.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {card.trendUp ? <HiOutlineArrowSmUp /> : <HiOutlineArrowSmDown />}
                <span>{card.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800">Recent Payments</h2>
            <button onClick={fetchDashboardData} className="text-xs font-bold text-indigo-600 hover:underline">Refresh Data</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-4">Student</th>
                  <th className="px-8 py-4">Amount</th>
                  <th className="px-8 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.recentPayments.length > 0 ? stats.recentPayments.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-700 text-sm">
                      {p.student?.fullname || "Unknown Student"}
                    </td>
                    <td className="px-8 py-5 font-black text-slate-900 text-sm">
                      {Number(p.amount).toLocaleString()} UZS
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-emerald-100">
                        Completed
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="px-8 py-10 text-center text-slate-400 italic font-medium">No recent transactions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Motivational Sidebar */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-4 tracking-tight leading-tight">Branch Performance</h2>
              <p className="text-indigo-100 text-sm font-medium leading-relaxed opacity-80 mb-6 italic">
                "Education is the most powerful weapon which you can use to change the world."
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-white h-full w-[75%] rounded-full shadow-[0_0_10px_white]"></div>
                </div>
                <span className="text-xs font-black">75% Goal</span>
              </div>
            </div>
            {/* Decorative circle */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Quick Shortcuts</h3>
            <div className="grid grid-cols-2 gap-3">
               <button className="p-4 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all uppercase tracking-widest">Add Student</button>
               <button className="p-4 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all uppercase tracking-widest">New Group</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;