import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineClipboardCheck,
  HiOutlineCurrencyDollar,
  HiOutlineLogout,
  HiX,
  HiOutlineExclamationCircle
} from "react-icons/hi";
import { clearAuth } from "../../utils/auth";

const AdminSidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menu = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <HiOutlineHome size={22} /> },
    { name: "Groups", path: "/admin/groups", icon: <HiOutlineUserGroup size={22} /> },
    { name: "Students", path: "/admin/students", icon: <HiOutlineUsers size={22} /> },
    { name: "Teachers", path: "/admin/teachers", icon: <HiOutlineUsers size={22} /> },
    { name: "Attendance", path: "/admin/attendance", icon: <HiOutlineClipboardCheck size={22} /> },
    // { name: "Payments", path: "/admin/payments", icon: <HiOutlineCurrencyDollar size={22} /> },
  ];

  const handleLogout = () => {
    clearAuth();
    navigate("/", { replace: true });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <span className="text-white font-black text-xl">A</span>
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Admin</h1>
            </div>
            <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
              <HiX size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {menu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all duration-200 group ${
                    isActive 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                  }`
                }
              >
                <span className="transition-transform group-hover:scale-110">{item.icon}</span>
                <span className="text-sm tracking-wide">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-6">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-red-500 bg-red-50/50 hover:bg-red-50 font-bold transition-all border border-red-100 active:scale-95"
            >
              <HiOutlineLogout size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowLogoutModal(false)} 
          />
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiOutlineExclamationCircle size={44} />
            </div>
            
            <h3 className="text-2xl font-black text-slate-800 mb-2">Ready to Leave?</h3>
            <p className="text-slate-500 font-medium mb-8">
              Are you sure you want to log out? You will need to sign back in to access your dashboard.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
              >
                Yes, Sign Me Out
              </button>
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;