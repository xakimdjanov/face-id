import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  HiOutlineUserGroup, 
  HiOutlineAcademicCap, 
  HiOutlineClipboardCheck,
  HiOutlineLogout,
  HiOutlineViewGrid,
  HiX 
} from 'react-icons/hi';
import Swal from 'sweetalert2'; 
import toast from 'react-hot-toast';

const TeacherSidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  // Get user data from LocalStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fullName = user.fullname || user.fullName || user.name || "Teacher";

  // Logout Logic
  const handleLogout = () => {
    if (window.innerWidth < 1024) toggleSidebar();

    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your session!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4F46E5', // indigo-600
      cancelButtonColor: '#F43F5E', // rose-500
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-3xl'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // 1. Clear Storage
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        
        // 2. Redirect to Login
        navigate("/login", { replace: true });
        
        // 3. Success Notification
        toast.success("Successfully logged out");
      }
    });
  };

  const menuItems = [
    { name: "Dashboard", path: "/teacher/dashboard", icon: <HiOutlineViewGrid size={22} /> },
    { name: "My Groups", path: "/teacher/groups", icon: <HiOutlineUserGroup size={22} /> },
    { name: "Students", path: "/teacher/students", icon: <HiOutlineAcademicCap size={22} /> },
    { name: "Attendance", path: "/teacher/attendance", icon: <HiOutlineClipboardCheck size={22} /> },
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col font-sans`}>
      
      <div className="p-6 flex flex-col h-full">
        {/* LOGO & CLOSE BUTTON */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">T</div>
            <span className="text-xl font-black text-slate-800 tracking-tight uppercase">Teacher<span className="text-indigo-600">Hub</span></span>
          </div>
          
          <button 
            onClick={toggleSidebar} 
            className="lg:hidden p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
          >
            <HiX size={24} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { if(window.innerWidth < 1024) toggleSidebar(); }}
              className={({ isActive }) => 
                `flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                  isActive 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                  : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                }`
              }
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* USER PROFILE & LOGOUT SECTION */}
        <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-3 px-3 py-3 bg-slate-50/50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm text-lg">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-800 truncate leading-tight">
                {fullName}
              </p>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">
                Instructor
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl font-bold text-sm text-rose-500 hover:bg-rose-50 transition-all group"
          >
            <HiOutlineLogout size={22} className="group-hover:translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherSidebar;