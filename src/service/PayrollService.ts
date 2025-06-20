import axios from "axios";
import url from "./url";
import api from "./api";
import { PayrollSummary, Employee } from "@/types/type";

export const PayrollService = {
  // Tự động tính lương cho các appointments chưa xử lý
  processUnprocessedAppointments: async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await api.post(url.SALARY.PROCESS_UNPROCESSED);
    if (!response.data.success) {
      throw new Error(response.data.message || "Lỗi tính lương");
    }
    return response.data;
  },

  // Tạo bảng lương
  generatePayroll: async (
    employeeId: number,
    startDate: string,
    endDate: string
  ): Promise<{
    success: boolean;
    message: string;
    payrollSummary: PayrollSummary;
  }> => {
    const response = await api.post(url.SALARY.GENERATE_PAYROLL, null, {
      params: { employeeId, startDate, endDate },
    });
    if (!response.data.success) {
      throw new Error(response.data.message || "Lỗi tạo bảng lương");
    }
    return response.data;
  },

  // Duyệt bảng lương
  approvePayroll: async (
    payrollId: number,
    approverId: number
  ): Promise<{
    success: boolean;
    message: string;
    payroll: PayrollSummary;
  }> => {
    const response = await api.post(`${url.SALARY.APPROVE_PAYROLL}/${payrollId}`, null, {
      params: { approverId },
    });
    if (!response.data.success) {
      throw new Error(response.data.message || "Lỗi duyệt bảng lương");
    }
    return response.data;
  },

  // Đánh dấu đã trả lương
  markAsPaid: async (
    payrollId: number
  ): Promise<{
    success: boolean;
    message: string;
    payroll: PayrollSummary;
  }> => {
    const response = await api.post(`${url.SALARY.MARK_PAID}/${payrollId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || "Lỗi đánh dấu đã trả lương");
    }
    return response.data;
  },

  // Lấy bảng lương theo tháng
  getMonthlyPayrolls: async (
    year: number,
    month: number,
    employeeId?: number
  ): Promise<{
    success: boolean;
    payrolls: PayrollSummary[];
    period: string;
  }> => {
    const response = await api.get(url.SALARY.MONTHLY_PAYROLLS, {
      params: { year, month, employeeId },
    });
    if (!response.data.success) {
      throw new Error(response.data.message || "Lỗi lấy bảng lương theo tháng");
    }
    return {
      ...response.data,
      payrolls: response.data.payrolls || [],
    };
  },

  // Lấy bảng lương của nhân viên hiện tại theo tháng
  getMyPayrollByMonth: async (
    year: number,
    month: number
  ): Promise<{
    success: boolean;
    employee: { employeeId: number; email: string };
    payrolls: PayrollSummary[];
    month: number;
    year: number;
  }> => {
    const response = await api.get(url.SALARY.MY_PAYROLL, {
      params: { year, month },
    });
    if (!response.data.success) {
      throw new Error(response.data.message || "Lỗi lấy bảng lương cá nhân");
    }
    return {
      ...response.data,
      payrolls: response.data.payrolls || [],
    };
  },

  // Lấy lịch sử bảng lương của nhân viên hiện tại
  getMyPayrollHistory: async (
    page: number = 0,
    size: number = 10
  ): Promise<{
    success: boolean;
    employee: { employeeId: number; email: string };
    payrolls: PayrollSummary[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> => {
    const response = await api.get(url.SALARY.MY_PAYROLL_HISTORY, {
      params: { page, size },
    });
    if (!response.data.success) {
      throw new Error(response.data.message || "Lỗi lấy lịch sử bảng lương");
    }
    return {
      ...response.data,
      payrolls: response.data.payrolls || [],
    };
  },

  // Lấy danh sách nhân viên
  getAllEmployees: async (): Promise<{
    success: boolean;
    employees: Employee[];
  }> => {
    const response = await api.get(url.SALARY.EMPLOYEES);
    if (!response.data.success) {
      throw new Error(response.data.message || "Lỗi lấy danh sách nhân viên");
    }
    return {
      ...response.data,
      employees: response.data.employees || [],
    };
  },
};