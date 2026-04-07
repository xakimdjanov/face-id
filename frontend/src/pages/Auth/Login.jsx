import React, { useState } from "react";
import { userService } from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";
import { CgSpinner } from "react-icons/cg";
import toast from "react-hot-toast";
import { getDefaultRouteByRole, saveAuth } from "../../utils/auth";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ phone: "", password: "" });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await userService.login(form);
      const data = res.data;

      const user = data.user || data;
      const token = data.token || "";

      if (!user || !user.role) {
        toast.error("Login ma'lumotlari noto‘g‘ri");
        return;
      }

      saveAuth({ user, token });

      toast.success("Xush kelibsiz");
      navigate(getDefaultRouteByRole(user.role), { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login xatoligi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] p-8 sm:p-10 border border-gray-100">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
            <HiOutlineLockClosed className="text-white text-3xl" />
          </div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Sign In</h2>
          <p className="text-gray-400 mt-2 text-sm font-medium">
            Welcome to the management portal
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              Phone Number
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <HiOutlinePhone size={22} />
              </div>
              <input
                type="tel"
                name="phone"
                placeholder="+998901234567"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <HiOutlineLockClosed size={22} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <HiOutlineEyeOff size={22} /> : <HiOutlineEye size={22} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-[0.97] disabled:opacity-70 flex items-center justify-center gap-3 mt-4"
          >
            {isLoading ? <CgSpinner className="animate-spin text-2xl" /> : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;