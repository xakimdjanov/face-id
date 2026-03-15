import React, { useEffect, useState, useCallback } from "react";
import { branchService, userService } from "../../services/api";
import { 
  HiOutlineSearch, HiOutlineFilter, HiOutlineUsers, 
  HiOutlineOfficeBuilding, HiOutlineIdentification,
  HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineExclamation
} from "react-icons/hi";
import { CgSpinner } from "react-icons/cg";
import toast from "react-hot-toast";

const SuperUsers = () => {
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    fullname: "", email: "", phone: "", branchId: "", role: ""
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [branchRes, userRes] = await Promise.all([
        branchService.getAll(),
        userService.getAll()
      ]);
      setBranches(branchRes.data || []);
      setUsers(userRes.data || []);
      setFilteredUsers(userRes.data || []);
    } catch (error) {
      toast.error("Error loading users data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filtering Logic
  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedBranch) {
      filtered = filtered.filter(u => u.branchId === Number(selectedBranch));
    }
    if (selectedRole) {
      filtered = filtered.filter(u => u.role === selectedRole);
    }
    setFilteredUsers(filtered);
  }, [searchTerm, selectedBranch, selectedRole, users]);

  // Handlers
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditForm({
      fullname: user.fullname,
      email: user.email,
      phone: user.phone || "",
      branchId: user.branchId || "",
      role: user.role
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await userService.update(selectedUser.id, editForm);
      toast.success("User updated successfully");
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    setFormLoading(true);
    try {
      await userService.delete(selectedUser.id);
      toast.success("User deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setFormLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'superadmin': return 'bg-slate-900 text-white border-slate-900';
      case 'admin': return 'bg-red-50 text-red-600 border-red-100';
      case 'manager': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'teacher': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'student': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 p-4 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight uppercase">User Management</h1>
          <p className="text-gray-500 text-sm">Control access levels and manage system personnel.</p>
        </div>
        <div className="flex items-center self-start md:self-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-5 py-2.5 rounded-2xl">
          <HiOutlineUsers size={20} />
          TOTAL: {filteredUsers.length}
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" placeholder="Search users..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm"
          />
        </div>

        <div className="relative">
          <HiOutlineOfficeBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div className="relative">
          <HiOutlineIdentification className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {(searchTerm || selectedBranch || selectedRole) && (
          <button 
            onClick={() => {setSearchTerm(""); setSelectedBranch(""); setSelectedRole("");}} 
            className="text-red-500 text-sm font-bold hover:bg-red-50 rounded-2xl py-3 transition-colors uppercase tracking-wider"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* USERS TABLE */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Details</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">System Role</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Branch</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center"><CgSpinner className="animate-spin text-4xl text-blue-600 mx-auto" /></td></tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {user.fullname?.charAt(0)}
                        </div>
                        <p className="font-bold text-gray-800 tracking-tight">{user.fullname}</p>
                      </div>
                    </td>
                    <td className="p-5 text-sm">
                      <p className="font-semibold text-gray-700">{user.email}</p>
                      <p className="text-gray-400 text-xs">{user.phone || "No phone"}</p>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-5 text-sm font-bold text-gray-600">
                      {user.branch?.name || <span className="text-gray-300 font-normal italic">Global</span>}
                    </td>
                    <td className="p-5 text-right">
                      {user.role !== "superadmin" ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEditClick(user)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><HiOutlinePencil size={18} /></button>
                          <button onClick={() => handleDeleteClick(user)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><HiOutlineTrash size={18} /></button>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-gray-300 uppercase px-2 py-1 border border-gray-100 rounded">Protected</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="p-20 text-center text-gray-400">No matching users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL (RESPONSIVE) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-6 md:p-8 flex justify-between items-center border-b border-gray-100">
              <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tighter">Edit User Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"><HiOutlineX size={24} /></button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 md:p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Full Name</label>
                <input type="text" required value={editForm.fullname} onChange={(e) => setEditForm({...editForm, fullname: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm"/>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Email & Phone</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="email" required value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm"/>
                  <input type="text" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm"/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Role Assignment</label>
                  <select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm cursor-pointer appearance-none">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Branch</label>
                  <select value={editForm.branchId} onChange={(e) => setEditForm({...editForm, branchId: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm cursor-pointer appearance-none">
                    <option value="">Global / None</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <button disabled={formLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95 mt-4">
                {formLoading ? <CgSpinner className="animate-spin text-2xl mx-auto" /> : "SAVE CHANGES"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL (RESPONSIVE) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 md:p-10 relative text-center animate-in zoom-in duration-200">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiOutlineExclamation size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tighter">Are you sure?</h2>
            <p className="text-gray-500 text-sm mb-8">
              You are about to delete <span className="font-bold text-gray-800">{selectedUser?.fullname}</span>. This action is permanent.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all">CANCEL</button>
              <button onClick={confirmDelete} disabled={formLoading} className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-95 flex items-center justify-center">
                {formLoading ? <CgSpinner className="animate-spin text-xl" /> : "DELETE USER"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperUsers;  