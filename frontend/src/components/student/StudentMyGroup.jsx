import React, { useEffect, useState } from "react";
import { studentGroupService } from "../../services/api";
import { getStoredUser } from "../../utils/auth";
import { useNavigate } from "react-router-dom";
import { 
  HiOutlineAcademicCap, 
  HiOutlineUser, 
  HiOutlineCalendar, 
  HiChevronRight,
  HiOutlineClock,
  HiOutlineCollection
} from "react-icons/hi";
import { FiLoader } from "react-icons/fi";

const StudentMyGroup = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const res = await studentGroupService.getByStudent(user.id);
        const data = res?.data?.data || res?.data || [];
        setGroups(data);
      } catch (error) {
        console.error("Group fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchGroups();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <FiLoader className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
        <HiOutlineCollection className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800">No Groups Found</h3>
        <p className="text-slate-400 mt-2">You haven't been assigned to any groups yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Groups</h1>
        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
          Total: {groups.length}
        </span>
      </div>
      
      {groups.map((item) => {
        const group = item.group;
        // Vaqt formatini shakllantirish (agar backendda startTime/endTime bo'lsa)
        const timeRange = group?.startTime && group?.endTime 
          ? `${group.startTime} - ${group.endTime}` 
          : group?.time || "TBA";

        return (
          <div
            key={item.id}
            onClick={() => navigate(`/student/details/${group.id}`, { state: { groupName: group.name } })}
            className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          >
            {/* 1. Course Icon & Name */}
            <div className="flex items-center gap-4 min-w-[250px]">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-300 shadow-inner">
                <HiOutlineAcademicCap className="w-8 h-8 text-slate-400 group-hover:text-white" />
              </div>
              <div>
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1 block">
                  {group?.course?.name || "Professional Course"}
                </span>
                <h2 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">
                  {group?.name}
                </h2>
              </div>
            </div>

            {/* 2. Detailed Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1">
              {/* Teacher */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                  <HiOutlineUser className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Instructor</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{group?.teacher?.fullname || "TBA"}</p>
                </div>
              </div>

              {/* Schedule Days */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                  <HiOutlineCalendar className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Days</p>
                  <p className="text-sm font-bold text-slate-700 italic">{group?.days?.join(", ") || "Flexible"}</p>
                </div>
              </div>

              {/* Time Range (NECHIDAN-NECHIGACHA) */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                  <HiOutlineClock className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Time Slot</p>
                  <p className="text-sm font-black text-indigo-600 tracking-tight">{timeRange}</p>
                </div>
              </div>
            </div>

            {/* 3. Action / Arrow */}
            <div className="flex items-center justify-end">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1 shadow-sm">
                <HiChevronRight size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StudentMyGroup;