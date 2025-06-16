import React, { useState, useEffect } from "react";
import { PayrollService } from "@/service/PayrollService";
import { PayrollSummary } from "@/types/type";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const EmployeePayroll: React.FC = () => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [payrolls, setPayrolls] = useState<PayrollSummary[]>([]);
  const [message, setMessage] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleGetMyPayrollByMonth = async () => {
    try {
      const response = await PayrollService.getMyPayrollByMonth(year, month);
      setPayrolls(response.payrolls || []);
      setMessage(`Lấy bảng lương tháng ${month}/${year} thành công.`);
    } catch (error: any) {
      setMessage(`Lỗi: ${error.message}`);
      setPayrolls([]);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    PayrollService.getMyPayrollHistory(page)
      .then((response) => {
        setPayrolls(response.payrolls || []);
        setTotalPages(response.totalPages || 0);
        setIsLoading(false);
      })
      .catch((error) => {
        setMessage(`Lỗi lấy lịch sử bảng lương: ${error.message}`);
        setPayrolls([]);
        setIsLoading(false);
      });
  }, [page]);

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Bảng lương của tôi</h1>
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
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Xem bảng lương theo tháng</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            placeholder="Năm"
            className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleGetMyPayrollByMonth}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Xem bảng lương
        </button>
      </div>

      {/* Payroll history */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Lịch sử bảng lương</h2>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 text-left text-gray-600">Kỳ lương</th>
                    <th className="py-3 px-4 text-left text-gray-600">Tổng lương</th>
                    <th className="py-3 px-4 text-left text-gray-600">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.length > 0 ? (
                    payrolls.map((payroll) => (
                      <tr key={payroll.payrollId} className="border-t">
                        <td className="py-3 px-4">
                          {format(new Date(payroll.periodStartDate), "dd/MM/yyyy", { locale: vi })} -{" "}
                          {format(new Date(payroll.periodEndDate), "dd/MM/yyyy", { locale: vi })}
                        </td>
                        <td className="py-3 px-4">{payroll.totalAmount.toLocaleString("vi-VN")} VND</td>
                        <td className="py-3 px-4">{payroll.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-3 px-4 text-center text-gray-500">
                        Không có lịch sử bảng lương.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={page === 0}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-300 transition"
              >
                Trang trước
              </button>
              <span>Trang {page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page + 1 >= totalPages}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-300 transition"
              >
                Trang sau
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeePayroll;