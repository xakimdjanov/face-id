import React, { useEffect, useState } from "react";
import { userService, studentGroupService } from "../../services/api";
import { HiOutlineUsers, HiOutlinePhone, HiOutlineAcademicCap, HiOutlineSearch } from "react-icons/hi";
import toast from "react-hot-toast";

const ManagerStudent = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Filialdagi barcha foydalanuvchilarni olish
      const res = await userService.getAll();
      const branchStudents = res.data.filter(u => u.role === "student" && u.branchId === user.branchId);
      
      setStudents(branchStudents);
    } catch (error) {
      toast.error("Failed to load student directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredStudents = students.filter(s => 
    s.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Student Directory</h1>
          <p className="text-gray-500 text-sm font-medium">Manage all students enrolled in {user.branch?.name || 'this branch'}.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Name</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="4" className="p-20 text-center text-indigo-500 animate-pulse font-bold tracking-widest uppercase">Fetching Students...</td></tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                          {student.fullname.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-800 text-sm">{student.fullname}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">{student.email}</span>
                        <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                          <HiOutlinePhone size={12}/> {student.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        Student
                      </span>
                    </td>
                    <td className="p-5 text-sm text-gray-500 font-medium">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="p-20 text-center text-gray-400">No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerStudent;