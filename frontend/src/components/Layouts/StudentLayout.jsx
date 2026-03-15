import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import StudentSidebar from "../student/StudentSidebar";
import { branchService } from "../../services/api";
import { getStoredUser } from "../../utils/auth";
import { HiOutlineOfficeBuilding, HiOutlineBell, HiOutlineMenuAlt2 } from "react-icons/hi";
import { FiLoader } from "react-icons/fi";

const StudentLayout = () => {
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar holati
  const user = getStoredUser();

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        if (!user?.branchId) return;
        setLoading(true);
        const res = await branchService.getById(user.branchId);
        setBranchName(res.data?.name || res.data?.data?.name || "Main Campus");
      } catch (error) {
        console.error("Branch fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBranch();
  }, [user?.branchId]);

  const userInitials = user?.fullname
    ? user.fullname.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "ST";

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar - Props orqali holatni uzatamiz */}
      <StudentSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Container - md:ml-72 sidebar uchun joy ochadi */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-72 overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-slate-50 text-slate-600 rounded-xl md:hidden"
            >
              <HiOutlineMenuAlt2 size={24} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 hidden sm:flex">
                <HiOutlineOfficeBuilding size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Current Branch</p>
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  {loading ? <FiLoader className="animate-spin" /> : branchName || "Loading..."}
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-3 pl-2 group">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-black text-slate-800 leading-none mb-1">{user?.fullname}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-100">
                {userInitials}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
          <div className="max-w-[1400px] mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Animatsiya stillari */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
      `}} />
    </div>
  );
};

export default StudentLayout;