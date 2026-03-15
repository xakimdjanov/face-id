import React, { useEffect, useState } from "react";
import { getStoredUser } from "../../utils/auth";
import { branchService } from "../../services/api";
import { 
  HiOutlineUser, 
  HiOutlineMail, 
  HiOutlinePhone, 
  HiOutlineOfficeBuilding, 
  HiOutlineIdentification,
  HiOutlineShieldCheck
} from "react-icons/hi";
import { FiLoader } from "react-icons/fi";

const StudentsMyProfile = () => {
  const user = getStoredUser();
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        if (!user?.branchId) return;
        setLoading(true);
        const res = await branchService.getById(user.branchId);
        setBranchName(res.data?.name || res.data?.data?.name);
      } catch (error) {
        console.error("Branch fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranch();
  }, [user?.branchId]);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      {/* Header with Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
          Personal account information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 text-center">
            <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-xl shadow-indigo-200 mb-4">
              <HiOutlineUser size={48} />
            </div>
            <h2 className="text-xl font-black text-slate-800 leading-tight">
              {user?.fullname}
            </h2>
            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
              <HiOutlineShieldCheck size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider">Active Student</span>
            </div>
          </div>
        </div>

        {/* Right Column: Details Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-8 space-y-8">
              
              {/* Email Field */}
              <div className="flex items-center gap-5 group">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                  <HiOutlineMail size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">Email Address</p>
                  <p className="font-bold text-slate-700">{user?.email || "Not provided"}</p>
                </div>
              </div>

              {/* Phone Field */}
              <div className="flex items-center gap-5 group">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                  <HiOutlinePhone size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">Phone Number</p>
                  <p className="font-bold text-slate-700">{user?.phone || "Not provided"}</p>
                </div>
              </div>

              {/* Branch Field */}
              <div className="flex items-center gap-5 group">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                  <HiOutlineOfficeBuilding size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">Current Branch</p>
                  {loading ? (
                    <FiLoader className="animate-spin text-indigo-500 mt-1" />
                  ) : (
                    <p className="font-bold text-slate-700">{branchName || "Main Center"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsMyProfile;