import React from "react";
import { NavLink } from "react-router-dom";
import { FiGrid, FiUsers, FiUserPlus } from "react-icons/fi";

const Sidebar = () => {
  const linkClass =
    "flex items-center gap-3 px-4 py-3 rounded-lg transition";

  return (
    <div className="w-64 bg-white border-r p-4">
      <h2 className="text-xl font-bold mb-6">Davomat</h2>

      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `${linkClass} ${isActive ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`
        }
      >
        <FiGrid />
        Dashboard
      </NavLink>

      <NavLink
        to="/getusers"
        className={({ isActive }) =>
          `${linkClass} ${isActive ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`
        }
      >
        <FiUsers />
        Get Users
      </NavLink>

      <NavLink
        to="/adduser"
        className={({ isActive }) =>
          `${linkClass} ${isActive ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`
        }
      >
        <FiUserPlus />
        Add User
      </NavLink>
    </div>
  );
};

export default Sidebar;
