import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import axios from "../../service/api";
import url from "../../service/url";

interface Appointment {
  appointmentId: number;
  storeName: string;
  serviceName: string;
  userName: string;
  employeeName: string;
  employeeEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}

interface Employee {
  employeeId: number;
  fullName: string;
  email: string;
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [employeeFilter, setEmployeeFilter] = useState<string>("ALL");
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>("ALL");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(url.EMPLOYEE.GET_ALL);
        setEmployees(response.data);
      } catch (err: any) {
        setError("Không thể tải danh sách nhân viên");
      }
    };

    const fetchAppointments = async () => {
      try {
        const params: any = {};
        if (statusFilter !== "ALL") params.status = statusFilter;
        if (employeeFilter !== "ALL") params.employeeEmail = employeeFilter;
        // Gửi các giá trị startDateFilter và endDateFilter đã được tính toán dưới dạng ISO string (UTC)
        if (startDateFilter) params.startDate = startDateFilter;
        if (endDateFilter) params.endDate = endDateFilter;

        const response = await axios.get(url.APPOINTMENT.FILTER, { params });
        console.log("Raw appointments data:", response.data);

        const processedAppointments: Appointment[] = response.data.map((item: any) => ({
          appointmentId: item.appointmentId,
          storeName: item.storeService?.storeName || "Unknown Store",
          serviceName: item.storeService?.serviceName || "Unknown Service",
          employeeName: item.employee?.fullName || "Unknown Employee",
          employeeEmail: item.employee?.email || "Unknown Email",
          startTime: item.startTime || new Date().toISOString(),
          endTime: item.endTime || new Date().toISOString(),
          status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase() : "Unknown",
          userName: item.user?.fullName || "Unknown User",
          createdAt: item.createdAt || new Date().toISOString(),
        }));

        const sortedAppointments = processedAppointments.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        console.log("Processed appointments:", sortedAppointments);
        setAppointments(sortedAppointments);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching appointments:", err.response?.data || err);
        setError(err.response?.data?.message || "Không thể tải danh sách lịch hẹn");
        setLoading(false);
      }
    };

    fetchEmployees();
    fetchAppointments();
  }, [statusFilter, employeeFilter, startDateFilter, endDateFilter]);

  const handleViewDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "warning";
      case "Confirmed":
        return "primary";
      case "Completed":
        return "success";
      case "Canceled":
        return "light";
      default:
        return "error";
    }
  };

  const handleComplete = async (appointmentId: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await axios.patch(url.APPOINTMENT.COMPLETE.replace("${id}", appointmentId.toString()));
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointmentId === appointmentId ? { ...a, status: "Completed" } : a
        )
      );
      setSelectedAppointment((prev) =>
        prev && prev.appointmentId === appointmentId ? { ...prev, status: "Completed" } : prev
      );
    } catch (error: any) {
      alert(`Hoàn thành thất bại: ${error.response?.data || "Lỗi hệ thống"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTimeRangeChange = (value: string) => {
  setTimeRangeFilter(value);
  const now = new Date();

  let start: Date;
  let end: Date;

  if (value === "DAY") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    setStartDateFilter(start.toLocaleString("sv-SE").replace(" ", "T"));
    setEndDateFilter(end.toLocaleString("sv-SE").replace(" ", "T"));
  } else if (value === "WEEK") {
    start = new Date(now);
    start.setDate(start.getDate() - (start.getDay() + 6) % 7);
    start.setHours(0, 0, 0, 0);

    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    setStartDateFilter(start.toLocaleString("sv-SE").replace(" ", "T"));
    setEndDateFilter(end.toLocaleString("sv-SE").replace(" ", "T"));
  } else if (value === "MONTH") {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    setStartDateFilter(start.toLocaleString("sv-SE").replace(" ", "T"));
    setEndDateFilter(end.toLocaleString("sv-SE").replace(" ", "T"));
  } else {
    setStartDateFilter("");
    setEndDateFilter("");
  }
};


  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setEmployeeFilter("ALL");
    setTimeRangeFilter("ALL");
    setStartDateFilter("");
    setEndDateFilter("");
  };

  // Phân trang
  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const paginatedAppointments = appointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Danh sách lịch hẹn</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELED">Đã hủy</option>
          </select>
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="ALL">Tất cả nhân viên</option>
            {employees.map((employee) => (
              <option key={employee.employeeId} value={employee.email}>
                {employee.fullName}
              </option>
            ))}
          </select>
          <select
            value={timeRangeFilter}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="ALL">Tất cả thời gian</option>
            <option value="DAY">Hôm nay</option>
            <option value="WEEK">Tuần này</option>
            <option value="MONTH">Tháng này</option>
          </select>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
            disabled={statusFilter === "ALL" && employeeFilter === "ALL" && timeRangeFilter === "ALL"}
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-6 text-gray-500 dark:text-gray-400">Đang tải...</div>}
      {error && <div className="text-red-500 text-center py-6">{error}</div>}
      {!loading && !error && appointments.length === 0 && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">Không có lịch hẹn nào. Vui lòng kiểm tra bộ lọc hoặc thêm dữ liệu.</div>
      )}
      {!loading && !error && appointments.length > 0 && (
        <div>
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-200 dark:border-gray-700">
                <TableRow>
                  <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-start text-sm dark:text-gray-400">
                    Nhân viên
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-start text-sm dark:text-gray-400">
                    Khách hàng
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-start text-sm dark:text-gray-400">
                    Dịch vụ
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-start text-sm dark:text-gray-400">
                    Ngày đặt lịch
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-start text-sm dark:text-gray-400">
                    Trạng thái
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-start text-sm dark:text-gray-400">
                    Hành động
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedAppointments.map((item) => (
                  <TableRow key={item.appointmentId}>
                    <TableCell className="px-6 py-4 text-gray-600 text-sm dark:text-gray-300">
                      {item.employeeName}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 text-sm dark:text-gray-300">
                      {item.userName}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 text-sm dark:text-gray-300">
                      {item.serviceName}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 text-sm dark:text-gray-300">
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 text-sm dark:text-gray-300">
                      <Badge size="sm" color={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-start">
                      <button
                        type="button"
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        onClick={() => handleViewDetail(item)}
                      >
                        Xem
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-lg ${currentPage === page ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg">
        {selectedAppointment && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Chi tiết lịch hẹn</h2>
            <div className="mb-3 text-gray-700 dark:text-gray-300">
              <b>Nhân viên:</b> {selectedAppointment.employeeName}
            </div>
            <div className="mb-3 text-gray-700 dark:text-gray-300">
              <b>Khách hàng:</b> {selectedAppointment.userName}
            </div>
            <div className="mb-3 text-gray-700 dark:text-gray-300">
              <b>Dịch vụ:</b> {selectedAppointment.serviceName}
            </div>
            <div className="mb-3 text-gray-700 dark:text-gray-300">
              <b>Ngày bắt đầu:</b> {new Date(selectedAppointment.startTime).toLocaleDateString("vi-VN")}
            </div>
            <div className="mb-3 text-gray-700 dark:text-gray-300">
              <b>Thời gian:</b>{" "}
              {new Date(selectedAppointment.startTime).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              -{" "}
              {new Date(selectedAppointment.endTime).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="mb-3 flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <b>Trạng thái:</b>
              <Badge size="sm" color={getStatusColor(selectedAppointment.status)}>
                {selectedAppointment.status}
              </Badge>
            </div>
            {selectedAppointment.status === "Confirmed" && (
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                  onClick={() => handleComplete(selectedAppointment.appointmentId)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Đang xử lý..." : "Hoàn thành"}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}