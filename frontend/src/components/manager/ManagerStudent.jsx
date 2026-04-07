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
      toast.error("Talabalar ro'yxatini yuklashda xatolik");
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase tracking-tighter">O'quvchilar</h1>
          <p className="text-gray-400 text-sm font-medium italic mt-1">Filialdagi barcha o'quvchilarni boshqarish.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="text-xs font-black text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl uppercase tracking-[0.2em] border border-blue-100 whitespace-nowrap">
            Jami: {students.length}
          </div>
          <div className="relative w-full md:w-96 shadow-lg shadow-blue-100/50 rounded-2xl">
            <HiOutlineSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={22} />
            <input 
              type="text" 
              placeholder="Ism yoki tel..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold shadow-sm placeholder:font-medium placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] w-16">№</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">O'quvchi ismi</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Aloqa</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Roli</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ro'yxatdan o'tgan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center text-blue-500 animate-pulse font-black tracking-widest uppercase text-xs">Talabalar ro'yxati yuklanmoqda...</td></tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="p-6 text-sm font-black text-gray-400">{index + 1}</td>
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-lg shadow-gray-200">
                          {student.fullname.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-800 text-sm tracking-tight">{student.fullname}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700 tracking-tight">{student.phone || 'Mavjud emas'}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        O'QUVCHI
                      </span>
                    </td>
                    <td className="p-5 text-sm text-gray-500 font-medium">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="p-20 text-center text-gray-400 font-medium italic">Talabalar topilmadi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerStudent;