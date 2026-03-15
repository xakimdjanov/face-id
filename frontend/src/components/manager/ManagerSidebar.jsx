import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  HiOutlineViewGrid, HiOutlineUserGroup, HiOutlineAcademicCap, 
  HiOutlineCollection, HiOutlineUsers, HiOutlineCash, 
  HiOutlineLogout, HiX, 
  HiOutlineBookOpen
} from "react-icons/hi";
import toast from "react-hot-toast";

const ManagerSidebar = ({ closeMobileMenu }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Signed out successfully");
    navigate("/");
  };

  const menuItems = [
    { name: "Dashboard", path: "/manager/dashboard", icon: HiOutlineViewGrid },
    { name: "Administrators", path: "/manager/admins", icon: HiOutlineUserGroup },
    { name: "Teachers", path: "/manager/teachers", icon: HiOutlineAcademicCap },
    { name: "Groups", path: "/manager/groups", icon: HiOutlineCollection },
    { name: "Students", path: "/manager/students", icon: HiOutlineUsers },
    { name: "Courses", path: "/manager/course", icon: HiOutlineBookOpen },
    { name: "Payments", path: "/manager/payments", icon: HiOutlineCash },
  ];

  return (
    <div className="h-full w-64 bg-indigo-900 text-white flex flex-col justify-between shadow-2xl relative">
      
      <div>
        {/* USER PROFILE SECTION */}
        <div className="relative p-6 border-b border-indigo-800/50 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg border border-indigo-400/30">
              {user?.fullname?.charAt(0) || "M"}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-1">Manager</p>
              <p className="font-bold text-sm truncate pr-4">{user?.fullname || "User Name"}</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button 
            onClick={closeMobileMenu}
            className="lg:hidden absolute top-6 right-3 p-2 rounded-lg bg-indigo-800/50 text-indigo-200 hover:text-white transition-colors"
          >
            <HiX size={18} />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex flex-col gap-1.5 px-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobileMenu}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group
                ${isActive 
                  ? "bg-white text-indigo-900 shadow-xl shadow-black/20" 
                  : "text-indigo-200 hover:bg-white/5 hover:text-white"}
              `}
            >
              {/* ASOSIY TUZATISH: Ikonani komponent sifatida render qilish */}
              {({ isActive }) => (
                <>
                  <item.icon size={22} className="shrink-0" />
                  <span className="font-bold text-sm tracking-tight">{item.name}</span>
                  
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* LOGOUT BUTTON */}
      <div className="p-4 mb-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-4 w-full rounded-2xl text-indigo-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group font-bold text-sm"
        >
          <HiOutlineLogout size={20} />
          <span>Sign Out</span>
        </button>
      </div>
      
    </div>
  );
};

export default ManagerSidebar;