import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { groupService, studentGroupService } from "../../services/api";
import { 
  HiOutlineUsers, 
  HiOutlineArrowNarrowRight, 
  HiOutlineUserCircle,
  HiOutlineSearch,
  HiOutlineCalendar
} from "react-icons/hi";
import { CgSpinner } from "react-icons/cg";
import toast from "react-hot-toast";

const ManagerGroups = () => {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  
  const [groups, setGroups] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    if (!user.branchId) return;

    try {
      setLoading(true);
      const groupsRes = await groupService.getAll();
      
      // FIX 1: Safely handle nested data structure (res.data.data vs res.data)
      const rawGroups = groupsRes?.data?.data || groupsRes?.data || [];
      
      // FIX 2: Use strict number comparison for branchId to avoid type mismatches
      const branchGroups = rawGroups.filter(g => Number(g.branchId) === Number(user.branchId));
      setGroups(branchGroups);

      // Fetch student counts for each group
      const countPromises = branchGroups.map(async (group) => {
        try {
          const studentRes = await studentGroupService.getById(group.id);
          const studentData = studentRes?.data?.data || studentRes?.data || [];
          return { id: group.id, count: studentData.length };
        } catch (e) {
          console.warn(`Could not fetch students for group ${group.id}`);
          return { id: group.id, count: 0 };
        }
      });

      const results = await Promise.all(countPromises);
      const countMap = results.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.count }), {});
      setCounts(countMap);

    } catch (error) {
      console.error("Group fetch error:", error);
      toast.error("Guruhlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [user.branchId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // FIX 3: Add optional chaining for group.course?.name to prevent crashes
  const filteredGroups = groups.filter(group => 
    group.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    group.course?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 font-sans animate-in fade-in duration-500 bg-[#fbfcfd] min-h-screen">
      
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase tracking-tighter">Guruhlar</h1>
          <p className="text-gray-400 text-sm font-medium italic mt-1">Filialdagi faol guruhlar va o'quvchilar sonini nazorat qilish.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="text-xs font-black text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl uppercase tracking-[0.2em] border border-blue-100 whitespace-nowrap">
            Jami: {filteredGroups.length}
          </div>
          <div className="relative w-full md:w-96 shadow-lg shadow-blue-100/50 rounded-2xl">
            <HiOutlineSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={22} />
            <input 
              type="text"
              placeholder="Guruh nomi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold placeholder:font-medium placeholder:text-gray-400 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* GROUPS TABLE */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] w-16">№</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Guruh haqida</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">O'qituvchi</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">O'quvchilar</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Dars jadvali</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Batafsil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <CgSpinner className="animate-spin text-4xl text-blue-600 mx-auto" />
                    <p className="mt-4 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Ma'lumotlar sinxronizatsiya qilinmoqda...</p>
                  </td>
                </tr>
              ) : filteredGroups.length > 0 ? (
                filteredGroups.map((group, index) => (
                  <tr key={group.id} className="hover:bg-gray-50/40 transition-colors group">
                    <td className="p-6 text-sm font-black text-gray-400">{index + 1}</td>
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-100">
                          {group.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{group.name}</p>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter italic">
                            {group.course?.name || "Kurs tanlanmagan"}
                          </p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <HiOutlineUserCircle size={22} className="text-gray-300" />
                        <p className="text-sm font-bold text-gray-700">{group.teacher?.fullname || "Tayinlanmagan"}</p>
                      </div>
                    </td>

                    <td className="p-5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-black uppercase tracking-tight border border-emerald-100">
                        <HiOutlineUsers size={14}/> {counts[group.id] || 0} Ta o'quvchi
                      </span>
                    </td>
                    
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-gray-700">
                          <HiOutlineCalendar className="text-blue-400" />
                          {group.days?.join(", ") || "Jadval kiritilmagan"}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold ml-5">
                          {group.startTime} — {group.endTime}
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => navigate(`/manager/studentdetails/${group.id}`)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-gray-200"
                      >
                        Batafsil <HiOutlineArrowNarrowRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-gray-400 italic font-medium">
                    Ushbu filialda guruhlar topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REMOVED BOTTOM JAMI FOR HEADER CONSISTENCY */}
    </div>
  );
};

export default ManagerGroups;