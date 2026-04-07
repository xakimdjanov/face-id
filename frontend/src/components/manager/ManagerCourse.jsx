import React, { useEffect, useState, useCallback } from "react";
import { courseService } from "../../services/api";
import { 
  HiOutlineBookOpen, 
  HiOutlineCurrencyDollar, 
  HiOutlineClock, 
  HiOutlinePlus, 
  HiOutlineTrash,
  HiOutlineAcademicCap,
  HiOutlinePencilAlt,
  HiX,
  HiOutlineExclamation
} from "react-icons/hi";
import { CgSpinner } from "react-icons/cg";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Swal from "sweetalert2";

const ManagerCourse = () => {
  // Retrieve user data from LocalStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const branchId = user.branchId;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  
  // Data States
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "" });

  // Fetch and filter courses by branchId
  const fetchCourses = useCallback(async () => {
    if (!branchId) {
      toast.error("Filial ID topilmadi. Qaytadan kiring.");
      return;
    }
    setLoading(true);
    try {
      const res = await courseService.getAll();
      // Handle different API response formats
      const allCourses = res.data?.data || res.data || [];
      
      // FILTER: Only show courses belonging to this branch
      const myBranchCourses = allCourses.filter(
        (course) => Number(course.branchId) === Number(branchId)
      );
      
      setCourses(myBranchCourses);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Kurslarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // --- Form Modal Handlers ---
  const openFormModal = (course = null) => {
    if (course) {
      setEditingId(course.id);
      setForm({ name: course.name, price: course.price, duration: course.duration });
    } else {
      setEditingId(null);
      setForm({ name: "", price: "", duration: "" });
    }
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingId ? "Yangilanmoqda..." : "Yaratilmoqda...");
    
    // Inject branchId into the payload
    const payload = { 
      ...form, 
      branchId: Number(branchId) 
    };

    try {
      if (editingId) {
        await courseService.update(editingId, payload);
        toast.success("Kurs muvaffaqiyatli yangilandi", { id: loadingToast });
      } else {
        await courseService.register(payload);
        toast.success("Yangi kurs muvaffaqiyatli qo'shildi", { id: loadingToast });
      }
      setIsFormModalOpen(false);
      fetchCourses();
    } catch (error) {
      toast.error("Xatolik yuz berdi", { id: loadingToast });
    }
  };

  // --- Delete Handler ---
  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "O'chirish?",
      text: `${name} kursini butunlay o'chirib tashlamoqchimisiz?`,
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
        await courseService.delete(id);
        toast.success("Kurs o'chirildi", { id: loadingToast });
        setCourses(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        toast.error("Xatolik yuz berdi", { id: loadingToast });
      }
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
            <HiOutlineAcademicCap size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Kurslar</h1>
            <p className="text-gray-400 text-sm font-medium italic mt-1">Filialdagi barcha o'quv kurslarini boshqarish.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="text-xs font-black text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl uppercase tracking-[0.2em] border border-blue-100">
            Jami: {courses.length}
          </div>
          <button 
            onClick={() => openFormModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-100 active:scale-95"
          >
            <HiOutlinePlus size={22} /> Yangi kurs qo'shish
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] w-16">№</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Kurs nomi</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Narxi</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Davomiyligi</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center"><CgSpinner className="animate-spin text-3xl text-blue-600 mx-auto" /></td></tr>
              ) : courses.length > 0 ? (
                courses.map((course, index) => (
                  <tr key={course.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="p-6 text-sm font-black text-gray-400">{index + 1}</td>
                    <td className="p-6 font-bold text-gray-700 tracking-tight">{course.name}</td>
                    <td className="p-6 font-black text-blue-600">
                      {Number(course.price).toLocaleString()} 
                      <small className="text-[10px] text-gray-400 ml-1 uppercase">uzs</small>
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-black text-gray-500 uppercase">
                        {course.duration} Oy
                      </span>
                    </td>
                    <td className="p-6 text-right space-x-2">
                      <button 
                        onClick={() => openFormModal(course)}
                        className="p-2.5 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                      >
                        <HiOutlinePencilAlt size={20} />
                      </button>
                      <button 
                        onClick={() => handleDelete(course.id, course.name)}
                        className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <HiOutlineTrash size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-20 text-center text-gray-400 italic font-medium">
                    Ushbu filialda kurslar topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      <Modal 
        isOpen={isFormModalOpen} 
        onClose={() => setIsFormModalOpen(false)} 
        title={editingId ? "Kursni tahrirlash" : "Yangi kurs yaratish"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kursning to'liq nomi</label>
            <div className="relative">
              <HiOutlineBookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-semibold"
                placeholder="Masalan: Full-stack dasturlash"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Narxi (UZS)</label>
              <div className="relative">
                <HiOutlineCurrencyDollar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-semibold"
                  placeholder="Narxi"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Davomiyligi (Oy)</label>
              <div className="relative">
                <HiOutlineClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-semibold"
                  placeholder="Oy"
                  required
                />
              </div>
            </div>
          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-blue-100 transition-all active:scale-[0.98] uppercase tracking-widest text-sm mt-4">
            {editingId ? "O'zgarishlarni saqlash" : "Tasdiqlash va saqlash"}
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default ManagerCourse;