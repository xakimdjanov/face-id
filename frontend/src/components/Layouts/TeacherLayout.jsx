import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import TeacherSidebar from '../teacher/TeacherSidebar';
import { branchService } from '../../services/api'; 
import { HiOutlineMenuAlt2 } from 'react-icons/hi';

const TeacherLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branchName, setBranchName] = useState("Yuklanmoqda...");
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchBranchInfo = useCallback(async () => {
    if (user.branch?.name || user.branchName) {
      setBranchName(user.branch?.name || user.branchName);
      return;
    }
    
    try {
      if (user.branchId) {
        const res = await branchService.getById(user.branchId);
        const data = res?.data?.data || res?.data;
        setBranchName(data?.name || `Filial #${user.branchId}`);
      } else {
        setBranchName("Bosh idora");
      }
    } catch (error) {
      setBranchName("Noma'lum");
    }
  }, [user]);

  useEffect(() => {
    fetchBranchInfo();
  }, [fetchBranchInfo]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      <TeacherSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        
        {/* HEADER */}
        <header className="h-16 sticky top-0 z-30 bg-white border-b border-slate-100 px-4 md:px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 lg:hidden text-slate-600 hover:bg-slate-50 rounded-xl flex-shrink-0"
            >
              <HiOutlineMenuAlt2 size={24} />
            </button>

            <h2 className="text-sm md:text-base font-bold text-slate-700 tracking-tight truncate">
              {branchName}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Minimalist Header */}
          </div>
        </header>

        {/* SAHIFA KONTENTI */}
        <main className="p-4 md:p-8 flex-1">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;