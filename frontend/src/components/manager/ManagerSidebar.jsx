import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  HiOutlineViewGrid, HiOutlineUserGroup, HiOutlineAcademicCap, 
  HiOutlineCollection, HiOutlineUsers, HiOutlineLogout, HiX, 
  HiOutlineBookOpen
} from "react-icons/hi";
import Swal from "sweetalert2";

const ManagerSidebar = ({ closeMobileMenu }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      title: "Chiqishni xohlaysizmi?",
      text: "Tizimdan chiqishni tasdiqlaysizmi?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ha, chiqish",
      cancelButtonText: "Bekor qilish",
      background: "#ffffff",
      customClass: {
        popup: 'rounded-[1.5rem]',
        confirmButton: 'rounded-xl font-bold px-6 py-3',
        cancelButton: 'rounded-xl font-bold px-6 py-3'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
      }
    });
  };

  const menuItems = [
    { name: "Boshqaruv paneli", path: "/manager/dashboard", icon: HiOutlineViewGrid },
    { name: "Administratorlar", path: "/manager/admins", icon: HiOutlineUserGroup },
    { name: "O'qituvchilar", path: "/manager/teachers", icon: HiOutlineAcademicCap },
    { name: "Guruhlar", path: "/manager/groups", icon: HiOutlineCollection },
    { name: "Talabalar", path: "/manager/students", icon: HiOutlineUsers },
    { name: "Kurslar", path: "/manager/course", icon: HiOutlineBookOpen },
  ];

  return (
    <div className="h-full w-full bg-[#0f172a] text-slate-300 flex flex-col justify-between border-r border-slate-800 shadow-2xl relative">
      
      <div className="flex flex-col h-full">
        {/* LOGO SECTION */}
        <div className="p-8 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
               <span className="text-white font-black text-xl">M</span>
            </div>
            <h2 className="text-white font-bold text-lg tracking-tight truncate">Menejer</h2>
          </div>
          
          <button 
            onClick={closeMobileMenu} 
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <HiX size={24} />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex flex-col gap-1.5 px-4 overflow-y-auto hide-scrollbar flex-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { if(window.innerWidth < 1024) closeMobileMenu(); }}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group
                ${isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={22} className={`shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="font-semibold text-sm">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* BOTTOM SECTION */}
        <div className="px-4 mt-auto mb-4">
          {/* User Info Section */}
          <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm uppercase shrink-0 border border-blue-500/20">
                {JSON.parse(localStorage.getItem("user") || "{}").fullname?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-white font-bold text-[13px] truncate leading-tight">
                  {JSON.parse(localStorage.getItem("user") || "{}").fullname || "Foydalanuvchi"}
                </span>
                <span className="text-slate-400 text-[10px] font-medium leading-tight mt-0.5">
                   {JSON.parse(localStorage.getItem("user") || "{}").phone || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-4 w-full rounded-2xl text-slate-400 hover:text-white hover:bg-red-500/10 transition-all duration-300 group font-bold text-sm"
          >
            <HiOutlineLogout size={22} className="group-hover:text-red-500" />
            <span className="group-hover:text-red-500">Chiqish</span>
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default ManagerSidebar;