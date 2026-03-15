import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { HiMenuAlt2 } from "react-icons/hi";
import SuperSidebar from "../superadmin/SuperSidebar";

const SuperLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    // Butun ekran balandligini egallaydi va tashqi scroll chiqishini cheklaydi (overflow-hidden)
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* SIDEBAR - Desktopda joyida qotgan, Mobilda ochiluvchi */}
      <div className={`
        fixed inset-y-0 left-0 z-[60] w-64 transform transition-transform duration-300 ease-in-out bg-[#0f172a]
        lg:static lg:translate-x-0 flex-shrink-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <SuperSidebar closeMobileMenu={() => setIsSidebarOpen(false)} />
      </div>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT AREA - Mana shu qism mustaqil scroll bo'ladi */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* NAVBAR - Tepada qotib turadi */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-gray-100 px-4 sm:px-8 flex justify-between items-center shadow-sm z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-slate-50 rounded-xl text-slate-600 lg:hidden hover:bg-slate-100"
            >
              <HiMenuAlt2 size={24} />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-gray-800 truncate">
              Super Admin Panel
            </h1>
          </div>
        </header>

        {/* PAGE CONTENT - FAQAT SHU QISM SCROLL BO'LADI */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ixtiyoriy: chiroyliroq scrollbar uchun CSS */}
      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default SuperLayout;