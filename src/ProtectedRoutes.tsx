import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRoutesProps {
  allowedRoles: string[]; // Sửa từ allowdRoles thành allowedRoles
}

export const ProtectedRoutes = ({ allowedRoles }: ProtectedRoutesProps) => {
  const token = localStorage.getItem('token'); // Sửa từ access_token thành token
  const role = localStorage.getItem('role'); // Sửa từ user_role thành role

  if (!token || !role || !allowedRoles.some(allowedRole => role.includes(allowedRole))) {
    // Chuyển hướng đến login, kèm theo URL hiện tại
    return <Navigate to={`/signin`} replace={true} />;
  }

  // Nếu người dùng được xác thực và có vai trò yêu cầu, render các component con
  return <Outlet />;
};