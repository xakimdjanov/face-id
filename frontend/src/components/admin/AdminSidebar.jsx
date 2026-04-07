import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineClipboardCheck,
  HiOutlineLogout,
  HiX
} from "react-icons/hi";
import { clearAuth } from "../../utils/auth";
import Swal from "sweetalert2";

const AdminSidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const menu = [
    { name: "Boshqaruv paneli", path: "/admin/dashboard", icon: <HiOutlineHome size={22} /> },
    { name: "Guruhlar", path: "/admin/groups", icon: <HiOutlineUserGroup size={22} /> },
    { name: "Talabalar", path: "/admin/students", icon: <HiOutlineUsers size={22} /> },
    { name: "O'qituvchilar", path: "/admin/teachers", icon: <HiOutlineUsers size={22} /> },
    { name: "Davomat", path: "/admin/attendance", icon: <HiOutlineClipboardCheck size={22} /> },
  ];

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
        clearAuth();
        navigate("/", { replace: true });
      }
    });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] border-r border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-full flex flex-col justify-between">
          <div>
            {/* Logo Section */}
            <div className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="text-white font-black text-xl">A</span>
                </div>
                <h1 className="text-white font-bold text-lg tracking-tight">Admin</h1>
              </div>
              <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
                <HiX size={24} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1.5">
              {menu.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group ${
                      isActive 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                      <span className="text-sm">{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="px-4 mt-auto">
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

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-red-500/10 transition-all duration-300 group mb-4"
            >
              <HiOutlineLogout size={22} className="group-hover:text-red-500" />
              <span className="font-bold text-sm group-hover:text-red-500">Chiqish</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;