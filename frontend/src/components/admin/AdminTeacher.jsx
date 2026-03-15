import React, { useEffect, useState, useCallback } from "react";
import { userService, groupService } from "../../services/api";
import { 
  HiOutlineUserAdd, 
  HiOutlineSearch, 
  HiOutlineMail, 
  HiOutlinePhone, 
  HiOutlineCollection,
  HiOutlineTrash,
  HiOutlinePencilAlt,
  HiOutlineExclamation,
  HiX,
} from "react-icons/hi";
import toast from "react-hot-toast";

const AdminTeacher = () => {
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  const [form, setForm] = useState({
    fullname: "",
    email: "",
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
      toast.error("Error loading teachers");
    }
  }, [user.branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setForm({ fullname: "", email: "", phone: "", password: "" });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleOpenEdit = (teacher) => {
    setEditingId(teacher.id);
    setForm({
      fullname: teacher.fullname,
      email: teacher.email,
      phone: teacher.phone,
      password: "", 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const updateData = {
          fullname: form.fullname,
          email: form.email,
          phone: form.phone,
          branchId: user.branchId,
          role: "teacher"
        };
        if (form.password?.trim()) updateData.password = form.password;

        await userService.update(editingId, updateData);
        toast.success("Teacher updated successfully");
      } else {
        await userService.register({ ...form, role: "teacher", branchId: user.branchId });
        toast.success("New teacher added");
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };

  const confirmDelete = async () => {
    try {
      await userService.delete(deleteModal.id);
      toast.success("Teacher deleted successfully");
      setDeleteModal({ open: false, id: null });
      fetchData();
    } catch (error) {
      toast.error("Deletion failed");
    }
  };

  const getTeacherGroups = (teacherId) => {
    const tg = groups.filter((g) => Number(g.teacherId) === Number(teacherId));
    return tg.length > 0 ? tg.map(g => g.name).join(", ") : "No groups assigned";
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Teachers</h1>
          <p className="text-slate-500 font-medium italic">Manage branch faculty and group assignments</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <HiOutlineUserAdd size={22} />
          <span>Add Teacher</span>
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md group">
        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search by name..."
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl outline-none shadow-sm focus:border-indigo-500 transition-all font-medium text-slate-600"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50 border-b border-slate-50">
              <tr>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Details</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Groups</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {teachers.filter(t => t.fullname.toLowerCase().includes(searchTerm.toLowerCase())).map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-50/40 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-700 text-base">{teacher.fullname}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><HiOutlineMail className="text-indigo-400" size={16}/> {teacher.email}</div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><HiOutlinePhone className="text-indigo-400" size={16}/> {teacher.phone}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl border border-blue-100 w-fit shadow-sm">
                      <HiOutlineCollection size={18} />
                      <span className="text-xs font-black uppercase tracking-wider">{getTeacherGroups(teacher.id)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleOpenEdit(teacher)} className="p-2.5 text-amber-500 bg-amber-50 rounded-xl hover:bg-amber-100 transition-all"><HiOutlinePencilAlt size={20} /></button>
                      <button onClick={() => setDeleteModal({ open: true, id: teacher.id })} className="p-2.5 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-all"><HiOutlineTrash size={20} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-800">{editingId ? "Edit Teacher" : "Add Teacher"}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><HiX size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input value={form.fullname} onChange={(e) => setForm({...form, fullname: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password {editingId && "(Optional)"}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold" placeholder={editingId ? "Leave empty to keep current" : "Min 6 characters"} required={!editingId} />
              </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs mt-4">
                {editingId ? "Update Faculty Member" : "Create Teacher Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
              <HiOutlineExclamation size={44} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Are you sure?</h3>
            <p className="text-slate-500 font-medium mb-8 text-sm">This teacher will be permanently removed from the system.</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDelete} className="w-full bg-red-500 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-red-600 transition-all uppercase text-[10px] tracking-widest">Delete Now</button>
              <button onClick={() => setDeleteModal({ open: false, id: null })} className="w-full bg-slate-50 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-100 transition-all uppercase text-[10px] tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeacher;