// src/components/ecommerce/AppointmentStatusMetrics.tsx
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/service/api";
import url from "@/service/url";
import { useAuth } from "@/context/AuthContext";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELED" | "REJECTED";

export default function AppointmentStatusMetrics() {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [confirmedCount, setConfirmedCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [canceledCount, setCanceledCount] = useState<number>(0);
  const [rejectedCount, setRejectedCount] = useState<number>(0);
  const navigate = useNavigate();
  const { auth, isLoadingAuth } = useAuth();

  const getTodayDateRange = useCallback(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return {
      startDate: start.toLocaleString("sv-SE").replace(" ", "T"),
      endDate: end.toLocaleString("sv-SE").replace(" ", "T")
    };
  }, []);

  const fetchAppointmentCounts = useCallback(async () => {
    if (isLoadingAuth) {
      console.log("AppointmentStatusMetrics Debug: Auth loading, skipping count fetch.");
      return;
    }

    if (!auth.isAuthenticated || !auth.role) {
      console.warn("AppointmentStatusMetrics Debug: Auth info not available or incomplete, skipping appointment count fetch.");
      setPendingCount(0);
      setConfirmedCount(0);
      setCanceledCount(0);
      setRejectedCount(0);
      setCompletedCount(0);
      return;
    }

    try {
      const statuses: AppointmentStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELED", "REJECTED"];
      const counts: Record<AppointmentStatus, number> = {
        PENDING: 0,
        CONFIRMED: 0,
        COMPLETED: 0,
        CANCELED: 0,
        REJECTED: 0,
      };

      const { startDate, endDate } = getTodayDateRange();

      for (const status of statuses) {
        let response;
        const params: any = {
          status: status,
          startDate: startDate,
          endDate: endDate
        };

        if (auth.role.includes("ROLE_ADMIN")) {
          console.log(`AppointmentStatusMetrics Debug: Admin fetching count for ${status} with params:`, params);
          response = await api.get(`${url.APPOINTMENT.FILTER}`, { params });
        } else if (auth.role.includes("ROLE_EMPLOYEE") && auth.email) {
          params.employeeEmail = auth.email;
          console.log(`AppointmentStatusMetrics Debug: Employee fetching count for ${status} with params:`, params);
          response = await api.get(`${url.APPOINTMENT.GET_BY_EMPLOYEE.replace("{email}", auth.email)}`, { params });
        } else {
          console.warn("AppointmentStatusMetrics Debug: Role not recognized for fetching counts.");
          continue;
        }
        counts[status] = response.data.length;
      }

      setPendingCount(counts.PENDING);
      setConfirmedCount(counts.CONFIRMED);
      setCompletedCount(counts.COMPLETED);
      setCanceledCount(counts.CANCELED);
      setRejectedCount(counts.REJECTED);
      console.log("AppointmentStatusMetrics Debug: Counts updated successfully.");
    } catch (error) {
      console.error("AppointmentStatusMetrics Error: Error fetching appointment counts:", error);
      setPendingCount(0);
      setConfirmedCount(0);
      setCompletedCount(0);
      setCanceledCount(0);
      setRejectedCount(0);
    }
  }, [auth.role, auth.email, auth.isAuthenticated, isLoadingAuth, getTodayDateRange]);

  useEffect(() => {
    fetchAppointmentCounts();
  }, [fetchAppointmentCounts]);

  const handleNavigate = (status: AppointmentStatus) => {
    if (isLoadingAuth || !auth.isAuthenticated) {
      console.warn("AppointmentStatusMetrics Debug: Auth not ready, cannot navigate.");
      return;
    }

    let query = `?status=${status}&timeRange=DAY`;

    let targetPath = "";
    if (auth.role && auth.role.includes("ROLE_ADMIN")) {
      targetPath = "/admin-appointments";
    } else if (auth.role && auth.role.includes("ROLE_EMPLOYEE") && auth.email) {
      targetPath = "/basic-tables";
      query += `&employeeEmail=${auth.email}`;
    } else {
      console.warn("AppointmentStatusMetrics Debug: Invalid role or not authenticated, cannot navigate.");
      return;
    }
    console.log("AppointmentStatusMetrics Debug: Navigating to:", `${targetPath}${query}`);
    navigate(`${targetPath}${query}`);
  };

  const getBadgeDisplay = (status: AppointmentStatus) => {
    let badgeColor: "success" | "error" | "warning" | "info" | "primary" | "light" | "danger" = "info";
    let displayText = "";

    switch (status) {
      case "PENDING":
        displayText = "Chờ xác nhận";
        badgeColor = "warning";
        break;
      case "CONFIRMED":
        displayText = "Đã xác nhận";
        badgeColor = "primary";
        break;
      case "COMPLETED":
        displayText = "Hoàn thành";
        badgeColor = "success";
        break;
      case "CANCELED":
        displayText = "Đã hủy";
        badgeColor = "light";
        break;
      case "REJECTED":
        displayText = "Đã từ chối";
        badgeColor = "danger";
        break;
      default:
        displayText = "Không rõ";
        badgeColor = "info";
        break;
    }
    return { displayText, badgeColor };
  };

  const isAdmin = auth.role && auth.role.includes("ROLE_ADMIN");

  return (
    <div className={`grid gap-4 md:gap-6 ${
      isAdmin 
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" 
        : "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
    }`}>
      {/* PENDING Appointments */}
      <div
        className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 cursor-pointer flex flex-col items-center justify-center text-center"
        onClick={() => handleNavigate("PENDING")}
      >
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 mb-4">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Lịch hẹn chờ xác nhận
        </span>
        <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90 mb-3">
          {pendingCount.toLocaleString()}
        </h4>
        <Badge color={getBadgeDisplay("PENDING").badgeColor}>
          {getBadgeDisplay("PENDING").displayText}
        </Badge>
      </div>

      {/* CONFIRMED Appointments */}
      <div
        className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 cursor-pointer flex flex-col items-center justify-center text-center"
        onClick={() => handleNavigate("CONFIRMED")}
      >
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 mb-4">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Lịch hẹn đã xác nhận
        </span>
        <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90 mb-3">
          {confirmedCount.toLocaleString()}
        </h4>
        <Badge color={getBadgeDisplay("CONFIRMED").badgeColor}>
          {getBadgeDisplay("CONFIRMED").displayText}
        </Badge>
      </div>

      {/* COMPLETED Appointments */}
      <div
        className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 cursor-pointer flex flex-col items-center justify-center text-center"
        onClick={() => handleNavigate("COMPLETED")}
      >
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 mb-4">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Lịch hẹn đã hoàn thành
        </span>
        <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90 mb-3">
          {completedCount.toLocaleString()}
        </h4>
        <Badge color={getBadgeDisplay("COMPLETED").badgeColor}>
          {getBadgeDisplay("COMPLETED").displayText}
        </Badge>
      </div>

      {/* CANCELED Appointments */}
      <div
        className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 cursor-pointer flex flex-col items-center justify-center text-center"
        onClick={() => handleNavigate("CANCELED")}
      >
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 mb-4">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Lịch hẹn đã hủy
        </span>
        <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90 mb-3">
          {canceledCount.toLocaleString()}
        </h4>
        <Badge color={getBadgeDisplay("CANCELED").badgeColor}>
          {getBadgeDisplay("CANCELED").displayText}
        </Badge>
      </div>

      {/* REJECTED Appointments (Only for Admin) */}
      {isAdmin && (
        <div
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 cursor-pointer flex flex-col items-center justify-center text-center"
          onClick={() => handleNavigate("REJECTED")}
        >
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 mb-4">
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Lịch hẹn đã từ chối
          </span>
          <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90 mb-3">
            {rejectedCount.toLocaleString()}
          </h4>
          <Badge color={getBadgeDisplay("REJECTED").badgeColor}>
            {getBadgeDisplay("REJECTED").displayText}
          </Badge>
        </div>
      )}
    </div>
  );
}