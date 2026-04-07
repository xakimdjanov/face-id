import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { 
  HiOutlineUserCircle, 
  HiOutlineLogout, 
  HiOutlineX,
  HiOutlineAcademicCap,
  HiOutlineUserGroup
} from "react-icons/hi";

const StudentSidebar = ({ isOpen, setIsOpen }) => {
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
    { path: "/student/profile", name: "Profil", icon: <HiOutlineUserCircle size={22} /> },
    { path: "/student/groups", name: "Guruhlarim", icon: <HiOutlineUserGroup size={22} /> },
    { path: "/student/attendance", name: "Davomat", icon: <HiOutlineUserGroup size={22} /> }
  ];

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-300 transition-transform duration-300 ease-in-out transform 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 lg:static h-full border-r border-slate-800 shadow-2xl`}
      >
        <div className="flex flex-col h-full justify-between">
          
          <div>
            {/* Logo Section */}
            <div className="p-8 flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <HiOutlineAcademicCap size={26} />
                </div>
                <span className="text-white font-bold text-lg tracking-tight">Talaba</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 space-y-1.5">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group
                    ${isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}
                  `}
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
              className="flex items-center gap-3 p-4 w-full rounded-2xl text-slate-400 hover:text-white hover:bg-red-500/10 transition-all duration-300 group font-bold text-sm mb-4"
            >
              <HiOutlineLogout size={22} className="group-hover:text-red-500" />
              <span className="group-hover:text-red-500">Chiqish</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default StudentSidebar;