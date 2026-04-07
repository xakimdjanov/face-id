import React, { useEffect, useState, useCallback } from "react";
import {
  groupService,
  studentGroupService,
  userService
} from "../../services/api";
import toast from "react-hot-toast";
import { HiOutlineUserGroup, HiOutlinePhone, HiOutlineAcademicCap } from "react-icons/hi";
import { FiLoader, FiSearch, FiUser } from "react-icons/fi";

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
      const studentIds = [...new Set(allSgRelations.map(s => Number(s.studentId)))];

      // 4. Map to user objects and filter by role
      const studentList = allUsers.filter(
        u => u.role === "student" && studentIds.includes(Number(u.id))
      );

      setStudents(studentList);
    } catch (error) {
      toast.error("Talabalar ma'lumotlarini yuklashda xatolik!");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Search logic
  const filteredStudents = students.filter(s =>
    (s.fullname || s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone || "").includes(searchTerm)
  );

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
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen space-y-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-sm">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-blue-600 rounded-[1.8rem] text-white shadow-xl shadow-blue-100">
              <HiOutlineUserGroup size={32} />
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Talabalar Ro'yxati</h1>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{students.length} ta umumiy talaba</span>
              </div>
           </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full lg:w-96">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input
            type="text"
            placeholder="Talabalarni qidirish..."
            className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-500/20 focus:bg-white transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FBFCFE]">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">№</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Talaba F.I.SH</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Telefon Raqami</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Roli</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="group hover:bg-blue-50/20 transition-all">
                    <td className="px-10 py-5 text-xs font-black text-slate-300 group-hover:text-blue-200 transition-colors">{idx + 1}</td>
                    <td className="px-10 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1rem] bg-slate-50 flex items-center justify-center text-blue-300 font-black text-sm uppercase group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner group-hover:shadow-blue-200 group-hover:scale-105">
                           <FiUser size={20} />
                        </div>
                        <div>
                           <p className="font-black text-slate-800 text-sm group-hover:text-blue-700 transition-colors uppercase tracking-tight">{student.fullname || student.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {student.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex items-center gap-3 text-slate-500 text-sm font-bold bg-slate-50/50 w-fit px-4 py-2 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <HiOutlinePhone className="text-blue-300 group-hover:text-blue-500" size={18} />
                        {student.phone || "Telefon yo'q"}
                      </div>
                    </td>
                    <td className="px-10 py-5">
                       <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all">
                          Talaba
                       </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan="4" className="px-10 py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                           <HiOutlineAcademicCap size={48} className="text-slate-200" />
                         </div>
                         <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Talabalar topilmadi</p>
                         <p className="text-slate-300 font-medium text-xs">Qidiruv natijasi bo'sh yoki sizga biriktirilgan talabalar yo'q.</p>
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

export default TeacherStudents;