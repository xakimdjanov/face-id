import React, { useEffect, useState, useCallback } from "react";
import { groupService, paymentService } from "../../services/api";
import { 
  HiOutlineCash, HiOutlineFilter, HiOutlineBadgeCheck, 
  HiOutlineExclamationCircle, HiOutlineCalendar, HiOutlineOfficeBuilding
} from "react-icons/hi";
import { CgSpinner } from "react-icons/cg";
import toast from "react-hot-toast";

const ManagerPayments = () => {
  // LocalStorage'dan manager ma'lumotlarini olish
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  
  const [groups, setGroups] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uz-UZ', { 
      style: 'currency', currency: 'UZS', maximumFractionDigits: 0 
    }).format(amount);
  };

  // 1. Faqat o'ziga tegishli guruhlarni yuklash
  const fetchMyGroups = useCallback(async () => {
    if (!user.branchId) {
      toast.error("Branch ID not found!");
      return;
    }
    try {
      const res = await groupService.getAll();
      const allGroups = res?.data?.data || res?.data || [];
      // Faqat managerning branchId siga teng guruhlarni filtrlaymiz
      const myBranchGroups = allGroups.filter(g => Number(g.branchId) === Number(user.branchId));
      setGroups(myBranchGroups);
    } catch (err) {
      toast.error("Failed to load groups");
    }
  }, [user.branchId]);

  useEffect(() => {
    fetchMyGroups();
  }, [fetchMyGroups]);

  // 2. Guruh bo'yicha to'lovlar hisoboti
  const generateReport = async (groupId) => {
    if (!groupId) {
      setPayments([]);
      setSelectedGroup(null);
      return;
    }
    
    setLoading(true);
    const loadingToast = toast.loading("Fetching financial data...");

    try {
      const groupInfo = groups.find(g => Number(g.id) === Number(groupId));
      setSelectedGroup(groupInfo);

      const res = await paymentService.getAll();
      const allPayments = res?.data?.data || res?.data || [];
      
      // Tanlangan guruh to'lovlari
      const groupPayments = allPayments.filter(p => Number(p.groupId) === Number(groupId));

      // Talabalar bo'yicha guruhlash mantiqi
      const grouped = {};
      groupPayments.forEach(payment => {
        const sId = payment.studentId;
        if (!grouped[sId]) {
          grouped[sId] = {
            student: payment.student || { fullname: "Unknown Student" },
            payments: [],
            total: 0
          };
        }
        grouped[sId].payments.push(payment);
        grouped[sId].total += Number(payment.amount || 0);
      });

      setPayments(Object.values(grouped));
      toast.success("Report Generated", { id: loadingToast });
    } catch (error) {
      toast.error("Error fetching payments", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = payments.reduce((acc, curr) => acc + curr.total, 0);
  const coursePrice = selectedGroup?.course?.price || 0;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-[#f8fafc] min-h-screen">
      
      {/* HEADER SECTION (Filial tanlash olib tashlandi) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white">
            <HiOutlineOfficeBuilding size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Branch Finances</h1>
            <p className="text-indigo-500 font-bold text-[10px] uppercase tracking-widest">
              Manager: {user.fullname}
            </p>
          </div>
        </div>

        {/* Guruhni tanlash (Faqat shu filial guruhlari chiqadi) */}
        <div className="relative w-full md:w-72">
          <HiOutlineFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 z-10" />
          <select
            onChange={(e) => generateReport(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
          >
            <option value="">Select Cohort / Group</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      {/* STATS CARDS */}
      {payments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guruh Tushumi</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kurs Narxi</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(coursePrice)}</p>
          </div>
          <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Talabalar Soni</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{payments.length} ta</p>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      {loading ? (
        <div className="py-20 flex justify-center"><CgSpinner className="animate-spin text-4xl text-indigo-600" /></div>
      ) : payments.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {payments.map((data, idx) => {
            const isPaid = data.total >= coursePrice;
            const balance = coursePrice - data.total;

            return (
              <div key={idx} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center font-black">
                      {data.student?.fullname?.charAt(0)}
                    </div>
                    <h3 className="font-black text-slate-800">{data.student?.fullname}</h3>
                  </div>

                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase border-2 ${
                    isPaid ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                  }`}>
                    {isPaid ? "To'liq To'langan" : `Qarzdorlik: ${formatCurrency(balance)}`}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Oy</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Turi</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Summa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="px-6 py-3 text-sm font-bold text-indigo-600">{p.month}</td>
                          <td className="px-6 py-3 text-xs text-slate-500">{p.paymentType}</td>
                          <td className="px-6 py-3 text-right font-black text-slate-800">{formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] py-24 text-center border-2 border-dashed border-slate-100">
           <HiOutlineCash size={48} className="mx-auto text-slate-200 mb-3" />
           <p className="font-black text-slate-400 uppercase tracking-widest text-xs">To'lovlar topilmadi</p>
           <p className="text-slate-300 text-[10px] mt-1">Hisobotni ko'rish uchun yuqoridan guruhni tanlang</p>
        </div>
      )}
    </div>
  );
};

export default ManagerPayments;