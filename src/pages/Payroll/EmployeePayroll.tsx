import React, { useState, useEffect } from "react";
import { PayrollService } from "@/service/PayrollService";
import { PayrollSummary, Employee } from "@/types/type";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast, ToastContainer } from "react-toastify";
import { Search, X } from "lucide-react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface Pagination {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
}

const EmployeePayroll: React.FC = () => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [payrolls, setPayrolls] = useState<PayrollSummary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const pageSize = 5;

  const fetchPayrollHistory = async (currentPage: number) => {
    setIsLoading(true);
    try {
      const response = await PayrollService.getMyPayrollHistory(currentPage);
      setPayrolls(response.payrolls || []);
      setTotalPages(response.totalPages || 0);
      toast.success(`Lịch sử bảng lương đã được tải.`, { autoClose: 1000 });
    } catch (error: any) {
      toast.error(`Lỗi lấy lịch sử bảng lương: ${error.message}`);
      setPayrolls([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetMyPayrollByMonth = async () => {
    setIsLoading(true);
    try {
      const response = await PayrollService.getMyPayrollByMonth(year, month);
      const allPayrolls = response.payrolls || [];
      setPayrolls(allPayrolls);
      setPage(0);
      setTotalPages(Math.ceil(allPayrolls.length / pageSize));
      toast.success(`Lấy bảng lương tháng ${month}/${year} thành công.`, { autoClose: 1000 });
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
      setPayrolls([]);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    PayrollService.getAllEmployees()
        .then(response => {
            setEmployees(response.employees || []);
        })
        .catch(error => {
            console.error("Error fetching employees:", error);
        });

    fetchPayrollHistory(page);
  }, [page]);

  const getEmployeeDisplayName = (employeeData: number | Employee): string => {
    let id: number;
    if (typeof employeeData === 'object' && employeeData !== null && 'employeeId' in employeeData) {
        id = employeeData.employeeId;
    } else if (typeof employeeData === 'number') {
        id = employeeData;
    } else {
        return `ID: N/A (Dữ liệu không hợp lệ)`;
    }

    const employee = employees.find((e) => e.employeeId === id);
    return employee ? (employee.fullName || employee.email || `ID: ${id}`) : `ID: ${id} (Không tìm thấy tên)`;
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Bảng lương của tôi" />
      <ComponentCard title="Lịch sử bảng lương">
        <div>
          {/* Search monthly payroll */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleGetMyPayrollByMonth();
                }}
                className="relative flex-grow min-w-[150px]"
            >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Search size={18} />
                </div>
                <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    placeholder="Tìm theo năm..."
                    className="w-full border border-gray-300 rounded-full py-2 pl-10 pr-10 shadow-sm
                    hover:border-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-gray-200"
                />
                {year && (
                    <button
                        type="button"
                        onClick={() => {
                            setYear(new Date().getFullYear());
                            handleGetMyPayrollByMonth();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                        title="Xoá"
                    >
                        <X size={18} />
                    </button>
                )}
            </form>
            <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="flex-grow min-w-[120px] border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
            >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                        Tháng {m}
                    </option>
                ))}
            </select>
            <button
                onClick={handleGetMyPayrollByMonth}
                disabled={isLoading}
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 flex-shrink-0"
            >
                {isLoading ? "Đang tải..." : "Xem bảng lương"}
            </button>
          </div>

          {/* Payroll history table */}
          <div className="bg-white dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed"> {/* Adjusted dark border color */}
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr className="dark:bg-gray-900">
                    <th className="w-[30%] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"> {/* Adjusted dark text color */}
                      Kỳ lương
                    </th>
                    <th className="w-[25%] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"> {/* Adjusted dark text color */}
                      Tổng lương
                    </th>
                    <th className="w-[30%] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"> {/* Adjusted dark text color */}
                      Số lượng hoàn thành
                    </th>
                    <th className="w-[25%] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"> {/* Adjusted dark text color */}
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"> {/* Adjusted dark border color */}
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        Đang tải...
                      </td>
                    </tr>
                  ) : payrolls.length > 0 ? (
                    payrolls.slice(page * pageSize, (page + 1) * pageSize).map((payroll) => (
                      <tr key={payroll.payrollId} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"> {/* Adjusted dark border color */}
                        <td className="py-3 px-4 dark:text-gray-100"> {/* Ensured text is white in dark mode */}
                          {format(new Date(payroll.periodStartDate), "dd/MM/yyyy", { locale: vi })} -{" "}
                          {format(new Date(payroll.periodEndDate), "dd/MM/yyyy", { locale: vi })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap dark:text-gray-100"> {/* Ensured text is white in dark mode */}
                          {payroll.totalAmount.toLocaleString("vi-VN")} VND
                        </td>
                        <td className="py-3 px-24 whitespace-nowrap dark:text-gray-100"> {/* Ensured text is white in dark mode */}
                          {payroll.totalAppointments}
                        </td>
                        <td className="py-3 px-10">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            payroll.status === 'PAID' ? 'bg-green-100 text-green-800' :
                            payroll.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                            payroll.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payroll.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-3 px-4 text-center text-gray-500 dark:text-gray-400">
                        Không có lịch sử bảng lương.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={page === 0}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Trang trước
              </button>
              <span className="text-gray-700 dark:text-gray-200">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page + 1 >= totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Trang sau
              </button>
            </div>
          </div > {/* Close ComponentCard div properly */}
        </div> {/* Close content wrapper div */}
      </ComponentCard>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default EmployeePayroll;