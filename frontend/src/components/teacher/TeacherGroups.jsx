import React, { useEffect, useState } from "react";
import { groupService } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { 
  HiOutlineAcademicCap, 
  HiOutlineArrowRight, 
  HiOutlineCalendar, 
  HiOutlineClock,
  HiOutlineHashtag,
  HiOutlineCollection
} from "react-icons/hi";
import { FiLoader } from "react-icons/fi";
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
        toast.error("Failed to load groups");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [user.id]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <FiLoader className="w-10 h-10 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto bg-slate-50 min-h-screen">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Groups</h1>
          <p className="text-slate-500 mt-1 font-medium italic">List of your assigned classes</p>
        </div>
        <div className="hidden md:flex bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm items-center gap-2">
           <HiOutlineCollection className="text-indigo-500" />
           <span className="font-bold text-slate-700">{groups.length} Groups</span>
        </div>
      </div>
      
      {/* Vertical List Container */}
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div 
            key={group.id}
            onClick={() => navigate(`/teacher/deatils`, { state: { groupId: group.id, groupName: group.name } })}
            className="group bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            {/* Left Side: Icon and Title */}
            <div className="flex items-center gap-5 flex-1">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-inner">
                <HiOutlineAcademicCap size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">  
                  <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {group.name}
                  </h3>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                  {group.course?.name || "Standard Course"}
                </p>
              </div>
            </div>

            {/* Middle Side: Schedule Info */}
            <div className="flex flex-wrap items-center gap-6 md:gap-12 flex-1">
              {/* Time */}
              <div className="flex items-center gap-3">
                <HiOutlineClock className="text-slate-300" size={20} />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Time</p>
                  <p className="text-sm font-extrabold text-slate-700 whitespace-nowrap">
                    {group.startTime?.slice(0, 5)} — {group.endTime?.slice(0, 5)}
                  </p>
                </div>
              </div>

              {/* Days */}
              <div className="flex items-center gap-3">
                <HiOutlineCalendar className="text-slate-300" size={20} />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Days</p>
                  <div className="flex gap-1">
                    {group.days?.map((day) => (
                      <span key={day} className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 uppercase">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Action Icon */}
            <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
              <HiOutlineArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </div>
            
            {/* Mobile Action Text */}
            <div className="md:hidden pt-4 border-t border-slate-50 flex items-center justify-between text-indigo-600 font-bold text-sm">
              <span>View Details</span>
              <HiOutlineArrowRight />
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
          <HiOutlineAcademicCap className="mx-auto text-slate-200 mb-4" size={60} />
          <p className="text-slate-400 font-bold text-lg tracking-tight">No assigned groups found.</p>
        </div>
      )}
    </div>
  );
};

export default TeacherGroups;