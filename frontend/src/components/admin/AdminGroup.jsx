import React, { useEffect, useState, useCallback, useMemo } from "react";
import { groupService, userService, courseService } from "../../services/api";
import { 
  HiOutlinePlus, 
  HiOutlinePencilAlt, 
  HiOutlineTrash, 
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineExclamation,
  HiX
} from "react-icons/hi";
import toast from "react-hot-toast";

const AdminGroup = () => {
  // Foydalanuvchi ma'lumotlarini olish (Filialni aniqlash uchun)
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    courseId: "",
    branchId: user.branchId || 1, // Foydalanuvchi filiali avtomat qo'yiladi
    startDate: "",
    startTime: "",
    endTime: "",
    days: []
  });

  const daysList = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const fetchData = useCallback(async () => {
    if (!user.branchId) return;
    setIsLoading(true);
    try {
      const [groupRes, userRes, courseRes] = await Promise.all([
        groupService.getAll(),
        userService.getAll(),
        courseService.getAll()
      ]);

      // Faqat shu filialga tegishli guruhlarni filtrlash
      const allGroups = groupRes?.data?.data || groupRes?.data || [];
      const branchGroups = allGroups.filter(g => Number(g.branchId) === Number(user.branchId));
      setGroups(branchGroups);

      // Faqat shu filialdagi o'qituvchilarni filtrlash
      const usersData = userRes?.data?.data || userRes?.data || [];
      setTeachers(usersData.filter((u) => u.role === "teacher" && Number(u.branchId) === Number(user.branchId)));

      // Kurslarni yuklash (kurslar odatda umumiy bo'ladi yoki branchId bo'yicha filtrlanadi)
      const allCourses = courseRes?.data?.data || courseRes?.data || [];
      setCourses(allCourses);

    } catch (error) {
      toast.error("Error loading branch data");
    } finally {
      setIsLoading(false);
    }
  }, [user.branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Qidiruv mantiqi (useMemo orqali optimallashtirilgan)
  const filteredGroups = useMemo(() => {
    return groups.filter(g => 
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.course?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groups, searchTerm]);

  const handleDayChange = (day) => {
    setForm(prevForm => {
      const isSelected = prevForm.days.includes(day);
      return {
        ...prevForm,
        days: isSelected 
          ? prevForm.days.filter(d => d !== day) 
          : [...prevForm.days, day]
      };
    });
  };

  const resetForm = () => {
    setForm({
      name: "", 
      courseId: "", 
      branchId: user.branchId || 1,
      startDate: "", 
      startTime: "", 
      endTime: "", 
      days: []
    });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleOpenModal = (group = null) => {
    if (group) {
      setEditingId(group.id);
      setForm({
        name: group.name,
        courseId: group.courseId,
        branchId: group.branchId,
        startDate: group.startDate?.split("T")[0],
        startTime: group.startTime,
        endTime: group.endTime,
        days: group.days || []
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.days.length === 0) return toast.error("Please select at least one day");
    
    try {
      if (editingId) {
        await groupService.updateData(editingId, form);
        toast.success("Group updated");
      } else {
        await groupService.create(form);
        toast.success("New group created in your branch");
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const confirmDelete = async () => {
    try {
      await groupService.delete(deleteId);
      toast.success("Deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const assignTeacher = async (groupId, teacherId) => {
    try {
      await groupService.update(groupId, { teacherId });
      toast.success("Mentor assigned");
      fetchData();
    } catch (error) {
      toast.error("Assignment failed");
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Branch Groups</h1>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          <HiOutlinePlus size={20} />
          <span>Add Group</span>
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative group max-w-md">
        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Search by name or course..."
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl outline-none shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/40 overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-50">
              <th className="px-6 md:px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Group & Course</th>
              <th className="px-6 md:px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule Details</th>
              <th className="px-6 md:px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Mentor</th>
              <th className="px-6 md:px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
               <tr><td colSpan="4" className="text-center py-20 font-bold text-slate-400">Loading branch data...</td></tr>
            ) : filteredGroups.length === 0 ? (
               <tr><td colSpan="4" className="text-center py-20 font-bold text-slate-400">No groups found in this branch.</td></tr>
            ) : filteredGroups.map(g => (
              <tr key={g.id} className="hover:bg-slate-50/30 transition-colors group">
                <td className="px-6 md:px-8 py-6">
                  <div className="font-bold text-slate-800">{g.name}</div>
                  <div className="text-xs font-bold text-indigo-500 uppercase">{g.course?.name || 'No course'}</div>
                </td>
                <td className="px-6 md:px-8 py-6">
                  <div className="flex items-center gap-2 text-slate-600 font-bold text-xs mb-1">
                    <HiOutlineCalendar className="text-indigo-400" />
                    {g.days?.length > 0 ? g.days.join(", ") : "No days set"}
                  </div>
                  <div className="text-[10px] font-black text-slate-400 ml-6 uppercase">{g.startTime} - {g.endTime}</div>
                </td>
                <td className="px-6 md:px-8 py-6">
                  <select
                    value={g.teacher?.id || ""}
                    onChange={(e) => assignTeacher(g.id, e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-white transition-all"
                  >
                    <option value="">Assign Mentor</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullname}</option>)}
                  </select>
                </td>
                <td className="px-6 md:px-8 py-6">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(g)} className="p-2.5 text-amber-500 bg-amber-50 rounded-xl hover:bg-amber-100 transition-all"><HiOutlinePencilAlt size={18} /></button>
                    <button onClick={() => {setDeleteId(g.id); setIsDeleteModalOpen(true);}} className="p-2.5 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-all"><HiOutlineTrash size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl md:text-2xl font-black text-slate-800">{editingId ? "Update Group" : "Create Group"}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-white rounded-full transition-colors"><HiX size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Group Name</label>
                  <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Course</label>
                  <select value={form.courseId} onChange={(e) => setForm({...form, courseId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold" required>
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Start Time</label>
                    <input type="time" value={form.startTime} onChange={(e) => setForm({...form, startTime: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">End Time</label>
                    <input type="time" value={form.endTime} onChange={(e) => setForm({...form, endTime: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Weekly Days</label>
                <div className="flex flex-wrap gap-2">
                  {daysList.map(day => (
                    <button 
                      key={day} 
                      type="button" 
                      onClick={() => handleDayChange(day)} 
                      className={`px-4 py-3 rounded-xl font-bold transition-all border ${form.days.includes(day) ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 scale-105" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest text-xs">
                {editingId ? "Confirm Update" : "Confirm Creation"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><HiOutlineExclamation size={40} /></div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Are you sure?</h3>
            <p className="text-slate-500 font-medium mb-8 text-sm">Deleting this group will affect student assignments and schedules.</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDelete} className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Delete Group</button>
              <button onClick={() => setIsDeleteModalOpen(false)} className="w-full bg-slate-50 text-slate-500 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminGroup;