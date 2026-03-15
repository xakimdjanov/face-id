import React, { useEffect, useState } from "react";
import { groupService } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { 
  HiOutlineAcademicCap, 
  HiOutlineArrowRight, 
  HiOutlineCalendar, 
  HiOutlineClock 
} from "react-icons/hi";
import { FiLoader } from "react-icons/fi";
import toast from "react-hot-toast";

const TeacherAttendance = () => {
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
        toast.error("Failed to load groups for attendance");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [user.id]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <FiLoader className="w-10 h-10 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto min-h-screen bg-slate-50">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Attendance Control</h1>
        <p className="text-slate-500 font-medium">Select a group to mark daily attendance</p>
      </div>
      
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div 
            key={group.id}
            onClick={() => navigate(`/teacher/listdeatils`, { state: { groupId: group.id, groupName: group.name } })}
            className="group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            {/* Info Section */}
            <div className="flex items-center gap-5 flex-1">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 flex items-center justify-center">
                <HiOutlineAcademicCap size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {group.name}
                </h3>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
                  {/* Soat */}
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <HiOutlineClock className="text-indigo-500" size={16}/> 
                    {group.startTime?.slice(0, 5)} - {group.endTime?.slice(0, 5)}
                  </span>
                  
                  {/* Kunlar (Badge ko'rinishida) */}
                  <div className="flex items-center gap-1.5">
                    <HiOutlineCalendar className="text-indigo-500" size={16}/>
                    <div className="flex gap-1">
                      {group.days?.map((day) => (
                        <span 
                          key={day} 
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded uppercase border border-slate-200 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.1em] bg-indigo-50 px-4 py-2 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-all">
                Mark Attendance
              </span>
              <div className="hidden md:flex w-10 h-10 rounded-full bg-slate-50 group-hover:bg-indigo-50 items-center justify-center transition-all">
                <HiOutlineArrowRight className="text-slate-400 group-hover:text-indigo-600" />
              </div>
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">No groups assigned to you.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendance;