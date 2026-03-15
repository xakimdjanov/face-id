import React, { useEffect, useState, useCallback } from "react";
import {
  groupService,
  studentGroupService,
  userService
} from "../../services/api";
import toast from "react-hot-toast";
import { HiOutlineUserGroup, HiOutlineMail, HiOutlinePhone } from "react-icons/hi";
import { FiLoader, FiSearch } from "react-icons/fi";

const TeacherStudents = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [groupRes, userRes] = await Promise.all([
        groupService.getAll(),
        userService.getAll()
      ]);

      const allGroups = groupRes?.data?.data || groupRes?.data || [];
      const allUsers = userRes?.data?.data || userRes?.data || [];

      // 1. Get groups assigned to this teacher
      const teacherGroups = allGroups.filter(
        g => Number(g.teacherId) === Number(user.id)
      );

      // 2. Fetch all student-group relations in parallel
      const sgResponses = await Promise.all(
        teacherGroups.map(g => studentGroupService.getById(g.id))
      );

      const allSgRelations = sgResponses.flatMap(
        res => res?.data?.data || res?.data || []
      );

      // 3. Extract unique student IDs
      const studentIds = [...new Set(allSgRelations.map(s => s.studentId))];

      // 4. Map to user objects and filter by role
      const studentList = allUsers.filter(
        u => u.role === "student" && studentIds.includes(u.id)
      );

      setStudents(studentList);
    } catch (error) {
      toast.error("Failed to fetch students data");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Search logic
  const filteredStudents = students.filter(s =>
    s.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <FiLoader className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            My Students List
          </h1>
          <p className="text-slate-500 text-sm">Total unique students across all your groups</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 font-bold text-sm">
        <HiOutlineUserGroup size={18} />
        {students.length} Total Students
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Full Name</th>
                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Email Address</th>
                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Phone Number</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {student.fullname?.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700">{student.fullname}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <HiOutlineMail className="text-slate-300" />
                        {student.email || "N/A"}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <HiOutlinePhone className="text-slate-300" />
                        {student.phone}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-8 py-12 text-center text-slate-400 italic font-medium">
                    No students found matching your search.
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

export default TeacherStudents;