import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft, HiOutlineTrash, HiOutlineClock, HiOutlineCalendar, HiOutlineUser } from "react-icons/hi";
import { attendanceFaceService } from "../../services/api";
import toast, { Toaster } from "react-hot-toast";

const AttendanceDetails = () => {
    const { employeeNo, date } = useParams();
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await attendanceFaceService.getAll({ 
                employeeNo, 
                startDate: date, 
                endDate: date,
                limit: 1000 
            });
            const data = res?.data?.data || [];
            
            // Sort by time
            const sorted = data.sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime));
            setLogs(sorted);

            if (sorted.length > 0) {
                const first = sorted[0];
                setUserInfo({
                    name: first.employee?.name || first.rawData?.AccessControllerEvent?.name || "Foydalanuvchi",
                    employeeNo: first.employeeNo
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("Ma'lumotlarni yuklab bo'lmadi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [employeeNo, date]);

    const handleDelete = async (id) => {
        if (!window.confirm("Haqiqatan ham bu amalni o'chirmoqchimisiz?")) return;
        try {
            await attendanceFaceService.delete(id);
            toast.success("Muvaffaqiyatli o'chirildi");
            fetchLogs();
        } catch (error) {
            toast.error("O'chirishda xatolik yuz berdi");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 animate-in fade-in duration-500">
            <Toaster position="top-right" />
            
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-3 bg-white hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-2xl shadow-sm border border-gray-100 transition-all active:scale-95"
                        >
                            <HiOutlineArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Harakatlar tarixi</h1>
                            <p className="text-gray-500 font-medium italic mt-1">Batafsil ko'rinish va boshqaruv</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-xs uppercase tracking-widest">
                            <HiOutlineCalendar size={18} />
                            {date}
                        </div>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                            <HiOutlineUser size={24}/>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Foydalanuvchi</p>
                            <p className="text-xl font-black text-gray-800 tracking-tight">{userInfo?.name || "—"}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-50">
                            <HiOutlineClock size={24}/>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jami harakatlar</p>
                            <p className="text-xl font-black text-gray-800 tracking-tight">{logs.length} ta amal</p>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                    {logs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] w-16 text-center">№</th>
                                        <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Vaqt</th>
                                        <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Harakat turi</th>
                                        <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Qurilma</th>
                                        <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Amallar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {logs.map((log, index) => {
                                        const status = log.rawData?.AccessControllerEvent?.attendanceStatus || log.eventType;
                                        const isEntry = status?.toLowerCase().includes("in") || status?.toLowerCase().includes("kirish");
                                        const isExit = status?.toLowerCase().includes("out") || status?.toLowerCase().includes("chiqish");
                                        
                                        return (
                                            <tr key={log.id} className="group hover:bg-slate-50 transition-colors">
                                                <td className="p-6 text-sm font-black text-gray-400 text-center">{index + 1}</td>
                                                <td className="p-6">
                                                    <span className="font-bold text-gray-700 text-sm italic">
                                                        {new Date(log.eventTime).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                        isEntry ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        isExit ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                                    }`}>
                                                        {isEntry ? "Kirish" : isExit ? "Chiqish" : "Aniqlanish"}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    <span className="text-xs font-bold text-gray-500 italic">
                                                        {log.rawData?.AccessControllerEvent?.deviceName || "Face ID Terminal"}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <button 
                                                        onClick={() => handleDelete(log.id)}
                                                        className="p-3 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-xl transition-all hover:bg-rose-100 active:scale-90"
                                                        title="O'chirish"
                                                    >
                                                        <HiOutlineTrash size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-32 text-center">
                            <p className="text-gray-400 font-bold italic uppercase tracking-widest text-xs">Ma'lumot topilmadi</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceDetails;
