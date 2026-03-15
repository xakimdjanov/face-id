import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  paymentService, 
  userService, 
  groupService, 
  studentGroupService 
} from "../../services/api";
import { 
  HiOutlinePlus, 
  HiOutlineCheckCircle, 
  HiOutlineExclamationCircle, 
  HiOutlineClock,
  HiOutlineSearch,
  HiX,
  HiUserCircle,
  HiOutlineCalendar
} from "react-icons/hi";
import { CgSpinner } from "react-icons/cg";
import toast from "react-hot-toast";

const AdminPayment = () => {
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState("all"); 
  const [searchQuery, setSearchQuery] = useState("");
  
  const [studentSearch, setStudentSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    studentId: "",
    groupId: "",
    amount: "",
    month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date()),
    paymentType: "cash"
  });

  const formatCurrency = (val) => Number(val).toLocaleString() + " UZS";

  // DATA FETCHING - Corrected for missing getAll() in studentGroupService
  const fetchData = useCallback(async () => {
    if (!user.branchId) return;
    setIsLoading(true);
    try {
      // 1. Fetch main data
      const [pRes, uRes, gRes] = await Promise.all([
        paymentService.getAll(),
        userService.getAll(),
        groupService.getAll()
      ]);

      const pData = pRes?.data?.data || pRes?.data || [];
      const uData = uRes?.data?.data || uRes?.data || [];
      const gData = gRes?.data?.data || gRes?.data || [];

      // 2. Filter by Manager's Branch
      const branchGroups = gData.filter(g => Number(g.branchId) === Number(user.branchId));
      const myGroupIds = branchGroups.map(g => Number(g.id));

      setGroups(branchGroups);
      setStudents(uData.filter(u => u.role === "student" && Number(u.branchId) === Number(user.branchId)));
      setPayments(pData.filter(p => myGroupIds.includes(Number(p.groupId))));

      // 3. Fetch Student-Group relations safely
      const sgPromises = branchGroups.map(group => 
        studentGroupService.getById(group.id).catch(() => ({ data: [] }))
      );
      
      const sgResults = await Promise.all(sgPromises);
      let combinedSg = [];
      sgResults.forEach(res => {
        const data = res?.data?.data || res?.data || [];
        combinedSg = [...combinedSg, ...data];
      });
      setStudentGroups(combinedSg);

    } catch (error) {
      toast.error("Network synchronization failed");
    } finally {
      setIsLoading(false);
    }
  }, [user.branchId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Search Logic for Modal
  const studentListWithDetails = useMemo(() => {
    return students.map(student => {
      const relation = studentGroups.find(sg => Number(sg.studentId) === Number(student.id));
      const group = relation ? groups.find(g => Number(g.id) === Number(relation.groupId)) : null;
      return {
        ...student,
        groupName: group ? group.name : "No Group",
        groupId: group ? group.id : null,
        teacherName: group?.teacher?.fullname || "Unknown"
      };
    });
  }, [students, studentGroups, groups]);

  const filteredStudents = studentListWithDetails.filter(s => 
    s.fullname.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const selectStudent = (s) => {
    setForm(prev => ({ ...prev, studentId: s.id, groupId: s.groupId || "" }));
    setStudentSearch(s.fullname);
    setIsDropdownOpen(false);
  };

  // Billing Logic for Main Table
  const billingData = useMemo(() => {
    const map = {};
    payments.forEach(p => {
      const key = `${p.studentId}-${p.groupId}-${p.month}`;
      if (!map[key]) {
        const foundGroup = groups.find(g => Number(g.id) === Number(p.groupId));
        map[key] = {
          studentName: p.student?.fullname || "Unknown",
          groupName: foundGroup?.name || "N/A",
          month: p.month,
          totalPaid: 0,
          coursePrice: Number(foundGroup?.course?.price || 0),
          history: []
        };
      }
      map[key].totalPaid += Number(p.amount);
      map[key].history.push(p);
    });

    let result = Object.values(map);
    if (searchQuery) {
      result = result.filter(r => r.studentName.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (filterStatus === "paid") result = result.filter(r => r.totalPaid >= r.coursePrice);
    if (filterStatus === "debt") result = result.filter(r => r.totalPaid < r.coursePrice);
    
    return result;
  }, [payments, groups, searchQuery, filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await paymentService.create({
        ...form,
        amount: Number(form.amount),
        paymentDate: new Date().toISOString()
      });
      toast.success("Payment successful!");
      setIsModalOpen(false);
      setStudentSearch("");
      fetchData();
    } catch (err) {
      toast.error("Failed to save payment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-[#f8fafc] min-h-screen">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">FINANCIAL TRACKER</h1>
          <p className="text-indigo-500 font-bold text-[10px] tracking-widest uppercase">Manager: {user.fullname}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-sm" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            <HiOutlinePlus /> NEW
          </button>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex bg-white p-1.5 rounded-2xl w-fit border border-slate-100 shadow-sm">
        {['all', 'paid', 'debt'].map(s => (
          <button 
            key={s} 
            onClick={() => setFilterStatus(s)}
            className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? "bg-indigo-600 text-white" : "text-slate-400"}`}
          >
            {s === 'debt' ? 'Debtors' : s}
          </button>
        ))}
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-8 py-5">Student / Group</th>
              <th className="px-8 py-5">Course Price</th>
              <th className="px-8 py-5">Paid (Month)</th>
              <th className="px-8 py-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading && billingData.length === 0 ? (
              <tr><td colSpan="4" className="py-20 text-center"><CgSpinner className="animate-spin text-3xl text-indigo-600 mx-auto" /></td></tr>
            ) : billingData.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="font-bold text-slate-800">{row.studentName}</div>
                  <div className="text-[10px] font-black text-indigo-400 uppercase">{row.groupName}</div>
                </td>
                <td className="px-8 py-6 font-bold text-slate-500">{formatCurrency(row.coursePrice)}</td>
                <td className="px-8 py-6">
                  <div className="font-black text-slate-800">{formatCurrency(row.totalPaid)}</div>
                  <div className="text-[9px] font-black text-slate-400 uppercase italic">{row.month}</div>
                </td>
                <td className="px-8 py-6">
                  {row.totalPaid >= row.coursePrice ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase bg-emerald-50 px-3 py-1.5 rounded-lg w-fit border border-emerald-100">
                      <HiOutlineCheckCircle /> Paid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-600 font-black text-[10px] uppercase bg-rose-50 px-3 py-1.5 rounded-lg w-fit border border-rose-100">
                      <HiOutlineExclamationCircle /> Debt: {formatCurrency(row.coursePrice - row.totalPaid)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NEW PAYMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800">Record Payment</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500"><HiX size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Search Field */}
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Student Search</label>
                <div className="relative">
                  <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="Type name..."
                    value={studentSearch}
                    onChange={(e) => { setStudentSearch(e.target.value); setIsDropdownOpen(true); }}
                    onFocus={() => setIsDropdownOpen(true)}
                  />
                </div>
                {isDropdownOpen && studentSearch && (
                  <div className="absolute z-[110] w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredStudents.map(s => (
                      <div key={s.id} onClick={() => selectStudent(s)} className="p-4 hover:bg-indigo-50 cursor-pointer flex items-center gap-3 border-b last:border-none">
                        <HiUserCircle className="text-indigo-400" size={20} />
                        <div>
                          <div className="text-sm font-bold">{s.fullname}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase">{s.groupName}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Amount</label>
                  <input required type="number" className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" placeholder="Sum..." value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Month</label>
                  <input required className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none uppercase" value={form.month} onChange={e => setForm({...form, month: e.target.value})} />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading || !form.studentId}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Confirm Transaction"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayment;