import React, { useEffect, useState } from "react";
import { userService } from "../../services/api";
import { 
  HiOutlineUserAdd, HiOutlineLockClosed, 
  HiOutlinePhone, HiOutlineShieldCheck, HiOutlineUserGroup,
  HiPlus, HiX, HiOutlineTrash, HiOutlinePencilAlt,
  HiOutlineEye, HiOutlineEyeOff
} from "react-icons/hi";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Swal from "sweetalert2";

const ManagerAdmin = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [admins, setAdmins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ fullname: "", password: "", phone: "" });

  const getAdmins = async () => {
    try {
      const res = await userService.getAll();
      const branchAdmins = res.data.filter(
        (u) => u.role === "admin" && u.branchId === user.branchId
      );
      setAdmins(branchAdmins);
    } catch (error) {
      toast.error("Failed to fetch administrators");
    }
  };

  useEffect(() => { getAdmins(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const createAdmin = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(isEdit ? "Yangilanmoqda..." : "Administrator yaratilyapti...");
    try {
      if (isEdit) {
        await userService.update(editingId, { ...form, role: "admin", branchId: user.branchId });
        toast.success("Muvaffaqiyatli yangilandi!", { id: loadingToast });
      } else {
        await userService.register({ ...form, role: "admin", branchId: user.branchId });
        toast.success("Administrator muvaffaqiyatli qo'shildi!", { id: loadingToast });
      }
      setForm({ fullname: "", password: "", phone: "" });
      setIsModalOpen(false);
      setIsEdit(false);
      setEditingId(null);
      getAdmins();
    } catch (error) {
      toast.error("Xatolik yuz berdi", { id: loadingToast });
    }
  };

  const handleEdit = (admin) => {
    setIsEdit(true);
    setEditingId(admin.id);
    setForm({ fullname: admin.fullname, password: "", phone: admin.phone });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setIsEdit(false);
    setEditingId(null);
    setForm({ fullname: "", password: "", phone: "" });
    setIsModalOpen(true);
  };

  const deleteAdmin = async (id, name) => {
    const result = await Swal.fire({
      title: "O'chirish?",
      text: `${name} administratorini tizimdan o'chirmoqchimisiz?`,
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
        toast.success("O'chirildi", { id: loadingToast });
        getAdmins();
      } catch (error) {
        toast.error("Xatolik", { id: loadingToast });
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
            <HiOutlineShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Administratorlar</h1>
            <p className="text-gray-400 text-sm font-medium italic mt-1">Filial xodimlarining tizimga kirish huquqlarini boshqarish.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="text-xs font-black text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl uppercase tracking-[0.2em] border border-blue-100">
            Jami: {admins.length}
          </div>
          <button 
            onClick={openAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 transition-all active:scale-95 text-sm"
          >
            <HiPlus size={22} />
            <span>Yangi admin</span>
          </button>
        </div>
      </div>

      {/* ADMINS TABLE */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] w-16">№</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Administrator</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Aloqa</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Holat</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {admins.map((admin, index) => (
                <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6 text-sm font-black text-gray-400">{index + 1}</td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-blue-600">
                        {admin.fullname.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-800 text-sm">{admin.fullname}</span>
                    </div>
                  </td>
                   <td className="p-5 font-bold text-gray-700">
                    {admin.phone || "Telefon kiritilmagan"}
                  </td>
                  <td className="p-5 text-center">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Faol</span>
                  </td>
                  <td className="p-5 text-right space-x-1">
                    <button 
                      onClick={() => handleEdit(admin)}
                      className="p-2.5 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                    >
                      <HiOutlinePencilAlt size={20} />
                    </button>
                    <button 
                      onClick={() => deleteAdmin(admin.id, admin.fullname)}
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

      {/* CREATE MODAL */}
      <Modal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} 
        title={isEdit ? "Adminni tahrirlash" : "Yangi administrator"}
      >
        <form onSubmit={createAdmin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest">To'liq ismi</label>
            <div className="relative">
              <HiOutlineUserGroup className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="fullname" placeholder="Ism familiya" value={form.fullname} onChange={handleChange} className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all font-medium" required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest">Parol</label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder={isEdit ? "O'zgarishsiz qoldirish" : "••••••••"} 
                value={form.password} 
                onChange={handleChange} 
                className="w-full pl-11 pr-12 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all font-medium" 
                required={!isEdit} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
              >
                {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-1 mb-6">
            <label className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest">Telefon raqami</label>
            <div className="relative">
              <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="phone" placeholder="+9989........" value={form.phone} onChange={handleChange} className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all font-medium" required />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-[0.98] uppercase tracking-widest text-xs">
            {isEdit ? "O'zgarishlarni saqlash" : "Adminni yaratish"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ManagerAdmin;