import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  userService,
  groupService,
  studentGroupService,
} from "../../services/api";
import { 
  HiOutlineUserAdd, 
  HiOutlineSearch, 
  HiOutlineMail, 
  HiOutlinePhone, 
  HiOutlineAcademicCap,
  HiOutlineTrash,
  HiOutlinePencilAlt,
  HiOutlineExclamation,
  HiX,
} from "react-icons/hi";
import toast from "react-hot-toast";

const AdminStudent = () => {
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, type: null });

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    password: "",
  });

  const fetchData = useCallback(async () => {
    if (!user.branchId) return;
    setIsLoading(true);
    try {
      const [userRes, groupRes] = await Promise.all([
        userService.getAll(),
        groupService.getAll(),
      ]);

      const usersData = userRes?.data?.data || userRes?.data || [];
      const groupsData = groupRes?.data?.data || groupRes?.data || [];

      const branchStudents = usersData.filter(
        (u) => u.role === "student" && Number(u.branchId) === Number(user.branchId)
      );
      const branchGroups = groupsData.filter(
        (g) => Number(g.branchId) === Number(user.branchId)
      );

      setStudents(branchStudents);
      setGroups(branchGroups);

      // Student-Group relations
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
      toast.error("Error loading data");
    } finally {
      setIsLoading(false);
    }
  }, [user.branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // DYNAMIC GROUP FINDER: Always gets the latest name from the 'groups' state
  const getStudentGroupInfo = (studentId) => {
    const relation = studentGroups.find((s) => Number(s.studentId) === Number(studentId));
    if (!relation) return null;

    const currentGroup = groups.find((g) => Number(g.id) === Number(relation.groupId));
    return {
      relationId: relation.id,
      groupName: currentGroup ? currentGroup.name : "Unknown Group",
      groupId: relation.groupId
    };
  };

  const resetForm = () => {
    setForm({ fullname: "", email: "", phone: "", password: "" });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleOpenEdit = (student) => {
    setEditingId(student.id);
    setForm({
      fullname: student.fullname,
      email: student.email,
      phone: student.phone,
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
          role: "student"
        };
        if (form.password.trim()) updateData.password = form.password;

        await userService.update(editingId, updateData);
        toast.success("Student updated");
      } else {
        await userService.register({ ...form, role: "student", branchId: user.branchId });
        toast.success("New student added");
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Operation failed");
    }
  };

  const confirmDelete = async () => {
    try {
      if (deleteModal.type === "full") {
        await userService.delete(deleteModal.id);
        toast.success("Student deleted");
      } else {
        await studentGroupService.delete(deleteModal.id);
        toast.success("Removed from group");
      }
      setDeleteModal({ open: false, id: null, type: null });
      fetchData();
    } catch (error) {
      toast.error("Deletion failed");
    }
  };

  const assignStudent = async (studentId, groupId) => {
    if (!groupId) return;
    try {
      await studentGroupService.create({ studentId: Number(studentId), groupId: Number(groupId) });
      toast.success("Assigned to group");
      fetchData();
    } catch (error) {
      toast.error("Already in a group or server error");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-[#f8fafc] min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Students</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Branch: {user.branchId} • {students.length} Total</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <HiOutlineUserAdd size={22} />
          <span>Add New Student</span>
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md group">
        <HiOutlineSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search by name or phone..."
          className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl outline-none shadow-sm focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-50">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Group</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.filter(s => s.fullname.toLowerCase().includes(searchTerm.toLowerCase())).map((student) => {
                const groupInfo = getStudentGroupInfo(student.id);
                return (
                  <tr key={student.id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-700 text-base">{student.fullname}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><HiOutlineMail className="text-slate-300" /> {student.email}</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><HiOutlinePhone className="text-slate-300" /> {student.phone}</div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {groupInfo ? (
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 w-fit">
                          <HiOutlineAcademicCap size={18} />
                          <span className="text-[11px] font-black uppercase tracking-wider">{groupInfo.groupName}</span>
                        </div>
                      ) : (
                        <select
                          onChange={(e) => assignStudent(student.id, e.target.value)}
                          className="text-[11px] font-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer text-slate-400 hover:text-indigo-500"
                        >
                          <option value="">+ Assign Group</option>
                          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button onClick={() => handleOpenEdit(student)} className="p-3 text-amber-500 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"><HiOutlinePencilAlt size={20} /></button>
                        {groupInfo && (
                          <button onClick={() => setDeleteModal({ open: true, id: groupInfo.relationId, type: 'group' })} className="p-3 text-orange-500 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"><HiX size={20} /></button>
                        )}
                        <button onClick={() => setDeleteModal({ open: true, id: student.id, type: 'full' })} className="p-3 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"><HiOutlineTrash size={20} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{editingId ? "Update Profile" : "New Enrollment"}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><HiX size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input value={form.fullname} onChange={(e) => setForm({...form, fullname: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white outline-none" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password {editingId && "(Optional)"}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white outline-none" placeholder={editingId ? "Leave empty to keep current" : "Min 6 characters"} required={!editingId} />
              </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs mt-4">
                {editingId ? "Save Changes" : "Confirm Registration"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${deleteModal.type === 'full' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
              <HiOutlineExclamation size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Are you sure?</h3>
            <p className="text-slate-500 font-medium mb-8 text-sm leading-relaxed">
              {deleteModal.type === 'full' 
                ? "This student will be deleted from the entire system." 
                : "This student will be removed from this group but stays in the system."}
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDelete} className={`w-full text-white font-black py-4 rounded-2xl shadow-lg uppercase text-[10px] tracking-widest ${deleteModal.type === 'full' ? 'bg-red-500 shadow-red-100' : 'bg-orange-500 shadow-orange-100'}`}>Confirm Action</button>
              <button onClick={() => setDeleteModal({ open: false, id: null, type: null })} className="w-full bg-slate-50 text-slate-500 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminStudent;