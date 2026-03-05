import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import AddUser from "./components/AddUser";
import GetUsers from "./components/GetUsers";
import Layout from "./components/Layout";
import { Toaster } from "react-hot-toast";

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/adduser" element={<AddUser />} />
          <Route path="/getusers" element={<GetUsers />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
