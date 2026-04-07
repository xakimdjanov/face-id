import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  userService,
  groupService,
  studentGroupService,
  employeeService
} from "../../services/api";
import { 
  HiOutlineUserAdd, 
  HiOutlineSearch, 
  HiOutlinePhone, 
  HiOutlineAcademicCap,
  HiOutlineTrash,
  HiOutlinePencilAlt,
  HiOutlineIdentification,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineUserGroup
} from "react-icons/hi";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Swal from "sweetalert2";

const AdminStudent = () => {
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    fullname: "",
    phone: "",
    password: "",
  });

  const fetchData = useCallback(async () => {
    if (!user.branchId) return;
    setIsLoading(true);
    try {
      const [userRes, groupRes, empRes] = await Promise.all([
        userService.getAll(),
        groupService.getAll(),
        employeeService.getAll().catch(() => ({ data: { data: [] } }))
      ]);

      const usersData = userRes?.data?.data || userRes?.data || [];
      const groupsData = groupRes?.data?.data || groupRes?.data || [];
      const employeesData = empRes?.data?.data || empRes?.data || [];

      setEmployees(employeesData);

      const branchStudents = usersData.filter(
        (u) => u.role === "student" && Number(u.branchId) === Number(user.branchId)
      );
      const branchGroups = groupsData.filter(
        (g) => Number(g.branchId) === Number(user.branchId)
      );

      setStudents(branchStudents);
      setGroups(branchGroups);

      let sgCombined = [];
      for (const g of branchGroups) {
        try {
          const res = await studentGroupService.getById(g.id);
          const relationData = res?.data?.data || res?.data || [];
          sgCombined = [...sgCombined, ...relationData];
        } catch (e) { 
          console.warn(`Group ${g.id} has no students`); 
        }
      }
      setStudentGroups(sgCombined);
    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  }, [user.branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStudentGroupInfo = (studentId) => {
    const relation = studentGroups.find((s) => Number(s.studentId) === Number(studentId));
    if (!relation) return null;

    const currentGroup = groups.find((g) => Number(g.id) === Number(relation.groupId));
    return {
      relationId: relation.id,
      groupName: currentGroup ? currentGroup.name : "Noma'lum guruh",
      groupId: relation.groupId
    };
  };

  const resetForm = () => {
    setForm({ fullname: "", phone: "", password: "" });
    setEditingId(null);
    setIsModalOpen(false);
    setShowPassword(false);
  };

  const handleOpenEdit = (student) => {
    setEditingId(student.id);
    setForm({
      fullname: student.fullname,
      phone: student.phone,
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
          role: "student"
        };
        if (form.password.trim()) updateData.password = form.password;

        await userService.update(editingId, updateData);
        toast.success("O'quvchi ma'lumotlari yangilandi", { id: loadingToast });
      } else {
        await userService.register({ ...form, role: "student", branchId: user.branchId });
        toast.success("Yangi o'quvchi muvaffaqiyatli qo'shildi", { id: loadingToast });
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Xatolik yuz berdi", { id: loadingToast });
    }
  };

  const handleDelete = async (id, name, type, relationId) => {
    const result = await Swal.fire({
      title: type === "full" ? "O'quvchini tizimdan o'chirish?" : "Guruhdan chiqarish?",
      text: type === "full" 
        ? `${name} tizimdan butunlay o'chiriladi!` 
        : `${name} ushbu guruhdan chiqariladi, lekin tizimda qoladi.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ha, tasdiqlayman",
      cancelButtonText: "Bekor qilish",
      background: "#ffffff",
      customClass: {
        popup: 'rounded-[2rem]'
      }
    });

    if (result.isConfirmed) {
      const loadingToast = toast.loading("Bajarilmoqda...");
      try {
        if (type === "full") {
          await userService.delete(id);
          toast.success("O'quvchi o'chirildi", { id: loadingToast });
        } else {
          await studentGroupService.delete(relationId);
          toast.success("Guruhdan chiqarildi", { id: loadingToast });
        }
        fetchData();
      } catch (error) {
        toast.error("Xatolik yuz berdi", { id: loadingToast });
      }
    }
  };

  const assignStudent = async (studentId, groupId) => {
    if (!groupId) return;
    const loadingToast = toast.loading("Guruhga qo'shilmoqda...");
    try {
      await studentGroupService.create({ studentId: Number(studentId), groupId: Number(groupId) });
      toast.success("Guruhga muvaffaqiyatli qo'shildi", { id: loadingToast });
      fetchData();
    } catch (error) {
      toast.error("O'quvchi allaqachon boshqa guruhda yoki xatolik", { id: loadingToast });
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => s.fullname.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone?.includes(searchTerm));
  }, [students, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
            <HiOutlineUserGroup size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">O'quvchilar</h1>
            <p className="text-gray-400 text-sm font-medium italic mt-1">Filialdagi barcha o'quvchilarni boshqarish.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="text-xs font-black text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl uppercase tracking-[0.2em] border border-blue-100">
            Jami: {students.length}
          </div>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 transition-all active:scale-95 text-sm"
          >
            <HiOutlineUserAdd size={22} />
            <span>Yangi o'quvchi</span>
          </button>
        </div>
      </div>

      {/* SEARCH SECTION */}
      <div className="relative group max-w-md shadow-lg shadow-blue-100/50 rounded-2xl">
        <HiOutlineSearch size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Ism yoki telefon orqali qidirish..."
          className="w-full pl-14 pr-6 py-4 bg-white border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold placeholder:font-medium placeholder:text-gray-400 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* STUDENTS TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] w-16">№</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">O'quvchi ma'lumotlari</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Aloqa</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Guruh</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Face ID</th>
                <th className="p-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                 <tr><td colSpan="6" className="text-center py-20 font-black text-blue-400 uppercase tracking-widest text-[10px] animate-pulse">Yuklanmoqda...</td></tr>
              ) : filteredStudents.length === 0 ? (
                 <tr><td colSpan="6" className="text-center py-20 font-bold text-gray-400 italic">O'quvchilar topilmadi.</td></tr>
              ) : filteredStudents.map((student, index) => {
                const groupInfo = getStudentGroupInfo(student.id);
                const isLinked = employees.some(e => Number(e.userId) === Number(student.id) || e.phone === student.phone || e.name === student.fullname);
                return (
                  <tr key={student.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="p-6 text-sm font-black text-gray-400">{index + 1}</td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-lg shadow-gray-200">
                          {student.fullname.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-800 text-sm tracking-tight">{student.fullname}</span>
                      </div>
                    </td>
                     <td className="p-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <HiOutlinePhone className="text-blue-400" size={16}/> 
                        {student.phone}
                      </div>
                    </td>
                    <td className="p-5">
                      {groupInfo ? (
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 w-fit">
                          <HiOutlineAcademicCap size={18} />
                          <span className="text-[10px] font-black uppercase tracking-wider">{groupInfo.groupName}</span>
                        </div>
                      ) : (
                        <select
                          onChange={(e) => assignStudent(student.id, e.target.value)}
                          className="text-[10px] font-black bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer text-gray-400 hover:text-blue-600 shadow-sm"
                        >
                          <option value="">+ Guruhga qo'shish</option>
                          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="p-5">
                      {isLinked ? (
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl border border-blue-100 w-fit">
                          <HiOutlineIdentification size={18} />
                          <span className="text-[10px] font-black uppercase tracking-wider">Bog'langan</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-xl border border-amber-100 w-fit opacity-60">
                           <HiOutlineIdentification size={18} />
                           <span className="text-[10px] font-black uppercase tracking-wider">Bog'lanmagan</span>
                        </div>
                      )}
                    </td>
                    <td className="p-5 text-right space-x-1">
                      <button 
                        onClick={() => handleOpenEdit(student)} 
                        className="p-2.5 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                      >
                        <HiOutlinePencilAlt size={20} />
                      </button>
                      {groupInfo && (
                        <button 
                          onClick={() => handleDelete(student.id, student.fullname, 'group', groupInfo.relationId)} 
                          className="p-2.5 text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                          title="Guruhdan chiqarish"
                        >
                          <HiOutlineTrash size={20} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(student.id, student.fullname, 'full')} 
                        className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                        title="Tizimdan o'chirish"
                      >
                        <HiOutlineTrash size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={resetForm} 
        title={editingId ? "O'quvchi ma'lumotlarini tahrirlash" : "Yangi o'quvchi qo'shish"}
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
            {editingId ? "O'zgarishlarni saqlash" : "Ro'yxatdan o'tkazish"}
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default AdminStudent;