import React, { useEffect, useState, useCallback } from "react";
import {
  groupService,
  userService,
  paymentService,
  studentGroupService
} from "../../services/api";
import { 
  HiOutlineUserGroup, HiOutlineAcademicCap, 
  HiOutlineCollection, HiOutlineCurrencyDollar,
  HiOutlineTrendingUp
} from "react-icons/hi";
import toast from "react-hot-toast";

const ManagerDashboard = () => {
  // Foydalanuvchini xavfsiz olish
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));

  const [stats, setStats] = useState({
    groups: 0,
    teachers: 0,
    students: 0,
    totalPayments: 0,
    revenue: 0
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user.branchId) return;

    try {
      setLoading(true);
      
      // 1. Fetching main data
      const [groupRes, userRes, paymentRes] = await Promise.all([
        groupService.getAll(),
        userService.getAll(),
        paymentService.getAll()
      ]);

      // Data extraction (safeguard for res.data.data or res.data)
      const allGroups = groupRes?.data?.data || groupRes?.data || [];
      const allUsers = userRes?.data?.data || userRes?.data || [];
      const allPayments = paymentRes?.data?.data || paymentRes?.data || [];

      // Branch filters
      const branchGroups = allGroups.filter(g => Number(g.branchId) === Number(user.branchId));
      const groupIds = branchGroups.map(g => g.id);

      const branchTeachers = allUsers.filter(
        u => u.role === "teacher" && Number(u.branchId) === Number(user.branchId)
      );

      // 2. Fetch Students for branch groups
      const studentPromises = branchGroups.map(g => studentGroupService.getById(g.id));
      const studentResults = await Promise.all(studentPromises);
      
      // Flatten all student-group relations
      const allStudentEntries = studentResults.flatMap(res => res?.data?.data || res?.data || []);
      
      // Get Unique Students (by studentId)
      const uniqueStudentIds = [...new Set(allStudentEntries.map(s => s.studentId))];

      // 3. Financial calculations
      const branchPayments = allPayments.filter(p => groupIds.includes(Number(p.groupId)));
      const totalRevenue = branchPayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

      setStats({
        groups: branchGroups.length,
        teachers: branchTeachers.length,
        students: uniqueStudentIds.length,
        totalPayments: branchPayments.length,
        revenue: totalRevenue
      });

      setRecentStudents(allStudentEntries.slice(-5).reverse());
      
    } catch (error) {
      console.error("Dashboard error:", error);
      toast.error("Failed to refresh dashboard metrics");
    } finally {
      setLoading(false);
    }
  }, [user.branchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (val) => 
    new Intl.NumberFormat('uz-UZ').format(val) + " UZS";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* WELCOME HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Executive Overview</h1>
          <p className="text-gray-500 font-medium">Welcome back, manager.</p>
        </div>
        <div className="bg-indigo-600 text-white px-5 py-2 rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-100">
          <div className="p-2 bg-indigo-500 rounded-xl">
            <HiOutlineTrendingUp size={20}/>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">Branch Status</p>
            <p className="text-sm font-bold">Operational</p>
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Groups" 
          value={stats.groups} 
          icon={<HiOutlineCollection size={24}/>} 
          color="bg-indigo-600" 
        />
        <StatCard 
          title="Faculty Members" 
          value={stats.teachers} 
          icon={<HiOutlineAcademicCap size={24}/>} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Total Students" 
          value={stats.students} 
          icon={<HiOutlineUserGroup size={24}/>} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(stats.revenue)} 
          icon={<HiOutlineCurrencyDollar size={24}/>} 
          color="bg-amber-500" 
          isCurrency
        />
      </div>

      {/* RECENT ACTIVITY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-800">New Enrollments</h2>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">Latest 5</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                  <th className="pb-4 px-2">Student Name</th>
                  <th className="pb-4 px-2">Email Address</th>
                  <th className="pb-4 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentStudents.length > 0 ? recentStudents.map((entry, idx) => (
                  <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                          {entry.student?.fullname?.charAt(0) || "S"}
                        </div>
                        <span className="text-sm font-bold text-gray-700">{entry.student?.fullname || "Unnamed Student"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-sm text-gray-500 font-medium">
                      {entry.student?.email || "N/A"}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-black uppercase tracking-tighter border border-emerald-100">Active</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="py-10 text-center text-gray-400 font-medium">No students found for this branch.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* REFRESH CARD */}
        <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-2xl shadow-indigo-200">
          <div>
            <h2 className="text-xl font-black mb-4 leading-tight">Branch Management Tip</h2>
            <p className="text-indigo-200 text-sm leading-relaxed mb-6">
              Regularly monitor groups with fewer than 5 students to optimize faculty allocation and branch profitability.
            </p>
          </div>
          <button 
            onClick={loadData}
            className="w-full bg-white/10 hover:bg-white text-indigo-900 hover:text-indigo-900 transition-all py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10"
          >
            Refresh Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, isCurrency }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
    <div className={`w-14 h-14 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg shadow-gray-50`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <p className={`${isCurrency ? 'text-base' : 'text-3xl'} font-black text-gray-800 tracking-tight`}>
        {value}
      </p>
    </div>
  </div>
);

export default ManagerDashboard;