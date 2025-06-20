export interface Employee {
  employeeId: number;
  employeeCode?: string;
  store?: any;
  roles?: string[];
  fullName?: string;
  avatarUrl?: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  specialization?: string;
  baseSalary: number;
  commissionRate: number;
  salaryType: "FIXED" | "MIXED" | "COMMISSION";
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
}

export interface PayrollSummary {
  payrollId: number;
  employee: number | Employee; // <--- SỬA TẠI ĐÂY
  periodStartDate: string;
  periodEndDate: string;
  baseSalary: number;
  totalCommission: number;
  totalAmount: number;
  totalAppointments: number;
  totalRevenue: number;
  status: "DRAFT" | "PENDING" | "APPROVED" | "PAID" | "CANCELLED";
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
  approvedBy?: number;
  notes?: string;
}

export interface SalaryRecord {
  salaryRecordId: number;
  employee: number;
  appointment: number;
  serviceAmount: number;
  commissionAmount: number;
  commissionRate: number;
  workDate: string;
  paymentStatus: "PENDING" | "PAID" | "CANCELLED";
  createdAt: string;
  paidAt?: string;
  notes?: string;
}