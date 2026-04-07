import React, { useEffect, useState, useCallback } from "react";
import { branchService, userService } from "../../services/api";
import { 
  HiOutlineUserAdd, HiOutlineUsers, 
  HiOutlinePhone, HiOutlineX, HiOutlinePencil, HiOutlineTrash,
  HiOutlineExclamation
} from "react-icons/hi";
import { CgSpinner } from "react-icons/cg";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import Modal from "../ui/Modal";

const SuperManager = () => {
  const [branches, setBranches] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [managerForm, setManagerForm] = useState({
    fullname: "", password: "", phone: "", branchId: ""
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [branchRes, userRes] = await Promise.all([
        branchService.getAll(),
        userService.getAll()
      ]);
      setBranches(branchRes.data || []);
      setManagers((userRes.data || []).filter(u => u.role === "manager"));
    } catch (error) {
      toast.error("Failed to load data!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenModal = (manager = null) => {
    if (manager) {
      setEditingManager(manager);
      setManagerForm({
        fullname: manager.fullname,
        phone: manager.phone || "",
        branchId: manager.branch?.id || manager.branchId || "",
        password: "",
      });
    } else {
      setEditingManager(null);
      setManagerForm({ fullname: "", password: "", phone: "", branchId: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const payload = { ...managerForm, branchId: managerForm.branchId ? Number(managerForm.branchId) : null, role: "manager" };
    if (editingManager && !managerForm.password) delete payload.password;

    try {
      if (editingManager) {
        await userService.update(editingManager.id, payload);
        toast.success("Manager updated!");
      } else {
        await userService.register(payload);
        toast.success("Manager created!");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error saving manager");
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "O'chirish?",
      text: `${name} rahbarligidagi ma'lumotlarni o'chirib tashlamoqchimisiz?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ha, o'chirish",
      cancelButtonText: "Bekor qilish",
      background: "#ffffff",
      color: "#1e293b",
      customClass: {
        popup: 'rounded-[2rem]'
      }
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await userService.delete(id);
        toast.success("Manager deleted successfully");
        fetchData();
      } catch (error) {
        toast.error("Error deleting manager");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-10 p-4">
      
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Filial rahbarlari</h1>
          <p className="text-gray-400 text-sm font-medium italic">Tizimdagi barcha filial rahbarlari ro'yxati</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95"
        >
          <HiOutlineUserAdd size={22} /> YANGI RAHBAR
        </button>
      </header>

      {/* FULL WIDTH MANAGER DIRECTORY */}
      <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden w-full">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
          <div className="flex items-center gap-3">
            <HiOutlineUsers className="text-blue-500" size={26} />
            <h2 className="text-xl font-bold text-gray-800">Rahbarlar ro'yxati</h2>
          </div>
          <span className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            JAMI: {managers.length}
          </span>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-20"><CgSpinner className="animate-spin text-5xl text-blue-600" /></div>
          ) : (
            managers.map((m) => (
              <div key={m.id} className="p-6 bg-gray-50/50 border border-gray-100 rounded-[2.2rem] hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all group relative">
                <div className="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => handleOpenModal(m)} className="p-2.5 bg-white text-blue-600 rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition-all"><HiOutlinePencil size={18} /></button>
                  <button onClick={() => confirmDelete(m.id, m.fullname)} className="p-2.5 bg-white text-red-600 rounded-xl shadow-sm hover:bg-red-600 hover:text-white transition-all"><HiOutlineTrash size={18} /></button>
                </div>

                <div className="space-y-4">
                  <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                    {m.fullname.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg uppercase truncate pr-10">{m.fullname}</h3>
                    <div className="inline-block px-3 py-1 bg-white border border-gray-200 text-gray-500 rounded-lg text-[11px] font-bold mt-2 uppercase">
                      {m.branch?.name || "Tayinlanmagan"}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-500 border-t border-gray-100 pt-4">
                    <p className="flex items-center gap-2 font-bold text-gray-700"><HiOutlinePhone className="shrink-0" /> {m.phone || "N/A"}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CREATE/EDIT MODAL */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingManager ? "Rahbar ma'lumotlarini tahrirlash" : "Yangi rahbar qo'shish"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <input 
              type="text" required placeholder="To'liq ismi (F.I.SH)" value={managerForm.fullname} 
              onChange={(e) => setManagerForm({...managerForm, fullname: e.target.value})} 
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium"
            />
            <input 
              type="text" required placeholder="Telefon raqami (+9989...)" value={managerForm.phone} 
              onChange={(e) => setManagerForm({...managerForm, phone: e.target.value})} 
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium"
            />
            <input 
              type="password" required={!editingManager} placeholder="Parol" value={managerForm.password} 
              onChange={(e) => setManagerForm({...managerForm, password: e.target.value})} 
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium"
            />
            <select 
              value={managerForm.branchId} 
              onChange={(e) => setManagerForm({...managerForm, branchId: e.target.value})} 
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm cursor-pointer font-medium"
            >
              <option value="">Filialni tanlang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <button 
            disabled={formLoading} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-lg transition-all active:scale-95"
          >
            {formLoading ? <CgSpinner className="animate-spin text-2xl mx-auto" /> : "TASDIQLASH VA SAQLASH"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default SuperManager;