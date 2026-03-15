import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import TeacherSidebar from '../teacher/TeacherSidebar';
import { branchService } from '../../services/api'; 
import { HiOutlineMenuAlt2, HiOutlineBell, HiOutlineOfficeBuilding } from 'react-icons/hi';

const TeacherLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branchName, setBranchName] = useState("Loading...");
  
  // LocalStorage'dan foydalanuvchini olish
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchBranchInfo = useCallback(async () => {
    // 1-bosqich: Agar user obyektida branch nomi bo'lsa, uni ishlatamiz
    if (user.branch?.name || user.branchName) {
      setBranchName(user.branch?.name || user.branchName);
      return;
    }
    
    // 2-bosqich: Agar faqat ID bo'lsa, API dan olamiz
    try {
      if (user.branchId) {
        const res = await branchService.getById(user.branchId);
        const data = res?.data?.data || res?.data;
        setBranchName(data?.name || `Branch #${user.branchId}`);
      } else {
        setBranchName("No Branch");
      }
    } catch (error) {
      setBranchName("Unknown");
    }
  }, [user]);

  useEffect(() => {
    fetchBranchInfo();
  }, [fetchBranchInfo]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* SIDEBAR */}
      <TeacherSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

      {/* OVERLAY (Faqat mobilda sidebar ochilganda chiqadi) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ASOSIY KONTENT QISMI */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72">
        
        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 md:px-8">
          <div className="flex items-center justify-between gap-3">
            
            {/* CHAP TOMON: Menu tugmasi va Branch nomi */}
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 lg:hidden text-slate-600 hover:bg-slate-100 rounded-xl flex-shrink-0"
              >
                <HiOutlineMenuAlt2 size={24} />
              </button>

              <div className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-indigo-100 min-w-0 max-w-[140px] xs:max-w-[200px] md:max-w-none">
                <HiOutlineOfficeBuilding className="text-indigo-600 flex-shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="hidden xs:block text-[8px] md:text-[9px] font-black text-indigo-400 uppercase tracking-wider leading-none mb-0.5 text-nowrap">Location</p>
                  <p className="text-[11px] md:text-sm font-black text-slate-800 truncate">
                    {branchName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* SAHIFA KONTENTI */}
        <main className="p-4 md:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;