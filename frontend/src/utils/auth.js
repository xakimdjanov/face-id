export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const saveAuth = ({ user, token }) => {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  if (token) {
    localStorage.setItem("token", token);
  }
};

export const clearAuth = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

export const getDefaultRouteByRole = (role) => {
  const routes = {
    superadmin: "/super/dashboard",
    manager: "/manager/dashboard",
    admin: "/admin/dashboard",
    teacher: "/teacher/dashboard",
    student: "/student/profile",
  };

  return routes[role] || "/";
};