import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { HiMenuAlt2, HiOutlineUserCircle, HiOutlineOfficeBuilding } from "react-icons/hi";
import ManagerSidebar from "../manager/ManagerSidebar";
import { branchService } from "../../services/api"; // Siz yuborgan api fayl manzili

const ManagerLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [branchName, setBranchName] = useState("Loading...");

  // LocalStorage'dan foydalanuvchini olish
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const getBranchInfo = async () => {
      if (user.branchId) {
        try {
          // Barcha branchlarni olib kelamiz
          const res = await branchService.getAll();
          
          // Kelgan massiv ichidan bizga kerakli branchId'li branchning nomini topamiz
          const branches = res.data?.data || res.data || [];
          const currentBranch = branches.find(b => Number(b.id) === Number(user.branchId));

          if (currentBranch) {
            setBranchName(currentBranch.name);
          } else {
            setBranchName(`Branch #${user.branchId}`);
          }
        } catch (error) {
          console.error("Branch fetch error:", error);
          setBranchName("Error loading branch");
        }
      }
    };

    getBranchInfo();
  }, [user.branchId]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <div className={`
        fixed inset-y-0 left-0 z-[60] w-64 transform transition-transform duration-300 ease-in-out bg-indigo-900
        lg:static lg:translate-x-0 flex-shrink-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <ManagerSidebar closeMobileMenu={() => setIsSidebarOpen(false)} />
      </div>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* NAVBAR */}
        <header className="h-20 flex-shrink-0 bg-white border-b border-gray-100 px-4 sm:px-8 flex justify-between items-center shadow-sm z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-indigo-50 rounded-xl text-indigo-600 lg:hidden hover:bg-indigo-100"
            >
              <HiMenuAlt2 size={24} />
            </button>
            
            <div className="flex flex-col">
              <h1 className="text-base sm:text-lg font-black text-gray-800 tracking-tight leading-none uppercase">
                Manager Panel
              </h1>
              {/* BRANCH NOMI */}
              <div className="flex items-center gap-1.5 text-indigo-600 mt-1.5 bg-indigo-50/50 border border-indigo-100 px-2.5 py-1 rounded-lg w-fit">
                <HiOutlineOfficeBuilding size={14} className="flex-shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-widest truncate max-w-[150px]">
                  {branchName}
                </span>
              </div>
            </div>
          </div>
          
          {/* USER INFO */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-bold text-gray-900 leading-none">
                {user.fullname || "Manager Name"}
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Authorized Manager
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <HiOutlineUserCircle size={28} />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ManagerLayout;