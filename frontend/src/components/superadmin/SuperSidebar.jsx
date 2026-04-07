import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  HiOutlineChartPie, 
  HiOutlineOfficeBuilding, 
  HiOutlineUserGroup, 
  HiOutlineShieldCheck, 
  HiOutlineLogout,
  HiX 
} from "react-icons/hi";
import Swal from "sweetalert2";

const SuperSidebar = ({ closeMobileMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Chiqish?",
      text: "Haqiqatan ham tizimdan chiqmoqchimisiz?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ha, chiqish",
      cancelButtonText: "Bekor qilish",
      background: "#0f172a",
      color: "#ffffff"
    });

    if (result.isConfirmed) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  const menuItems = [
    { name: "Asosiy", path: "/super/dashboard", icon: HiOutlineChartPie },
    { name: "Filiallar", path: "/super/addbranch", icon: HiOutlineOfficeBuilding },
    { name: "Rahbarlar", path: "/super/manager", icon: HiOutlineShieldCheck },
    { name: "Foydalanuvchilar", path: "/super/users", icon: HiOutlineUserGroup },
  ];

  return (
    <div className="h-full w-64 bg-[#0f172a] text-slate-300 flex flex-col justify-between border-r border-slate-800 shadow-2xl relative font-sans">
      
      <div>
        <div className="relative p-8 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <h2 className="text-white font-black text-lg tracking-tighter truncate uppercase">Boshqaruv</h2>
          </div>
          
          <button 
            onClick={closeMobileMenu} 
            className="lg:hidden absolute top-2 right-2 p-2 rounded-xl bg-slate-800 text-slate-400"
          >
            <HiX size={20} />
          </button>
        </div>

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
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <item.icon size={22} className={`${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                <span className="font-semibold text-sm">{item.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>}
              </Link>
            );
          })}
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

        {/* LOGOUT BUTTON */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-4 w-full rounded-2xl text-slate-400 hover:text-white hover:bg-rose-500/10 transition-all duration-300 group mb-4"
        >
          <HiOutlineLogout size={22} className="group-hover:text-rose-500" />
          <span className="font-bold text-sm group-hover:text-rose-500">Chiqish</span>
        </button>
      </div>
    </div>
  );
};

export default SuperSidebar;