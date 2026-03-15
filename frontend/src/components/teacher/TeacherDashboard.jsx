import React, { useEffect, useState, useCallback } from "react";
import { groupService, studentGroupService, attendanceService } from "../../services/api";
import toast from "react-hot-toast";
import { FiUsers, FiBookOpen, FiCheckCircle, FiXCircle, FiClock, FiActivity } from "react-icons/fi";
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
      // Fetch core data in parallel
      const [groupRes, attendanceRes] = await Promise.all([
        groupService.getAll(),
        attendanceService.getAll()
      ]);

      const groupData = groupRes?.data?.data || groupRes?.data || [];
      const attendanceData = attendanceRes?.data?.data || attendanceRes?.data || [];
      
      // Filter groups assigned to this teacher
      const teacherGroups = groupData.filter(g => Number(g.teacherId) === Number(user.id));
      setGroups(teacherGroups);

      // Fetch students for all teacher groups in parallel to avoid N+1 issues
      let studentList = [];
      const studentPromises = teacherGroups.map(g => studentGroupService.getById(g.id));
      const studentResults = await Promise.all(studentPromises);
      
      studentResults.forEach(res => {
        const data = res?.data?.data || res?.data || [];
        studentList = [...studentList, ...data];
      });
      setStudents(studentList);

      // Filter today's attendance
      const today = new Date().toISOString().split("T")[0];
      const todayAttendance = attendanceData.filter(a => 
        teacherGroups.some(g => g.id === a.groupId) && 
        (a.date || a.createdAt).startsWith(today)
      );

      setStats({
        groups: teacherGroups.length,
        students: studentList.length,
        present: todayAttendance.filter(a => a.status === "present").length,
        absent: todayAttendance.filter(a => a.status === "absent").length
      });

    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-400 font-medium animate-pulse">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Teacher Dashboard</h1>
          <p className="text-slate-500 font-medium">Welcome back, {user.fullname || "Teacher"}!</p>
        </div>
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
          <FiActivity className="text-indigo-600 text-xl animate-pulse" />
        </div>
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Groups" value={stats.groups} icon={<FiBookOpen />} color="indigo" />
        <StatCard title="Total Students" value={stats.students} icon={<FiUsers />} color="blue" />
        <StatCard title="Present Today" value={stats.present} icon={<FiCheckCircle />} color="emerald" />
        <StatCard title="Absent Today" value={stats.absent} icon={<FiXCircle />} color="rose" />
      </div>

      {/* MY GROUPS TABLE */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">My Assigned Groups</h2>
          <span className="px-4 py-1 bg-white rounded-full text-xs font-bold text-slate-400 border border-slate-100 uppercase tracking-widest">
            Total: {groups.length}
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="px-8 py-5">Group Name</th>
                <th className="px-8 py-5">Course Category</th>
                <th className="px-8 py-5">Schedule</th>
                <th className="px-8 py-5 text-center">Students</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {groups.map((g) => {
                const count = students.filter(s => s.groupId === g.id).length;
                return (
                  <tr key={g.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 font-bold text-slate-700">{g.name}</td>
                    <td className="px-8 py-5 text-slate-500">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">
                        {g.course?.name || "General"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <FiClock className="text-slate-300" />
                        {g.startTime} — {g.endTime}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center text-slate-700 font-mono font-bold">
                      {count}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => navigate("/teacher/attendance/details", { state: { groupId: g.id, groupName: g.name } })}
                        className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors underline decoration-indigo-200 underline-offset-4"
                      >
                        View Journal
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Sub-component for Stats
const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    indigo: "bg-indigo-600 text-indigo-600 border-indigo-100",
    blue: "bg-blue-600 text-blue-600 border-blue-100",
    emerald: "bg-emerald-600 text-emerald-600 border-emerald-100",
    rose: "bg-rose-600 text-rose-600 border-rose-100",
  };

  return (
    <div className="bg-white p-6 rounded-[1.8rem] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-opacity-10 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
        <h2 className="text-2xl font-black text-slate-800 leading-none">{value}</h2>
      </div>
    </div>
  );
};

export default TeacherDashboard;