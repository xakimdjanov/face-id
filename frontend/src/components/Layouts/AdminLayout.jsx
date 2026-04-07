import React, { useEffect, useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../admin/AdminSidebar";
import { branchService } from "../../services/api";
import { getStoredUser } from "../../utils/auth";
import { HiMenuAlt2 } from "react-icons/hi";

const AdminLayout = () => {
  const [branchName, setBranchName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = getStoredUser();

  const fetchBranchData = useCallback(async () => {
    try {
      if (!user?.branchId) return;
      const res = await branchService.getById(user.branchId);
      setBranchName(res.data?.name || "Asosiy filial");
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
        <header className="h-16 bg-white border-b border-slate-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 rounded-xl lg:hidden hover:bg-slate-50 transition-colors"
            >
              <HiMenuAlt2 size={24} />
            </button>
            
            <h2 className="text-sm md:text-base font-bold text-slate-700 tracking-tight">
              {branchName || "Yuklanmoqda..."}
            </h2>
          </div>

          {/* Right Side: Empty for Minimalism, or small indicator */}
          <div className="flex items-center gap-4">
             {/* No Extra elements for Minimalism */}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;