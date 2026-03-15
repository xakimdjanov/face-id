import React, { useEffect, useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../admin/AdminSidebar";
import { branchService } from "../../services/api";
import { getStoredUser } from "../../utils/auth";
import { HiMenuAlt2, HiOutlineBell, HiOutlineSearch } from "react-icons/hi";

const AdminLayout = () => {
  const [branchName, setBranchName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = getStoredUser();

  const fetchBranchData = useCallback(async () => {
    try {
      if (!user?.branchId) return;
      const res = await branchService.getById(user.branchId);
      setBranchName(res.data?.name || "Main Office");
    } catch (error) {
      console.error("Branch fetch error:", error);
    }
  }, [user?.branchId]);

  useEffect(() => {
    fetchBranchData();
  }, [fetchBranchData]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <AdminSidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          
          {/* Left Side: Branch Info */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 bg-slate-50 text-slate-600 rounded-xl lg:hidden hover:bg-slate-100 transition-colors"
            >
              <HiMenuAlt2 size={24} />
            </button>
            
            <div className="flex flex-col">
              <h2 className="text-md md:text-lg font-black text-slate-800 leading-tight">
                {branchName || "Loading Branch..."}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Management Hub</p>
            </div>
          </div>

          {/* Right Side: User Info & Actions */}
          <div className="flex items-center gap-2 md:gap-6">
            {/* Profile Section */}
            <div className="flex items-center gap-3 pl-2 md:pl-6 border-l border-slate-100">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-700 leading-none truncate max-w-[120px] md:max-w-none">
                  {user?.fullname || "Admin User"}
                </span>
                <span className="text-[9px] font-black text-indigo-500 uppercase mt-1 tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                   {user?.role || "Admin"}
                </span>
              </div>
              
              {/* Dynamic Avatar */}
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100 text-white font-bold text-sm border-2 border-white">
                {user?.fullname ? user.fullname.split(' ').map(n => n[0]).join('').toUpperCase() : "A"}
              </div>
            </div>

          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;