import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import StudentSidebar from "../student/StudentSidebar";
import { branchService } from "../../services/api";
import { getStoredUser } from "../../utils/auth";
import { HiOutlineMenuAlt2 } from "react-icons/hi";

const StudentLayout = () => {
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getStoredUser();

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        if (!user?.branchId) return;
        setLoading(true);
        const res = await branchService.getById(user.branchId);
        setBranchName(res.data?.name || res.data?.data?.name || "Asosiy filial");
      } catch (error) {
        console.error("Branch fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBranch();
  }, [user?.branchId]);

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <StudentSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-sm">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-600 rounded-xl lg:hidden hover:bg-slate-50"
            >
              <HiOutlineMenuAlt2 size={24} />
            </button>

            <h2 className="text-sm md:text-base font-bold text-slate-700 tracking-tight">
              {loading ? "Yuklanmoqda..." : branchName || "Asosiy filial"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
             {/* Minimalist Header */}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;