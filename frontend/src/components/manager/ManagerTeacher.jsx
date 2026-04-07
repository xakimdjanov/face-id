import React, { useEffect, useState } from "react";
import { userService } from "../../services/api";
import { 
  HiOutlineAcademicCap
} from "react-icons/hi";
import toast from "react-hot-toast";

const ManagerTeacher = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTeachers = async () => {
    try {
      setLoading(true);
      const res = await userService.getAll();
      const branchTeachers = res.data.filter(
        (u) => u.role === "teacher" && u.branchId === user.branchId
      );
      setTeachers(branchTeachers);
    } catch (error) {
      toast.error("O'qituvchilarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTeachers();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
            <HiOutlineAcademicCap size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">O'qituvchilar</h1>
            <p className="text-gray-400 text-sm font-medium italic mt-1">Filialdagi barcha o'qituvchilar ro'yxati.</p>
          </div>
        </div>
        
        <div className="text-xs font-black text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl uppercase tracking-[0.2em] border border-blue-100">
          Jami: {teachers.length}
        </div>
      </div>

      {/* TEACHERS TABLE */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] w-16">№</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">O'qituvchi ismi</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Telefon raqami</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Bo'lim</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-blue-500 animate-pulse font-black tracking-widest uppercase text-xs">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : teachers.length > 0 ? (
                teachers.map((teacher, index) => (
                  <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-6 text-sm font-black text-gray-400">{index + 1}</td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-lg">
                          {teacher.fullname.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{teacher.fullname}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-black">Xodim</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="font-bold text-gray-700">{teacher.phone || "Telefon kiritilmagan"}</p>
                    </td>
                    <td className="p-5 text-center">
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        Umumiy
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        Faol
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-gray-400 italic font-medium">
                    Hozircha ushbu filialda o'qituvchilar mavjud emas.
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

export default ManagerTeacher;