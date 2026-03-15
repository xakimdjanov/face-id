import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { 
  HiOutlineUserCircle, 
  HiOutlineLogout, 
  HiOutlineX, // Iks ikonkasi
  HiOutlineAcademicCap,
  HiOutlineUserGroup
} from "react-icons/hi";

const StudentSidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will need to login again to access your courses!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#F43F5E',
      confirmButtonText: 'Yes, sign me out!',
      cancelButtonText: 'Stay here',
      customClass: {
        popup: 'rounded-[2rem]',
        confirmButton: 'rounded-xl px-6 py-3 font-bold',
        cancelButton: 'rounded-xl px-6 py-3 font-bold'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    });
  };

  const menuItems = [
    { path: "/student/profile", name: "Profile", icon: <HiOutlineUserCircle size={22} /> },
    { path: "/student/groups", name: "Groups", icon: <HiOutlineUserGroup size={22} /> },
    { path: "/student/attendance", name: "Attendance", icon: <HiOutlineUserGroup size={22} /> }
  ];

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A] text-slate-300 transition-transform duration-300 ease-in-out transform 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 md:fixed h-full`}
      >
        <div className="flex flex-col h-full p-6 relative">
          
          {/* IKS (X) Tugmasi - Faqat mobil qurilmalarda ko'rinadi */}
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <HiOutlineX size={20} />
          </button>

          {/* Logo Section */}
          <div className="flex items-center gap-3 px-2 mb-12">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <HiOutlineAcademicCap size={26} />
            </div>
            <span className="text-xl font-black text-white tracking-tight italic">
              Edu<span className="text-indigo-400">Flow</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-200 group
                  ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "hover:bg-slate-800 hover:text-white"}
                `}
              >
                <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="text-sm tracking-wide">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="mt-auto pt-6 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-4 py-4 w-full rounded-2xl font-bold text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-200 group"
            >
              <HiOutlineLogout size={22} className="group-hover:rotate-12 transition-transform" />
              <span className="text-sm tracking-wide">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default StudentSidebar;