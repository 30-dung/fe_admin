import { Navigate } from "react-router-dom";

import React from "react";

export default function PrivateRoute({ children }: { children: React.ReactElement }) {
  const user = localStorage.getItem("user");
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  return children;
}