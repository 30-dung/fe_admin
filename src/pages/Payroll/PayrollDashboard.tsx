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

const PayrollDashboard: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [payrolls, setPayrolls] = useState<PayrollSummary[]>([]);
    const [approverId, setApproverId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [pagination, setPagination] = useState<Pagination>({
        currentPage: 1,
        totalPages: 1,
        pageSize: 5, // Display 5 payrolls per page
        totalItems: 0,
    });

    useEffect(() => {
        setIsLoading(true);
        PayrollService.getAllEmployees()
            .then((response) => {
                setEmployees(response.employees || []);
                setIsLoading(false);
            })
            .catch((error) => {
                toast.error(`Lỗi lấy danh sách nhân viên: ${error.message}`);
                setEmployees([]);
                setIsLoading(false);
            });

        fetchAllPayrolls(pagination.currentPage, pagination.pageSize, year, month, selectedEmployee);
    }, [pagination.currentPage, pagination.pageSize]);

    const fetchAllPayrolls = async (page: number, size: number, year: number, month: number, employeeId?: number | null) => {
        try {
            setIsLoading(true);
            const response = await PayrollService.getMonthlyPayrolls(year, month, employeeId || undefined);
            const allPayrolls = response.payrolls || [];

            // Apply client-side pagination
            const totalItems = allPayrolls.length;
            const totalPages = Math.ceil(totalItems / size);
            const startIndex = (page - 1) * size;
            const endIndex = startIndex + size;
            const paginatedPayrolls = allPayrolls.slice(startIndex, endIndex);

            setPayrolls(paginatedPayrolls);
            setPagination(prev => ({
                ...prev,
                totalItems,
                totalPages,
                currentPage: page,
            }));
            setIsLoading(false);
        } catch (error: any) {
            toast.error(`Lỗi: ${error.message}`);
            setPayrolls([]);
            setIsLoading(false);
        }
    };

    const handleProcessUnprocessed = async () => {
        try {
            const response = await PayrollService.processUnprocessedAppointments();
            toast.success(response.message);
            fetchAllPayrolls(pagination.currentPage, pagination.pageSize, year, month, selectedEmployee);
        } catch (error: any) {
            toast.error(`Lỗi: ${error.message}`);
        }
    };

    const handleGeneratePayroll = async () => {
        if (!selectedEmployee || !startDate || !endDate) {
            toast.warn("Vui lòng chọn nhân viên và khoảng thời gian.");
            return;
        }
        try {
            const response = await PayrollService.generatePayroll(
                selectedEmployee,
                startDate,
                endDate
            );
            toast.success(response.message);
            fetchAllPayrolls(pagination.currentPage, pagination.pageSize, year, month, selectedEmployee);
            setShowDialog(false);
            setSelectedEmployee(null);
            setStartDate("");
            setEndDate("");
        } catch (error: any) {
            toast.error(`Lỗi: ${error.message}`);
        }
    };

    const handleApprovePayroll = async (payrollId: number) => {
        if (!approverId) {
            toast.warn("Vui lòng chọn người duyệt.");
            return;
        }
        try {
            const response = await PayrollService.approvePayroll(payrollId, approverId);
            toast.success(response.message);
            fetchAllPayrolls(pagination.currentPage, pagination.pageSize, year, month, selectedEmployee);
        } catch (error: any) {
            toast.error(`Lỗi: ${error.message}`);
        }
    };

    const handleMarkAsPaid = async (payrollId: number) => {
        try {
            const response = await PayrollService.markAsPaid(payrollId);
            toast.success(response.message);
            fetchAllPayrolls(pagination.currentPage, pagination.pageSize, year, month, selectedEmployee);
        } catch (error: any) {
            toast.error(`Lỗi: ${error.message}`);
        }
    };

    const handleGetMonthlyPayrolls = () => {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        fetchAllPayrolls(1, pagination.pageSize, year, month, selectedEmployee);
    };

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


    const handlePageChange = (page: number) => {
        if (page > 0 && page <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, currentPage: page }));
        }
    };

    return (
        <div>
            <PageBreadcrumb pageTitle="Quản Lý Bảng Lương" />
            <ComponentCard title="Quản Lý Bảng Lương">
                <div>
                    {/* Filter Section - Adjusted for consistent rounded-lg corners and refined dark mode styles */}
                    <div className="mb-6 flex flex-wrap gap-4 items-center">
                        {/* Search by Year */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleGetMonthlyPayrolls();
                            }}
                            className="relative flex-grow min-w-[180px]"
                        >
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Search size={18} />
                            </div>

                            <Input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                placeholder="Tìm theo năm..."
                                className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-10 shadow-sm
                                hover:border-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
                            />

                            {year && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setYear(new Date().getFullYear());
                                        handleGetMonthlyPayrolls();
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                    title="Xoá"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </form>

                        {/* Filter by Month - Uses rounded-lg and improved dark mode styles */}
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="flex-grow min-w-[150px] border border-gray-300 rounded-lg py-2 px-4 shadow-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-500
                            bg-white text-gray-800 /* Default light mode */
                            dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 /* Dark mode styles */
                            "
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <option key={m} value={m}>
                                    Tháng {m}
                                </option>
                            ))}
                        </select>

                        {/* Filter by Employee - Uses rounded-lg and improved dark mode styles */}
                        <select
                            value={selectedEmployee || ""}
                            onChange={(e) => setSelectedEmployee(Number(e.target.value) || null)}
                            className="flex-grow min-w-[200px] border border-gray-300 rounded-lg py-2 px-4 shadow-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-500
                            bg-white text-gray-800 /* Default light mode */
                            dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 /* Dark mode styles */
                            "
                        >
                            <option value="">Tất cả nhân viên</option>
                            {employees.map((emp) => (
                                <option key={emp.employeeId} value={emp.employeeId}>
                                    {emp.fullName || emp.email}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={handleGetMonthlyPayrolls}
                            disabled={isLoading}
                            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                            {isLoading ? "Đang tải..." : "Tìm kiếm"}
                        </button>
                    </div>

                    <div className="mb-6 flex flex-wrap gap-4">
                        <button
                            onClick={() => setShowDialog(true)}
                            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors flex-grow sm:flex-grow-0"
                        >
                            Tạo bảng lương
                        </button>
                        <button
                            onClick={handleProcessUnprocessed}
                            className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors flex-grow sm:flex-grow-0"
                        >
                            Tính lương cho các cuộc hẹn chưa xử lý
                        </button>
                    </div>

                    {/* Payroll list Table - Core changes for responsiveness without scroll */}
                    <div className="bg-white dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            {/* REMOVED table-fixed entirely from the table element. This allows for auto-sizing columns. */}
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr className="dark:bg-gray-900">
                                        {/* Removed w-[X%] and carefully applied min-w for columns that need it. */}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                                            Nhân viên
                                        </th>
                                        {/* Adjusted min-w for "Kỳ lương" as it contains date ranges */}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[180px]">
                                            Kỳ lương
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Lương cơ bản
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Hoa hồng
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Tổng lương
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Số luợng hoàn thành
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        {/* Adjusted min-w for "Hành động" as it contains multiple interactive elements */}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[160px]">
                                            Hành động
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                Đang tải...
                                            </td>
                                        </tr>
                                    ) : payrolls.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                Không có bảng lương nào.
                                            </td>
                                        </tr>
                                    ) : (
                                        payrolls.map((payroll) => (
                                            <tr key={payroll.payrollId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <td className="px-6 py-4 overflow-hidden text-ellipsis dark:text-gray-100">
                                                    {getEmployeeDisplayName(payroll.employee)}
                                                </td>
                                                {/* Ensure date format is compact and consider flex-wrap if dates are too long */}
                                                <td className="px-6 py-4 dark:text-gray-100 flex flex-col justify-center">
                                                    <span>{format(new Date(payroll.periodStartDate), "dd/MM/yyyy", { locale: vi })}</span>
                                                    <span>- {format(new Date(payroll.periodEndDate), "dd/MM/yyyy", { locale: vi })}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">
                                                    {Math.floor(payroll.baseSalary).toLocaleString("vi-VN")} VND
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">
                                                    {Math.floor(payroll.totalCommission).toLocaleString("vi-VN")} VND
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">
                                                    {Math.floor(payroll.totalAmount).toLocaleString("vi-VN")} VND
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">
                                                    {payroll.totalAppointments}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${payroll.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                                            payroll.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                                                                payroll.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {payroll.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {payroll.status === "DRAFT" && (
                                                        <div className="flex flex-col gap-2 items-stretch text-sm">
                                                            <select
                                                                value={approverId || ""}
                                                                onChange={(e) => setApproverId(Number(e.target.value) || null)}
                                                                className="border border-gray-300 p-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 w-full"
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
                                                                className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition text-sm w-full"
                                                            >
                                                                Duyệt
                                                            </button>
                                                        </div>
                                                    )}
                                                    {payroll.status === "APPROVED" && (
                                                        <button
                                                            onClick={() => handleMarkAsPaid(payroll.payrollId)}
                                                            className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition text-sm w-full"
                                                        >
                                                            Đánh dấu đã trả
                                                        </button>
                                                    )}
                                                    {(payroll.status === "PAID" || payroll.status === "PENDING") && (
                                                        <span className="text-gray-500 text-sm dark:text-gray-400">Không có hành động</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex justify-between items-center">
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            Trang trước
                        </button>
                        <span className="text-gray-700 dark:text-gray-200">
                            Trang {pagination.currentPage} /{" "}
                            {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={
                                pagination.currentPage === pagination.totalPages || payrolls.length < pagination.pageSize
                            }
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            Trang sau
                        </button>
                    </div>

                    {/* Modal for creating payroll */}
                    {showDialog && (
                        <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 dark:bg-black/60">
                            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
                                <button
                                    onClick={() => setShowDialog(false)}
                                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                                    aria-label="Đóng"
                                >
                                    <X size={22} />
                                </button>
                                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                                    Tạo bảng lương
                                </h2>
                                <form onSubmit={(e) => { e.preventDefault(); handleGeneratePayroll(); }} className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                            Chọn nhân viên
                                        </Label>
                                        <select
                                            value={selectedEmployee || ""}
                                            onChange={(e) => setSelectedEmployee(Number(e.target.value) || null)}
                                            required
                                            className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                                        >
                                            <option value="">Chọn nhân viên</option>
                                            {employees.map((emp) => (
                                                <option key={emp.employeeId} value={emp.employeeId}>
                                                    {emp.fullName || emp.email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                            Ngày bắt đầu
                                        </Label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            required
                                            className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                            Ngày kết thúc
                                        </Label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            required
                                            className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                                        />
                                    </div>
                                    <div className="col-span-full flex justify-end gap-3 mt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowDialog(false)}
                                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-200 transition dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-1.5 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                                        >
                                            Tạo
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                    <ToastContainer position="top-right" autoClose={3000} />
                </div>
            </ComponentCard>
        </div>
    );
};

export default PayrollDashboard;