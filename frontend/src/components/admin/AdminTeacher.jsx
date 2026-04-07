import React, { useEffect, useState, useCallback } from "react";
import { userService, groupService } from "../../services/api";
import { 
  HiOutlineUserAdd, 
  HiOutlineSearch, 
  HiOutlinePhone, 
  HiOutlineAcademicCap,
  HiOutlineTrash,
  HiOutlinePencilAlt,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff
} from "react-icons/hi";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Swal from "sweetalert2";

const AdminTeacher = () => {
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    fullname: "",
    phone: "",
    password: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [userRes, groupRes] = await Promise.all([
        userService.getAll(),
        groupService.getAll(),
      ]);

      const usersData = userRes?.data?.data || userRes?.data || [];
      const groupsData = groupRes?.data?.data || groupRes?.data || [];

      const branchTeachers = usersData.filter(
        (u) => u.role === "teacher" && Number(u.branchId) === Number(user.branchId)
      );
      const branchGroups = groupsData.filter(
        (g) => Number(g.branchId) === Number(user.branchId)
      );

      setTeachers(branchTeachers);
      setGroups(branchGroups);
    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    }
  }, [user.branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setForm({ fullname: "", phone: "", password: "" });
    setEditingId(null);
    setIsModalOpen(false);
    setShowPassword(false);
  };

  const handleOpenEdit = (teacher) => {
    setEditingId(teacher.id);
    setForm({
      fullname: teacher.fullname,
      phone: teacher.phone,
      password: "", 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingId ? "Yangilanmoqda..." : "Yaratilmoqda...");
    try {
      if (editingId) {
        const updateData = {
          fullname: form.fullname,
          phone: form.phone,
          branchId: user.branchId,
          role: "teacher"
        };
        if (form.password?.trim()) updateData.password = form.password;

        await userService.update(editingId, updateData);
        toast.success("O'qituvchi ma'lumotlari yangilandi", { id: loadingToast });
      } else {
        await userService.register({ ...form, role: "teacher", branchId: user.branchId });
        toast.success("Yangi o'qituvchi muvaffaqiyatli qo'shildi", { id: loadingToast });
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Xatolik yuz berdi", { id: loadingToast });
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "O'chirishni tasdiqlaysizmi?",
      text: `${name} o'qituvchisi tizimdan butunlay o'chiriladi!`,
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
        await userService.delete(id);
        toast.success("O'qituvchi o'chirildi", { id: loadingToast });
        fetchData();
      } catch (error) {
        toast.error("O'chirishda xatolik yuz berdi", { id: loadingToast });
      }
    }
  };

  const getTeacherGroups = (teacherId) => {
    const tg = groups.filter((g) => Number(g.teacherId) === Number(teacherId));
    return tg.length > 0 ? tg.map(g => g.name).join(", ") : "Guruhlar biriktirilmagan";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
            <HiOutlineAcademicCap size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">O'qituvchilar</h1>
            <p className="text-gray-400 text-sm font-medium italic mt-1">Filial o'qituvchilari va ularning ish faoliyatini boshqarish.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="text-xs font-black text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl uppercase tracking-[0.2em] border border-blue-100">
            Jami: {teachers.length}
          </div>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 transition-all active:scale-95 text-sm"
          >
            <HiOutlineUserAdd size={22} />
            <span>Yangi o'qituvchi</span>
          </button>
        </div>
      </div>

      {/* SEARCH SECTION */}
      <div className="relative group max-w-md shadow-lg shadow-blue-100/50 rounded-2xl">
        <HiOutlineSearch size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Ism bo'yicha qidirish..."
          className="w-full pl-14 pr-6 py-4 bg-white border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold placeholder:font-medium placeholder:text-gray-400 shadow-sm"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TEACHERS TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] w-16">№</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">O'qituvchi ismi</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Aloqa ma'lumotlari</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Biriktirilgan guruhlar</th>
                <th className="p-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {teachers.filter(t => t.fullname.toLowerCase().includes(searchTerm.toLowerCase())).map((teacher, index) => (
                <tr key={teacher.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="p-6 text-sm font-black text-gray-400">{index + 1}</td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-lg shadow-gray-200">
                        {teacher.fullname.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-800 text-sm tracking-tight">{teacher.fullname}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                      <HiOutlinePhone className="text-blue-400" size={16}/> 
                      {teacher.phone}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl border border-blue-100 w-fit">
                      <HiOutlineAcademicCap size={18} />
                      <span className="text-[10px] font-black uppercase tracking-wider">{getTeacherGroups(teacher.id)}</span>
                    </div>
                  </td>
                  <td className="p-5 text-right space-x-1">
                    <button 
                      onClick={() => handleOpenEdit(teacher)} 
                      className="p-2.5 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                    >
                      <HiOutlinePencilAlt size={20} />
                    </button>
                    <button 
                      onClick={() => handleDelete(teacher.id, teacher.fullname)} 
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
        title={editingId ? "O'qituvchi ma'lumotlarini tahrirlash" : "Yangi o'qituvchi qo'shish"}
      >
        <form onSubmit={handleSubmit} className="p-2 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">To'liq ismi</label>
            <input 
              value={form.fullname} 
              onChange={(e) => setForm({...form, fullname: e.target.value})} 
              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" 
              placeholder="Masalan: Eshmatov Toshmat"
              required 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Telefon raqami</label>
            <div className="relative">
              <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                value={form.phone} 
                onChange={(e) => setForm({...form, phone: e.target.value})} 
                className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" 
                placeholder="+998901234567"
                required 
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Parol {editingId && "(Ixtiyoriy)"}</label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type={showPassword ? "text" : "password"} 
                value={form.password} 
                onChange={(e) => setForm({...form, password: e.target.value})} 
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" 
                placeholder={editingId ? "O'zgarishsiz qoldirish" : "Kamida 6 ta belgi"} 
                required={!editingId} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
              </button>
            </div>
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-blue-100 transition-all uppercase tracking-widest text-xs mt-4 active:scale-95">
            {editingId ? "O'zgarishlarni saqlash" : "O'qituvchini qo'shish"}
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default AdminTeacher;