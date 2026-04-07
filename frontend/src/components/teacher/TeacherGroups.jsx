import React, { useEffect, useState } from "react";
import { groupService } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { 
  HiOutlineAcademicCap, 
  HiOutlineArrowRight, 
  HiOutlineCalendar, 
  HiOutlineClock,
  HiOutlineCollection
} from "react-icons/hi";
import { FiLoader, FiChevronRight } from "react-icons/fi";
import toast from "react-hot-toast";

const TeacherGroups = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const res = await groupService.getAll();
        const data = res?.data?.data || res?.data || [];
        const myGroups = data.filter(g => Number(g.teacherId) === Number(user.id));
        setGroups(myGroups);
      } catch (error) {
        toast.error("Guruhlarni yuklashda xatolik!");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [user.id]);

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
       <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Yuklanmoqda...</p>
       </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen space-y-10 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Guruhlarim</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Sizga biriktirilgan dars guruhlari ro'yxati</p>
        </div>
        <div className="flex bg-blue-600 px-6 py-3 rounded-2xl shadow-xl shadow-blue-100 items-center gap-3 text-white">
           <HiOutlineCollection size={22} strokeWidth={2} />
           <span className="font-extrabold text-sm uppercase tracking-tight">{groups.length} ta guruh</span>
        </div>
      </div>
      
      {/* Vertical List Container */}
      <div className="grid grid-cols-1 gap-6">
        {groups.length > 0 ? groups.map((group) => (
          <div 
            key={group.id}
            onClick={() => navigate(`/teacher/deatils`, { state: { groupId: group.id, groupName: group.name } })}
            className="group bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-200/40 hover:border-blue-200 transition-all duration-500 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden"
          >
            {/* Hover Accent Piece */}
            <div className="absolute top-0 left-0 w-1.5 h-0 bg-blue-600 group-hover:h-full transition-all duration-500" />

            {/* Left Side: Icon and Title */}
            <div className="flex items-center gap-6 flex-1">
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-slate-50 text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 flex items-center justify-center shadow-inner group-hover:shadow-blue-200 group-hover:scale-110">
                <HiOutlineAcademicCap size={32} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                  {group.name}
                </h3>
                <div className="flex items-center gap-2">
                   <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                      <p className="text-[10px] font-black text-slate-400 group-hover:text-blue-600 uppercase tracking-[0.1em] leading-none">
                        {group.course?.name || "Asosiy Kurs"}
                      </p>
                   </div>
                </div>
              </div>
            </div>

            {/* Middle Side: Schedule Info */}
            <div className="flex flex-wrap items-center gap-8 md:gap-16 flex-1 lg:flex-none">
              {/* Time */}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-xl text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                   <HiOutlineClock size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Vaqt</p>
                  <p className="text-sm font-extrabold text-slate-700 whitespace-nowrap">
                    {group.startTime?.slice(0, 5)} — {group.endTime?.slice(0, 5)}
                  </p>
                </div>
              </div>

              {/* Days */}
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-slate-50 rounded-xl text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <HiOutlineCalendar size={22} />
                 </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kunlar</p>
                  <div className="flex gap-1.5">
                    {group.days?.map((day) => (
                      <span key={day} className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md border border-slate-200 uppercase group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Action Button */}
            <div className="hidden md:flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-blue-600 text-slate-300 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:shadow-blue-200 group-hover:-translate-y-1">
              <HiOutlineArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </div>
            
            {/* Mobile Action Text */}
            <div className="md:hidden pt-4 border-t border-slate-50 flex items-center justify-between text-blue-600 font-bold text-sm">
              <span>Batafsil ko'rish</span>
              <HiOutlineArrowRight />
            </div>
          </div>
        )) : (
          <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-50 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiOutlineAcademicCap size={60} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-black text-xl tracking-wide uppercase">Hozircha guruhlar yo'q</p>
            <p className="text-slate-300 font-bold text-sm mt-1">Sizga biriktirilgan darslar hali mavjud emas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherGroups;