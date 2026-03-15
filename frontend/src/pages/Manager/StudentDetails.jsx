import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { studentGroupService, userService } from "../../services/api";
import {
  HiOutlineChevronLeft,
  HiOutlineUserAdd,
  HiOutlineIdentification,
  HiOutlineInbox
} from "react-icons/hi";
import toast from "react-hot-toast";

const StudentDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [students, setStudents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [enrolledRes, usersRes] = await Promise.all([
        studentGroupService.getById(Number(groupId)),
        userService.getAll()
      ]);

      const enrolledStudents = enrolledRes.data.data || [];
      const users = usersRes.data.data || [];

      setStudents(enrolledStudents);

      const enrolledIds = enrolledStudents.map((s) => s.studentId);

      const availableStudents = users.filter(
        (u) =>
          u.role === "student" &&
          u.branchId === user?.branchId &&
          !enrolledIds.includes(u.id)
      );

      setAllUsers(availableStudents);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to sync group records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const handleEnroll = async (e) => {
    e.preventDefault();

    if (!selectedStudentId)
      return toast.error("Please select a student");

    const loadingToast = toast.loading("Processing enrollment...");

    try {
      await studentGroupService.create({
        groupId: Number(groupId),
        studentId: Number(selectedStudentId)
      });

      toast.success("Student enrolled successfully", {
        id: loadingToast
      });

      setIsModalOpen(false);
      setSelectedStudentId("");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Enrollment failed", { id: loadingToast });
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold text-sm"
        >
          <HiOutlineChevronLeft />
          Back to Groups
        </button>
      </div>

      {/* STUDENTS TABLE */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">

            <thead>
              <tr className="bg-gray-50">
                <th className="p-6 text-xs font-bold text-gray-400 uppercase">Full Name</th>
                <th className="p-6 text-xs font-bold text-gray-400 uppercase">Email</th>
                <th className="p-6 text-xs font-bold text-gray-400 uppercase text-right">Role</th>
              </tr>
            </thead>

            <tbody className="divide-y">

              {loading && (
                <tr>
                  <td colSpan="3" className="p-10 text-center text-gray-400">
                    Loading students...
                  </td>
                </tr>
              )}

              {!loading && students.length > 0 &&
                students.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">

                    <td className="p-6">
                      <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold">
                          {item.student?.fullname?.charAt(0)}
                        </div>

                        <span className="font-semibold">
                          {item.student?.fullname}
                        </span>

                      </div>
                    </td>

                    <td className="p-6 text-gray-500">
                      {item.student?.email || "No email"}
                    </td>

                    <td className="p-6 text-right">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                        Student
                      </span>
                    </td>

                  </tr>
                ))}

              {!loading && students.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-20 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <HiOutlineInbox size={40} />
                      No students enrolled yet
                    </div>
                  </td>
                </tr>
              )}

            </tbody>

          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">

          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative bg-white w-full max-w-md p-8 rounded-3xl shadow-xl">

            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <HiOutlineIdentification />
              Enroll Student
            </h2>

            <form onSubmit={handleEnroll} className="space-y-5">

              <select
                value={selectedStudentId}
                onChange={(e) =>
                  setSelectedStudentId(e.target.value)
                }
                className="w-full p-3 border rounded-xl"
                required
              >
                <option value="">Select student</option>

                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullname}
                  </option>
                ))}

              </select>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700"
              >
                Confirm Enrollment
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default StudentDetails;