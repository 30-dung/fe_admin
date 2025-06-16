import React, { useState, useEffect } from "react";
import { PayrollService } from "@/service/PayrollService";
import { PayrollSummary, Employee } from "@/types/type";
import { format, addMonths, startOfMonth, setDate, isWithinInterval } from "date-fns";
import { vi } from "date-fns/locale";

const PayrollDashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollSummary[]>([]);
  const [message, setMessage] = useState<string>("");
  const [approverId, setApproverId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const employeesResponse = await PayrollService.getAllEmployees();
        console.log("Employees from API:", employeesResponse.employees); // Debug log
        setEmployees(employeesResponse.employees || []);

        const payrollsResponse = await PayrollService.getMonthlyPayrolls(year, month);
        console.log("Payrolls received:", payrollsResponse.payrolls); // Debug log
        setPayrolls(payrollsResponse.payrolls || []);
      } catch (error: any) {
        setMessage(`Lỗi: ${error.message}`);
        setEmployees([]);
        setPayrolls([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [year, month]);

  const handleProcessUnprocessed = async () => {
    try {
      const response = await PayrollService.processUnprocessedAppointments();
      setMessage(response.message);
      fetchAllPayrolls();
    } catch (error: any) {
      setMessage(`Lỗi: ${error.message}`);
    }
  };

  const fetchAllPayrolls = async () => {
    try {
      setIsLoading(true);
      const response = await PayrollService.getMonthlyPayrolls(year, month);
      console.log("Payrolls received:", response.payrolls); // Debug log
      setPayrolls(response.payrolls || []);
      setIsLoading(false);
    } catch (error: any) {
      setMessage(`Lỗi: ${error.message}`);
      setPayrolls([]);
      setIsLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const today = new Date();
      const startDate = setDate(startOfMonth(today), 5); // Ngày 5 của tháng hiện tại
      const endDate = setDate(addMonths(startOfMonth(today), 1), 5); // Ngày 5 của tháng sau

      const existingPayrollIds = new Set(payrolls.map((p) => p.employee.employeeId)); // Sửa để lấy employeeId từ object
      const newPayrolls: PayrollSummary[] = [];

      for (const employee of employees) {
        if (!existingPayrollIds.has(employee.employeeId)) {
          const response = await PayrollService.generatePayroll(
            employee.employeeId,
            format(startDate, "yyyy-MM-dd"),
            format(endDate, "yyyy-MM-dd")
          );
          newPayrolls.push(response.payrollSummary);
        }
      }

      if (newPayrolls.length > 0) {
        setPayrolls((prev) => [...prev, ...newPayrolls]);
        setMessage("Tạo bảng lương thành công");
      } else {
        setMessage("Tất cả nhân viên đã có bảng lương trong kỳ này");
      }
    } catch (error: any) {
      setMessage(`Lỗi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePayroll = async (payrollId: number) => {
    if (!approverId) {
      setMessage("Vui lòng chọn người duyệt.");
      return;
    }
    try {
      const response = await PayrollService.approvePayroll(payrollId, approverId);
      setMessage(response.message);
      setPayrolls(
        payrolls.map((p) => (p.payrollId === payrollId ? response.payroll : p))
      );
    } catch (error: any) {
      setMessage(`Lỗi: ${error.message}`);
    }
  };

  const handleMarkAsPaid = async (payrollId: number) => {
    try {
      const response = await PayrollService.markAsPaid(payrollId);
      setMessage(response.message);
      setPayrolls(
        payrolls.map((p) => (p.payrollId === payrollId ? response.payroll : p))
      );
    } catch (error: any) {
      setMessage(`Lỗi: ${error.message}`);
    }
  };

  const handleGetMonthlyPayrolls = async () => {
    try {
      setIsLoading(true);
      const response = await PayrollService.getMonthlyPayrolls(
        year,
        month,
        selectedEmployee || undefined
      );
      setPayrolls(response.payrolls || []);
      setMessage(`Lấy bảng lương tháng ${month}/${year} thành công.`);
      setIsLoading(false);
    } catch (error: any) {
      setMessage(`Lỗi: ${error.message}`);
      setPayrolls([]);
      setIsLoading(false);
    }
  };

  const getEmployeeDisplayName = (employee: number | { employeeId: number }): string => {
    let employeeId: number;
    if (typeof employee === "object" && employee !== null && "employeeId" in employee) {
      employeeId = employee.employeeId;
    } else {
      employeeId = employee as number;
    }
    const employeeObj = employees.find((e) => e.employeeId === employeeId);
    return employeeObj
      ? employeeObj.fullName || employeeObj.email || `ID: ${employeeId}`
      : `ID: ${employeeId} (Không tìm thấy tên)`;
  };

  // Phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayrolls = payrolls.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(payrolls.length / itemsPerPage);

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Quản lý bảng lương</h1>
      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.includes("Lỗi") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Search monthly payroll */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Tìm kiếm bảng lương theo tháng</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="number"
            value={year}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYear(Number(e.target.value))}
            placeholder="Năm"
            className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
          <select
            value={month}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMonth(Number(e.target.value))}
            className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>
          <select
            value={selectedEmployee || ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedEmployee(Number(e.target.value) || null)}
            className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          >
            <option value="">Tất cả nhân viên</option>
            {employees.map((emp) => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.fullName || emp.email}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleGetMonthlyPayrolls}
          disabled={isLoading}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 w-full sm:w-auto"
        >
          {isLoading ? "Đang tải..." : "Tìm kiếm"}
        </button>
      </div>

      {/* Action buttons */}
      <div className="mb-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          onClick={handleGeneratePayroll}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 w-full sm:w-auto"
        >
          {isLoading ? "Đang tạo..." : "Tạo bảng lương"}
        </button>
        <button
          onClick={handleProcessUnprocessed}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition w-full sm:w-auto"
        >
          Tính lương cho các cuộc hẹn chưa xử lý
        </button>
      </div>

      {/* Payroll list */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Danh sách bảng lương</h2>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-2 text-left text-gray-600">Mã nhân viên</th>
                  <th className="py-3 px-2 text-left text-gray-600">Nhân viên</th>
                  <th className="py-3 px-2 text-left text-gray-600">Kỳ lương</th>
                  <th className="py-3 px-2 text-left text-gray-600">Lương cơ bản</th>
                  <th className="py-3 px-2 text-left text-gray-600">Hoa hồng</th>
                  <th className="py-3 px-2 text-left text-gray-600">Tổng lương</th>
                  <th className="py-3 px-2 text-left text-gray-600">Trạng thái</th>
                  <th className="py-3 px-2 text-left text-gray-600">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentPayrolls.length > 0 ? (
                  currentPayrolls.map((payroll) => {
                    const employeeId = typeof payroll.employee === "object" && payroll.employee !== null ? payroll.employee.employeeId : payroll.employee as number;
                    const employeeObj = employees.find((e) => e.employeeId === employeeId);
                    console.log(`Rendering - Payroll employeeId: ${employeeId}, EmployeeObj:`, employeeObj); // Debug log
                    return (
                      <tr key={payroll.payrollId} className="border-t">
                        <td className="py-2 px-2">
                          {employeeObj ? employeeObj.employeeCode || "N/A" : "N/A"}
                        </td>
                        <td className="py-2 px-2">
                          {getEmployeeDisplayName(payroll.employee)}
                        </td>
                        <td className="py-2 px-2">
                          {format(new Date(payroll.periodStartDate), "dd/MM/yyyy", { locale: vi })} -{" "}
                          {format(new Date(payroll.periodEndDate), "dd/MM/yyyy", { locale: vi })}
                        </td>
                        <td className="py-2 px-2">{payroll.baseSalary.toLocaleString("vi-VN")} VND</td>
                        <td className="py-2 px-2">{payroll.totalCommission.toLocaleString("vi-VN")} VND</td>
                        <td className="py-2 px-2">{payroll.totalAmount.toLocaleString("vi-VN")} VND</td>
                        <td className="py-2 px-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              payroll.status === "PAID"
                                ? "bg-green-100 text-green-800"
                                : payroll.status === "APPROVED"
                                ? "bg-blue-100 text-blue-800"
                                : payroll.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {payroll.status}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          {payroll.status === "DRAFT" && (
                            <div className="flex gap-2 items-center flex-col sm:flex-row">
                              <select
                                value={approverId || ""}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                  setApproverId(Number(e.target.value) || null)
                                }
                                className="border border-gray-300 p-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                              >
                                <option value="">Chọn người duyệt</option>
                                {employees.map((emp) => (
                                  <option key={emp.employeeId} value={emp.employeeId}>
                                    {emp.fullName || emp.email}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleApprovePayroll(payroll.payrollId)}
                                className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition text-sm w-full sm:w-auto mt-2 sm:mt-0"
                              >
                                Duyệt
                              </button>
                            </div>
                          )}
                          {payroll.status === "APPROVED" && (
                            <button
                              onClick={() => handleMarkAsPaid(payroll.payrollId)}
                              className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition text-sm w-full sm:w-auto"
                            >
                              Đánh dấu đã trả
                            </button>
                          )}
                          {(payroll.status === "PAID" || payroll.status === "PENDING") && (
                            <span className="text-gray-500 text-sm">Không có hành động</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 px-4 text-center text-gray-500">
                      Không có bảng lương nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-4 flex justify-center space-x-2 flex-wrap">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg ${
                    currentPage === page ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                  } hover:bg-blue-700 hover:text-white transition m-1`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollDashboard;