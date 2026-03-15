import React, { useState, useEffect } from "react";
import { branchService } from "../../services/api";
import {
  HiOutlineOfficeBuilding,
  HiOutlineMap,
  HiOutlinePhone,
  HiPlus,
  HiPencilAlt,
  HiTrash,
  HiX,
  HiExclamation,
} from "react-icons/hi";
import { CgSpinner } from "react-icons/cg";
import toast from "react-hot-toast";

const BranchManager = () => {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
  });

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const response = await branchService.getAll();
      setBranches(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error("Failed to load branches");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenForm = (branch = null) => {
    if (branch) {
      setEditingId(branch._id || branch.id);
      setFormData({
        name: branch.name || "",
        address: branch.address || "",
        phone: branch.phone || "",
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", address: "", phone: "" });
    }
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitLoading(true);
    try {
      if (editingId) {
        await branchService.update(editingId, formData);
        toast.success("Updated successfully");
      } else {
        await branchService.register(formData);
        toast.success("Created successfully");
      }
      setShowFormModal(false);
      fetchBranches();
    } catch (error) {
      toast.error("Error occurred");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const loadId = toast.loading("Deleting...");
    try {
      await branchService.delete(deletingId);
      setBranches((prev) => prev.filter((b) => (b._id || b.id) !== deletingId));
      toast.success("Deleted", { id: loadId });
    } catch (error) {
      toast.error("Failed", { id: loadId });
    } finally {
      setShowDeleteModal(false);
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto min-h-screen bg-[#f8fafc]">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-end mb-12 gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Branch <span className="text-blue-600">Directory</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Manage and monitor all active education centers
          </p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-2xl shadow-blue-900/20 active:scale-95"
        >
          <HiPlus size={24} /> Add New Branch
        </button>
      </div>

      {/* LIST SECTION */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <CgSpinner className="animate-spin text-6xl text-blue-900" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {branches.map((branch) => {
            const bId = branch._id || branch.id;
            return (
              <div
                key={bId}
                className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-600 transition-colors duration-500 opacity-20 group-hover:opacity-10"></div>

                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-slate-200 group-hover:bg-blue-700 transition-colors">
                    <HiOutlineOfficeBuilding size={28} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenForm(branch)}
                      className="p-3 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <HiPencilAlt size={22} />
                    </button>
                    <button
                      onClick={() => confirmDelete(bId)}
                      className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <HiTrash size={22} />
                    </button>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-800 mb-6 group-hover:text-blue-900 transition-colors">
                  {branch.name}
                </h3>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-4 text-slate-500 font-medium bg-slate-50 p-3 rounded-xl">
                    <HiOutlineMap
                      className="text-blue-600 shrink-0"
                      size={20}
                    />
                    <span className="truncate">{branch.address}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500 font-medium bg-slate-50 p-3 rounded-xl">
                    <HiOutlinePhone
                      className="text-blue-600 shrink-0"
                      size={20}
                    />
                    <span>{branch.phone}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL (DEEP BLUE) */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-md transition-all">
          {/* Modal Konteyneri: Mobil ekranda to'liq ekran, planshet va kompyuterda max-w-lg */}
          <div className="bg-white w-full h-full sm:h-auto sm:max-w-lg sm:rounded-[2.5rem] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
            {/* Header: Mobil qurilmalarda tepada yopishib turadi */}
            <div className="flex justify-between items-center p-6 sm:p-10 pb-4 sm:pb-0">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 italic leading-tight">
                {editingId ? "Edit" : "Register"}{" "}
                <span className="text-blue-600">Branch</span>
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <HiX className="text-2xl sm:text-[28px]" />
              </button>
            </div>

            {/* Form: Mobil ekranda skroll bo'lishi uchun overflow-y-auto qo'shildi */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-4 sm:py-6 custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Official Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-2 border-slate-100 focus:border-blue-700 focus:bg-white rounded-xl sm:rounded-2xl outline-none transition-all text-slate-900 font-bold text-sm sm:text-base"
                    placeholder="Central Academy"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-2 border-slate-100 focus:border-blue-700 focus:bg-white rounded-xl sm:rounded-2xl outline-none transition-all text-slate-900 font-bold text-sm sm:text-base"
                    placeholder="Street, City, Country"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Business Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-2 border-slate-100 focus:border-blue-700 focus:bg-white rounded-xl sm:rounded-2xl outline-none transition-all text-slate-900 font-bold text-sm sm:text-base"
                    placeholder="+998 00 000 00 00"
                  />
                </div>
              </form>
            </div>

            {/* Footer: Tugmalar har doim pastda ko'rinib turadi */}
            <div className="p-6 sm:p-10 pt-4 sm:pt-6 bg-white sm:rounded-b-[2.5rem]">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="order-2 sm:order-1 flex-1 py-3.5 sm:py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-xl sm:rounded-2xl transition-all text-sm sm:text-base"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  onClick={handleSubmit} // Form tashqarisida bo'lsa mantiqiy ulanish
                  className="order-1 sm:order-2 flex-1 bg-blue-600 text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-blue-500 flex justify-center items-center gap-2 transition-all text-sm sm:text-base"
                >
                  {isSubmitLoading ? (
                    <CgSpinner className="animate-spin text-2xl" />
                  ) : editingId ? (
                    "Save"
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TWO-STEP DELETE CONFIRMATION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in duration-200">
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-red-100 shadow-inner">
              <HiExclamation size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">
              Destroy Record?
            </h2>
            <p className="text-slate-500 mb-10 font-medium leading-relaxed">
              This branch and all linked student records will be purged from the
              system.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
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

export default BranchManager;
