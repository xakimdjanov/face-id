import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { HiMenuAlt2 } from "react-icons/hi";
import SuperSidebar from "../superadmin/SuperSidebar";

const SuperLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <div className={`
        fixed inset-y-0 left-0 z-[60] w-64 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex-shrink-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <SuperSidebar closeMobileMenu={() => setIsSidebarOpen(false)} />
      </div>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* NAVBAR */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-slate-100 px-4 sm:px-8 flex justify-between items-center shadow-sm z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 lg:hidden hover:bg-slate-50 rounded-xl"
            >
              <HiMenuAlt2 size={24} />
            </button>
            <h2 className="text-sm md:text-base font-bold text-slate-700 tracking-tight">
              Bosh idora
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Minimalist Header */}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperLayout;