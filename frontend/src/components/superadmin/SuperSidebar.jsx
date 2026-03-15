import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  HiOutlineChartPie, 
  HiOutlineOfficeBuilding, 
  HiOutlineUserGroup, 
  HiOutlineShieldCheck, 
  HiOutlineCog, 
  HiOutlineLogout,
  HiX 
} from "react-icons/hi";
import toast from "react-hot-toast";

const SuperSidebar = ({ closeMobileMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const menuItems = [
    { name: "Dashboard", path: "/super/dashboard", icon: HiOutlineChartPie },
    { name: "Branches", path: "/super/addbranch", icon: HiOutlineOfficeBuilding },
    { name: "Managers", path: "/super/manager", icon: HiOutlineShieldCheck },
    { name: "Users", path: "/super/users", icon: HiOutlineUserGroup },
    // { name: "Settings", path: "/super/setting", icon: HiOutlineCog },
  ];

  return (
    <div className="h-full w-64 bg-[#0f172a] text-slate-300 flex flex-col justify-between border-r border-slate-800 shadow-2xl relative">
      
      <div>
        {/* TOP SECTION: Logo & Close Button */}
        <div className="relative p-8 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <h2 className="text-white font-bold text-lg tracking-tight truncate">SuperAdmin</h2>
          </div>
          
          {/* Mobilda yopish tugmasi - Mutloq joylashuv (absolute) bilan tepa o'ng burchakka */}
          <button 
            onClick={closeMobileMenu} 
            className="lg:hidden absolute top-2 right-2 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-90"
          >
            <HiX size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1.5 px-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? "bg-blue-600/10 text-blue-500 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]" 
                    : "hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <item.icon size={22} className={`${isActive ? "text-blue-500" : "text-slate-400 group-hover:text-white"}`} />
                <span className={`font-semibold text-sm ${isActive ? "text-white" : ""}`}>{item.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Section */}
      <div className="p-4 mb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-4 w-full rounded-2xl text-slate-400 hover:text-white hover:bg-red-500/10 transition-all duration-300 group"
          >
            <HiOutlineLogout size={22} className="group-hover:text-red-500" />
            <span className="font-bold text-sm group-hover:text-red-500">Logout</span>
          </button>
      </div>
    </div>
  );
};

export default SuperSidebar;