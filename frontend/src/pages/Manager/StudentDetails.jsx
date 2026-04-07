import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { studentGroupService } from "../../services/api";
import {
  HiOutlineChevronLeft,
  HiOutlineInbox
} from "react-icons/hi";
import toast from "react-hot-toast";

const StudentDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const enrolledRes = await studentGroupService.getById(Number(groupId));
      const enrolledStudents = enrolledRes.data.data || enrolledRes.data || [];
      setStudents(enrolledStudents);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId]);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-all group"
        >
          <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
            <HiOutlineChevronLeft size={18} />
          </div>
          Guruhlarga qaytish
        </button>
        <div className="text-xs font-black text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl uppercase tracking-[0.2em] border border-blue-100">
          Jami: {students.length}
        </div>
      </div>

      {/* STUDENTS TABLE */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">

            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] w-16">№</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">To'liq ismi</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Telefon raqami</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Roli</th>
              </tr>
            </thead>

            <tbody className="divide-y">

              {loading && (
                <tr>
                  <td colSpan="4" className="p-20 text-center text-blue-400 font-black text-xs uppercase tracking-[0.2em] animate-pulse">
                    Yuklanmoqda...
                  </td>
                </tr>
              )}

              {!loading && students.length > 0 &&
                students.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-6 text-sm font-black text-gray-400">{index + 1}</td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">

                        <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-lg shadow-gray-200">
                          {item.student?.fullname?.charAt(0)}
                        </div>

                        <span className="font-bold text-gray-800 text-sm tracking-tight">
                          {item.student?.fullname}
                        </span>

                      </div>
                    </td>

                    <td className="p-6 text-gray-500 font-bold text-sm tracking-tight">
                      {item.student?.phone || "Telefon kiritilmagan"}
                    </td>

                    <td className="p-6 text-right">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        O'QUVCHI
                      </span>
                    </td>

                  </tr>
                ))}

              {!loading && students.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-32 text-center text-gray-400 font-medium italic">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-gray-50 rounded-full">
                        <HiOutlineInbox size={60} className="text-gray-200" />
                      </div>
                      Hozircha ushbu guruhda talabalar mavjud emas.
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

export default StudentDetails;