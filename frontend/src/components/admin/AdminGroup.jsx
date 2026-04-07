import React, { useEffect, useState, useCallback, useMemo } from "react";
import { groupService, userService, courseService } from "../../services/api";
import { 
  HiOutlinePlus, 
  HiOutlinePencilAlt, 
  HiOutlineTrash, 
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineUser
} from "react-icons/hi";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Swal from "sweetalert2";

const AdminGroup = () => {
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    courseId: "",
    teacherId: "", // New field for teacher
    branchId: user.branchId || 1,
    startDate: "",
    startTime: "",
    endTime: "",
    days: []
  });

  const daysList = [
    { key: "Mon", label: "Dush" },
    { key: "Tue", label: "Sesh" },
    { key: "Wed", label: "Chor" },
    { key: "Thu", label: "Pay" },
    { key: "Fri", label: "Jum" },
    { key: "Sat", label: "Shan" },
    { key: "Sun", label: "Yak" }
  ];

  const fetchData = useCallback(async () => {
    if (!user.branchId) return;
    setIsLoading(true);
    try {
      const [groupRes, userRes, courseRes] = await Promise.all([
        groupService.getAll(),
        userService.getAll(),
        courseService.getAll()
      ]);

      const allGroups = groupRes?.data?.data || groupRes?.data || [];
      const branchGroups = allGroups.filter(g => Number(g.branchId) === Number(user.branchId));
      setGroups(branchGroups);

      const usersData = userRes?.data?.data || userRes?.data || [];
      setTeachers(usersData.filter((u) => u.role === "teacher" && Number(u.branchId) === Number(user.branchId)));

      const allCourses = courseRes?.data?.data || courseRes?.data || [];
      setCourses(allCourses);

    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  }, [user.branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredGroups = useMemo(() => {
    return groups.filter(g => 
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.course?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groups, searchTerm]);

  const handleDayChange = (dayKey) => {
    setForm(prevForm => {
      const isSelected = prevForm.days.includes(dayKey);
      return {
        ...prevForm,
        days: isSelected 
          ? prevForm.days.filter(d => d !== dayKey) 
          : [...prevForm.days, dayKey]
      };
    });
  };

  const resetForm = () => {
    setForm({
      name: "", 
      courseId: "", 
      teacherId: "",
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
        teacherId: group.teacher?.id || "",
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
    if (form.days.length === 0) return toast.error("Iltimos, kamida bir kunni tanlang");
    
    const loadingToast = toast.loading(editingId ? "Yangilanmoqda..." : "Yaratilmoqda...");
    try {
      if (editingId) {
        // Group ma'lumotlarini yangilash
        await groupService.updateData(editingId, form);
        
        // Agar o'qituvchi tanlangan bo'lsa, uni ham alohida tayinlash (yoki updateData o'zi handle qilsa shart emas)
        // Bizning api.js da updateData va update (assign-teacher) alohida
        if (form.teacherId) {
          await groupService.update(editingId, { teacherId: form.teacherId });
        }
        
        toast.success("Guruh yangilandi", { id: loadingToast });
      } else {
        const res = await groupService.create(form);
        const newGroupId = res.data?.data?.id || res.data?.id;
        
        if (newGroupId && form.teacherId) {
          await groupService.update(newGroupId, { teacherId: form.teacherId });
        }
        
        toast.success("Yangi guruh yaratildi", { id: loadingToast });
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Xatolik yuz berdi", { id: loadingToast });
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "O'chirishni tasdiqlaysizmi?",
      text: `${name} guruhi va unga tegishli barcha ma'lumotlar o'chiriladi!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ha, o'chirish",
      cancelButtonText: "Bekor qilish",
      background: "#ffffff",
      customClass: {
        popup: 'rounded-[2rem]'
      }
    });

    if (result.isConfirmed) {
      const loadingToast = toast.loading("O'chirilmoqda...");
      try {
        await groupService.delete(id);
        toast.success("Guruh o'chirildi", { id: loadingToast });
        fetchData();
      } catch (error) {
        toast.error("O'chirishda xatolik", { id: loadingToast });
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
            <HiOutlineUserGroup size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Guruhlar</h1>
            <p className="text-gray-400 text-sm font-medium italic mt-1">Filialdagi barcha o'quv guruhlarini boshqarish.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="text-xs font-black text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl uppercase tracking-[0.2em] border border-blue-100">
            Jami: {groups.length}
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 transition-all active:scale-95 text-sm"
          >
            <HiOutlinePlus size={22} />
            <span>Yangi guruh</span>
          </button>
        </div>
      </div>

      {/* SEARCH SECTION */}
      <div className="relative group max-w-md shadow-lg shadow-blue-100/50 rounded-2xl">
        <HiOutlineSearch size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Guruh nomi yoki kurs bo'yicha qidirish..."
          className="w-full pl-14 pr-6 py-4 bg-white border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold placeholder:font-medium placeholder:text-gray-400 shadow-sm"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* GROUPS TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] w-16">№</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Guruh va Kurs</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Dars jadvali</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">O'qituvchi</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                 <tr><td colSpan="5" className="text-center py-20 font-black text-blue-400 uppercase tracking-widest text-[10px] animate-pulse">Yuklanmoqda...</td></tr>
              ) : filteredGroups.length === 0 ? (
                 <tr><td colSpan="5" className="text-center py-20 font-bold text-gray-400 italic">Guruhlar topilmadi.</td></tr>
              ) : filteredGroups.map((g, index) => (
                <tr key={g.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="p-6 text-sm font-black text-gray-400">{index + 1}</td>
                  <td className="p-5">
                    <div className="font-bold text-gray-800 text-sm tracking-tight">{g.name}</div>
                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-tighter italic">{g.course?.name || 'Kurs belgilanmagan'}</div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 text-gray-700 font-bold text-xs mb-1">
                      <HiOutlineCalendar className="text-blue-400" />
                      {g.days?.length > 0 ? g.days.join(", ") : "Kunlar belgilanmagan"}
                    </div>
                    <div className="text-[10px] font-black text-gray-400 ml-6 uppercase">{g.startTime} - {g.endTime}</div>
                  </td>
                  <td className="p-5">
                     <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-100 w-fit">
                        <HiOutlineUser size={14} />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          {g.teacher?.fullname || "Tayinlanmagan"}
                        </span>
                     </div>
                  </td>
                  <td className="p-5 text-right space-x-1">
                    <button 
                      onClick={() => handleOpenModal(g)} 
                      className="p-2.5 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                    >
                      <HiOutlinePencilAlt size={20} />
                    </button>
                    <button 
                      onClick={() => handleDelete(g.id, g.name)} 
                      className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <HiOutlineTrash size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={resetForm} 
        title={editingId ? "Guruhni tahrirlash" : "Yangi guruh yaratish"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Guruh nomi</label>
              <input 
                value={form.name} 
                placeholder="Masalan: Frontend-01"
                onChange={(e) => setForm({...form, name: e.target.value})} 
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Kurs</label>
              <select 
                value={form.courseId} 
                onChange={(e) => setForm({...form, courseId: e.target.value})} 
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm" 
                required
              >
                <option value="">Kursni tanlang</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            {/* Moved Teacher selection to Modal */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">O'qituvchi</label>
              <select 
                value={form.teacherId} 
                onChange={(e) => setForm({...form, teacherId: e.target.value})} 
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm" 
              >
                <option value="">O'qituvchini tanlang</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.fullname}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Boshlanish sanasi</label>
              <input 
                type="date" 
                value={form.startDate} 
                onChange={(e) => setForm({...form, startDate: e.target.value})} 
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm" 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Vaqti (Dan)</label>
                <input 
                  type="time" 
                  value={form.startTime} 
                  onChange={(e) => setForm({...form, startTime: e.target.value})} 
                  className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Vaqti (Gacha)</label>
                <input 
                  type="time" 
                  value={form.endTime} 
                  onChange={(e) => setForm({...form, endTime: e.target.value})} 
                  className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Hafta kunlari</label>
            <div className="flex flex-wrap gap-2.5">
              {daysList.map(day => (
                <button 
                  key={day.key} 
                  type="button" 
                  onClick={() => handleDayChange(day.key)} 
                  className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${form.days.includes(day.key) ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100 scale-105" : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"}`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-blue-100 transition-all uppercase tracking-widest text-xs mt-4 active:scale-95">
            {editingId ? "O'zgarishlarni saqlash" : "Guruhni yaratish"}
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default AdminGroup;