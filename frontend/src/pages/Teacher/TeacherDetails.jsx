import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { studentGroupService, userService, paymentService } from "../../services/api";
import { HiOutlineArrowLeft, HiOutlinePhone, HiOutlineUserGroup } from "react-icons/hi";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import toast from "react-hot-toast";

const TeacherDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const groupId = state?.groupId;
  
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      navigate("/teacher/groups");
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const [sgRes, userRes, payRes] = await Promise.all([
          studentGroupService.getById(groupId),
          userService.getAll(),
          paymentService.getAll()
        ]);

        const sgData = sgRes?.data?.data || sgRes?.data || [];
        const allUsers = userRes?.data?.data || userRes?.data || [];
        const allPayments = payRes?.data?.data || payRes?.data || [];

        const groupStudents = sgData.map(item => {
          return allUsers.find(u => Number(u.id) === Number(item.studentId));
        }).filter(Boolean);

        setStudents(groupStudents);
        setPayments(allPayments);
      } catch (error) {
        toast.error("Error loading student details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [groupId, navigate]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 font-medium transition-colors"
      >
        <HiOutlineArrowLeft /> Back to Groups
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <HiOutlineUserGroup size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{state?.groupName || "Group Details"}</h2>
          </div>
          <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-full border">
            {students.length} Students
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b">
                <th className="px-8 py-4">Student Name</th>
                <th className="px-8 py-4">Contact</th>
                <th className="px-8 py-4 text-center">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student) => {
                const isPaid = payments.some(p => 
                  Number(p.studentId) === Number(student.id) && 
                  Number(p.groupId) === Number(groupId) && 
                  p.status === "paid"
                );

                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-700">{student.fullname}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <HiOutlinePhone className="text-slate-400" />
                        {student.phone}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase border border-emerald-100">
                          <IoCheckmarkCircle size={14} /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase border border-rose-100">
                          <IoCloseCircle size={14} /> Unpaid
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherDetails;