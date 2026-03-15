import React, { useEffect, useState } from "react";
import { userService } from "../../services/api";
import { 
  HiOutlineUserAdd, HiOutlineMail, HiOutlineLockClosed, 
  HiOutlinePhone, HiOutlineAcademicCap, HiPlus, HiX 
} from "react-icons/hi";
import toast from "react-hot-toast";

const ManagerTeacher = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    phone: ""
  });

  const getTeachers = async () => {
    try {
      const res = await userService.getAll();
      const branchTeachers = res.data.filter(
        (u) => u.role === "teacher" && u.branchId === user.branchId
      );
      setTeachers(branchTeachers);
    } catch (error) {
      toast.error("Failed to fetch teachers");
    }
  };

  useEffect(() => {
    getTeachers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createTeacher = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Creating teacher profile...");
    try {
      await userService.register({
        ...form,
        role: "teacher",
        branchId: user.branchId
      });
      toast.success("Teacher profile created!", { id: loadingToast });
      setForm({ fullname: "", email: "", password: "", phone: "" });
      setIsModalOpen(false);
      getTeachers();
    } catch (error) {
      toast.error("Error creating teacher profile", { id: loadingToast });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Academic Faculty</h1>
          <p className="text-gray-500 text-sm">Manage teachers and instructors for this branch.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
          <HiPlus size={20} />
          <span>Add Teacher</span>
        </button>
      </div>

      {/* TEACHERS TABLE */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Teacher Name</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Details</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Department</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-lg">
                          {teacher.fullname.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{teacher.fullname}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-black">Staff Member</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-medium text-gray-600">{teacher.email}</p>
                      <p className="text-xs text-gray-400">{teacher.phone || "No phone provided"}</p>
                    </td>
                    <td className="p-5 text-center">
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        General
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-20 text-center text-gray-400 italic">
                    No teachers registered in this branch yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD TEACHER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <HiOutlineAcademicCap size={24}/>
                </div>
                <h2 className="text-xl font-black text-gray-800">New Teacher</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <HiX size={20}/>
              </button>
            </div>

            <form onSubmit={createTeacher} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-2 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <HiOutlineUserAdd className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    name="fullname" 
                    placeholder="Enter full name" 
                    value={form.fullname} 
                    onChange={handleChange} 
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-2 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="teacher@academy.com" 
                    value={form.email} 
                    onChange={handleChange} 
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-2 uppercase tracking-widest">Access Password</label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="password" 
                    name="password" 
                    placeholder="••••••••" 
                    value={form.password} 
                    onChange={handleChange} 
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <label className="text-xs font-bold text-gray-400 ml-2 uppercase tracking-widest">Phone Number</label>
                <div className="relative">
                  <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    name="phone" 
                    placeholder="+998 90 --- -- --" 
                    value={form.phone} 
                    onChange={handleChange} 
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
              >
                Create Faculty Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTeacher;