import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Auth/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

// Super Admin
import SuperLayout from "./components/Layouts/SuperLayout";
import SuperDashboard from "./components/superadmin/SuperDashboard";
import SuperAddBranch from "./components/superadmin/SuperAddBranch";
import SuperManager from "./components/superadmin/SuperManager";
import SuperSetting from "./components/superadmin/SuperSetting";
import SuperUsers from "./components/superadmin/SuperUsers";

// Manager
import ManagerLayout from "./components/Layouts/ManagerLayout";
import ManagerDashboard from "./components/manager/ManagerDashboard";
import ManagerGroups from "./components/manager/ManagerGoups";
import ManagerPayments from "./components/manager/ManagerPayments";
import ManagerAdmin from "./components/manager/ManagerAdmin";
import ManagerStudent from "./components/manager/ManagerStudent";
import ManagerTeacher from "./components/manager/ManagerTeacher";
import StudentDetails from "./pages/Manager/StudentDetails";

// Admin
import AdminAttendance from "./components/admin/AdminAttendance";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminGroup from "./components/admin/AdminGroup";
import AdminPayment from "./components/admin/AdminPayment";
import AdminStudent from "./components/admin/AdminStudent";
import AdminTeacher from "./components/admin/AdminTeacher";
import AdminLayout from "./components/Layouts/AdminLayout";
import ManagerCourse from "./components/manager/ManagerCourse";
import AdminAddUserFace from "./pages/Admin/AdminAddUserFace";

// Teacher
import TeacherAttendance from "./components/teacher/TeacherAttendance";
import TeacherDashboard from "./components/teacher/TeacherDashboard";
import TeacherGroups from "./components/teacher/TeacherGroups";
import TeacherStudents from "./components/teacher/TeacherStudents";
import TeacherLayout from "./components/Layouts/TeacherLayout";
import TeacherDetails from "./pages/Teacher/TeacherDetails";
import TeacherListDetails from "./pages/Teacher/TeacherListDetails";

// Student
import StudentMyGroup from "./components/student/StudentMyGroup";
import StudentsMyPofile from "./components/student/StudentsMyPofile";
import StudentAttendance from "./components/student/StudentAttendance";
import StudentDetailsGroup from "./pages/Student/StudentDetails";
import StudentLayout from "./components/Layouts/StudentLayout";

const App = () => {
  return (
    <>
      <Toaster position="top-right" />

      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/super"
          element={
            <ProtectedRoute role="superadmin">
              <SuperLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<SuperDashboard />} />
          <Route path="addbranch" element={<SuperAddBranch />} />
          <Route path="manager" element={<SuperManager />} />
          <Route path="setting" element={<SuperSetting />} />
          <Route path="users" element={<SuperUsers />} />
        </Route>

        <Route
          path="/manager"
          element={
            <ProtectedRoute role="manager">
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="groups" element={<ManagerGroups />} />
          <Route path="payments" element={<ManagerPayments />} />
          <Route path="admins" element={<ManagerAdmin />} />
          <Route path="students" element={<ManagerStudent />} />
          <Route path="teachers" element={<ManagerTeacher />} />
          <Route path="course" element={<ManagerCourse />} />
          <Route path="studentdetails/:groupId" element={<StudentDetails />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="groups" element={<AdminGroup />} />
          <Route path="payments" element={<AdminPayment />} />
          <Route path="students" element={<AdminStudent />} />
          <Route path="teachers" element={<AdminTeacher />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="addface" element={<AdminAddUserFace />} />
        </Route>

        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="teacher">
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="groups" element={<TeacherGroups />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="deatils" element={<TeacherDetails />} />
          <Route path="listdeatils" element={<TeacherListDetails />} />
        </Route>

        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="groups" element={<StudentMyGroup />} />
          <Route path="profile" element={<StudentsMyPofile />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="details/:groupId" element={<StudentDetailsGroup />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
