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

const ManagerCourse = () => {
  // Retrieve user data from LocalStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const branchId = user.branchId;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Data States
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "" });

  // Fetch and filter courses by branchId
  const fetchCourses = useCallback(async () => {
    if (!branchId) {
      toast.error("Branch ID not found. Please log in again.");
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
      toast.error("Failed to load courses");
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
    const loadingToast = toast.loading(editingId ? "Updating..." : "Creating...");
    
    // Inject branchId into the payload
    const payload = { 
      ...form, 
      branchId: Number(branchId) 
    };

    try {
      if (editingId) {
        await courseService.update(editingId, payload);
        toast.success("Course updated successfully", { id: loadingToast });
      } else {
        await courseService.register(payload);
        toast.success("New course added to your branch", { id: loadingToast });
      }
      setIsFormModalOpen(false);
      fetchCourses();
    } catch (error) {
      toast.error("An error occurred", { id: loadingToast });
    }
  };

  // --- Delete Modal Handlers ---
  const openDeleteModal = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const loadingToast = toast.loading("Deleting...");
    try {
      await courseService.delete(deletingId);
      toast.success("Course removed", { id: loadingToast });
      setCourses(prev => prev.filter(c => c.id !== deletingId));
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error("Delete failed", { id: loadingToast });
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <HiOutlineAcademicCap size={30} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Course Management</h1>
          </div>
        </div>
        
        <button 
          onClick={() => openFormModal()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95"
        >
          <HiOutlinePlus size={20} /> Add New Course
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Course Title</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="4" className="p-20 text-center"><CgSpinner className="animate-spin text-3xl text-indigo-600 mx-auto" /></td></tr>
              ) : courses.length > 0 ? (
                courses.map((course) => (
                  <tr key={course.id} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="p-6 font-bold text-gray-700 tracking-tight">{course.name}</td>
                    <td className="p-6 font-black text-indigo-600">
                      {Number(course.price).toLocaleString()} 
                      <small className="text-[10px] text-gray-400 ml-1 uppercase">uzs</small>
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-black text-gray-500 uppercase">
                        {course.duration} Months
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
                        onClick={() => openDeleteModal(course.id)}
                        className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <HiOutlineTrash size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-gray-400 italic">
                    No courses found for this branch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsFormModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-gray-50">
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                {editingId ? "Edit Course" : "Create New Course"}
              </h2>
              <button onClick={() => setIsFormModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><HiX size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Course Name</label>
                <div className="relative">
                  <HiOutlineBookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-semibold"
                    placeholder="e.g. Full-stack Development"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (UZS)</label>
                  <div className="relative">
                    <HiOutlineCurrencyDollar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-semibold"
                      placeholder="Price"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Duration (Months)</label>
                  <div className="relative">
                    <HiOutlineClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-semibold"
                      placeholder="Months"
                      required
                    />
                  </div>
                </div>
              </div>

              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] uppercase tracking-widest text-sm mt-4">
                {editingId ? "Save Changes" : "Confirm & Initialize"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DANGER DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiOutlineExclamation size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Are you sure?</h3>
            <p className="text-gray-500 text-sm font-medium mb-8">
              This action cannot be undone. All data associated with this course will be permanently removed.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                Yes, Delete Course
              </button>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-400 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerCourse;