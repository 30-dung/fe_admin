import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import { Modal } from "../../ui/modal";
import axios from "../../../service/api";
import url from "../../../service/url";
import { useAuth } from "@/context/AuthContext";
import { toast } from 'react-toastify'; // Import toast

interface Appointment {
  appointmentId: number;
  storeName: string;
  serviceName: string;
  userName: string;
  employeeName: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  employeeId?: number;
}

type BadgeColor = "success" | "primary" | "error" | "warning" | "light" | "danger" | "info" | "dark";

export default function BasicTableOne() {
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { auth, isLoadingAuth } = useAuth();

  // NEW STATES FOR CONFIRMATION MODALS
  const [isCancelConfirmModalOpen, setIsCancelConfirmModalOpen] = useState(false);
  const [isRejectConfirmModalOpen, setIsRejectConfirmModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(""); // State để lưu lý do từ chối

  const getEmployeeEmail = useCallback(async () => {
    if (auth.email) {
      return auth.email;
    }
    const response = await axios.get(url.EMPLOYEE.PROFILE);
    return response.data.email;
  }, [auth.email]);

  const calculateDateRange = useCallback((range: string) => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (range === "DAY") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (range === "WEEK") {
      start = new Date(now);
      start.setDate(now.getDate() - (now.getDay() + 6) % 7);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (range === "MONTH") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      return { startDate: "", endDate: "" };
    }
    return {
      startDate: start.toLocaleString("sv-SE").replace(" ", "T"),
      endDate: end.toLocaleString("sv-SE").replace(" ", "T")
    };
  }, []);

  const fetchAppointments = useCallback(async (
    currentStatusFilter: string,
    currentTimeRangeFilter: string,
    employeeEmail: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      // ONLY CHANGE START
      if (currentStatusFilter !== "ALL") {
        params.status = currentStatusFilter;
      }
      // ONLY CHANGE END

      if (currentTimeRangeFilter !== "ALL") {
        const { startDate, endDate } = calculateDateRange(currentTimeRangeFilter);
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const response = await axios.get(url.APPOINTMENT.GET_BY_EMPLOYEE.replace("{email}", employeeEmail), { params });
      console.log("API response for Employee with filters:", response.data);

      const processedAppointments: Appointment[] = response.data.map((item: any) => ({
        appointmentId: item.appointmentId,
        storeName: item.storeService?.storeName || "Unknown Store",
        serviceName: item.storeService?.serviceName || "Unknown Service",
        employeeName: item.employee?.fullName || "Unknown Employee",
        employeeId: item.employee?.employeeId,
        startTime: item.startTime,
        endTime: item.endTime,
        status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase() : "Unknown",
        userName: item.user?.fullName || "Unknown User",
        createdAt: item.createdAt || new Date().toISOString(),
      }));

      const sortedAppointments = processedAppointments.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setAppointments(sortedAppointments);
      setLoading(false);
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Error fetching appointments:", err.response?.data || err);
      setError(err.response?.data?.message || "Không thể tải lịch sử đặt lịch");
      setLoading(false);
    }
  }, [calculateDateRange]); // Removed getEmployeeEmail from dependencies as it's not directly used in the try block

  useEffect(() => {
    const statusParam = searchParams.get("status");
    const timeRangeParam = searchParams.get("timeRange");
    const newStatusFilter = statusParam || "ALL";
    const newTimeRangeFilter = timeRangeParam || "ALL";

    setStatusFilter(newStatusFilter);
    setTimeRangeFilter(newTimeRangeFilter);

    if (isLoadingAuth) {
        setLoading(true);
        return;
    }

    if (auth.email) {
      fetchAppointments(newStatusFilter, newTimeRangeFilter, auth.email);
    } else {
        console.warn("Auth email not available. User may not be logged in or AuthContext is still loading.");
        if (!auth.isAuthenticated) {
            setError("Bạn cần đăng nhập để xem lịch hẹn.");
            setLoading(false);
        } else {
            setError("Không tìm thấy email nhân viên để tải lịch hẹn.");
            setLoading(false);
        }
    }
  }, [searchParams, fetchAppointments, auth.email, isLoadingAuth, auth.isAuthenticated]);

  useEffect(() => {
    if (!isLoadingAuth && auth.email) {
      fetchAppointments(statusFilter, timeRangeFilter, auth.email);
    }
  }, [statusFilter, timeRangeFilter, fetchAppointments, auth.email, isLoadingAuth]);

  // Open detail modal
  const handleViewDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  // Close detail modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
    // Reset all confirmation modals and states when main modal closes
    setIsCancelConfirmModalOpen(false);
    setIsRejectConfirmModalOpen(false);
    setRejectReason("");
    setIsProcessing(false);
  };

  const getStatusColor = (status: string): BadgeColor => {
    switch (status) {
      case "Pending":
        return "warning";
      case "Confirmed":
        return "primary";
      case "Completed":
        return "success";
      case "Canceled":
        return "light";
      case "Rejected":
        return "danger";
      default:
        return "error";
    }
  };

  const handleConfirm = async (appointmentId: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await axios.patch(url.APPOINTMENT.CONFIRM.replace("${id}", appointmentId.toString()));
      if (auth.email) {
        fetchAppointments(statusFilter, timeRangeFilter, auth.email);
      }
      toast.success("Xác nhận lịch hẹn thành công!"); // Toast notification
      setSelectedAppointment((prev) =>
        prev && prev.appointmentId === appointmentId ? { ...prev, status: "Confirmed" } : prev
      );
    } catch (error: any) {
      console.error("Lỗi khi xác nhận lịch hẹn:", error.response?.data || error.message);
      toast.error(`Xác nhận thất bại: ${error.response?.data?.message || "Lỗi không xác định"}`); // Toast error
    } finally {
      setIsProcessing(false);
      closeModal();
    }
  };

  // NEW: Open Reject Confirmation Modal
  const openRejectConfirmModal = () => {
    setIsModalOpen(false); // Close main detail modal
    setIsRejectConfirmModalOpen(true);
    setRejectReason(""); // Clear previous reason
  };

  // NEW: Handle Reject (from confirmation modal)
  const handleReject = async () => {
    if (isProcessing || !selectedAppointment) return;
    setIsProcessing(true);
    try {
      await axios.patch(`${url.APPOINTMENT.REJECT.replace("${id}", selectedAppointment.appointmentId.toString())}?reason=${encodeURIComponent(rejectReason || "")}`);
      if (auth.email) {
        fetchAppointments(statusFilter, timeRangeFilter, auth.email);
      }
      toast.success("Từ chối lịch hẹn thành công và khách hàng đã được thông báo."); // Toast notification
      setSelectedAppointment(null);
    } catch (error: any) {
      console.error("Lỗi khi từ chối lịch hẹn:", error.response?.data || error.message);
      toast.error(`Từ chối thất bại: ${error.response?.data?.message || "Lỗi không xác định"}`); // Toast error
    } finally {
      setIsProcessing(false);
      closeModal(); // This will also close isRejectConfirmModalOpen
    }
  };

  // NEW: Open Cancel Confirmation Modal
  const openCancelConfirmModal = () => {
    setIsModalOpen(false); // Close main detail modal
    setIsCancelConfirmModalOpen(true);
  };

  // NEW: Handle Cancel (from confirmation modal)
  const handleCancel = async () => {
    if (isProcessing || !selectedAppointment) return;
    setIsProcessing(true);
    try {
      await axios.patch(url.APPOINTMENT.CANCEL.replace("${id}", selectedAppointment.appointmentId.toString()));
      
      if (auth.email) {
        fetchAppointments(statusFilter, timeRangeFilter, auth.email);
      }
      toast.success("Hủy lịch hẹn thành công và khách hàng đã được thông báo."); // Toast notification
      setSelectedAppointment((prev) =>
        prev && prev.appointmentId === selectedAppointment.appointmentId ? { ...prev, status: "Canceled" } : prev
      );
    } catch (error: any) {
      console.error("Lỗi khi hủy lịch hẹn:", error.response?.data || error.message);
      toast.error(`Hủy thất bại: ${error.response?.data?.message || "Lỗi không xác định"}`); // Toast error
    } finally {
      setIsProcessing(false);
      closeModal(); // This will also close isCancelConfirmModalOpen
    }
  };

  const handleComplete = async (appointmentId: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await axios.patch(url.APPOINTMENT.COMPLETE.replace("${id}", appointmentId.toString()));
      if (auth.email) {
        fetchAppointments(statusFilter, timeRangeFilter, auth.email);
      }
      toast.success("Hoàn thành lịch hẹn thành công!"); // Toast notification
      setSelectedAppointment((prev) =>
        prev && prev.appointmentId === appointmentId ? { ...prev, status: "Completed" } : prev
      );
    } catch (error: any) {
      console.error("Lỗi khi hoàn thành lịch hẹn:", error.response?.data || error.message);
      toast.error(`Hoàn thành thất bại: ${error.response?.data || "Lỗi không xác định"}`); // Toast error
    } finally {
      setIsProcessing(false);
      closeModal();
    }
  };

  const handleTimeRangeChange = (value: string) => {
    setTimeRangeFilter(value);
  };

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setTimeRangeFilter("ALL");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const paginatedAppointments = appointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-white/[0.05]">
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
            <option value="CANCELED">Đã hủy</option> {/* Added CANCELED option */}
            <option value="REJECTED">Đã từ chối</option>
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
            disabled={statusFilter === "ALL" && timeRangeFilter === "ALL"}
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
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
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
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {paginatedAppointments.map((item) => (
                  <TableRow key={item.appointmentId}>
                    <TableCell className="px-6 py-4 text-gray-600 text-start text-sm dark:text-gray-300">
                      {item.employeeName}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 text-start text-sm dark:text-gray-300">
                      {item.userName}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 text-start text-sm dark:text-gray-300">
                      {item.serviceName}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 text-sm dark:text-gray-300">
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 text-start text-sm dark:text-gray-300">
                      <Badge size="sm" color={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-start">
                      <button
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
      {/* Main Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        {selectedAppointment && (
          <div>
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">Chi tiết lịch hẹn</h2>
            <div className="mb-3 text-gray-700 dark:text-gray-300"><b>Nhân viên:</b> {selectedAppointment.employeeName}</div>
            <div className="mb-3 text-gray-700 dark:text-gray-300"><b>Khách hàng:</b> {selectedAppointment.userName}</div>
            <div className="mb-3 text-gray-700 dark:text-gray-300"><b>Dịch vụ:</b> {selectedAppointment.serviceName}</div>
            <div className="mb-3 text-gray-700 dark:text-gray-300">
              <b>Ngày bắt đầu:</b> {new Date(selectedAppointment.startTime).toLocaleDateString("vi-VN")}
            </div>
            <div className="mb-3 text-gray-700 dark:text-gray-300">
              <b>Thời gian:</b>{" "}
              {new Date(selectedAppointment.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} -{" "}
              {new Date(selectedAppointment.endTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="mb-3 flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <b>Trạng thái:</b>
              <Badge size="sm" color={getStatusColor(selectedAppointment.status)}>
                {selectedAppointment.status}
              </Badge>
            </div>
            {selectedAppointment.status === "Pending" && (
              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition"
                  onClick={() => handleConfirm(selectedAppointment.appointmentId)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Đang xử lý..." : "Xác nhận"}
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-300 transition"
                  onClick={openRejectConfirmModal} // Mở modal xác nhận từ chối
                  disabled={isProcessing}
                >
                  {isProcessing ? "Đang xử lý..." : "Từ chối"}
                </button>
              </div>
            )}
            {selectedAppointment.status === "Confirmed" && (
              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300 transition"
                  onClick={() => handleComplete(selectedAppointment.appointmentId)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Đang xử lý..." : "Hoàn thành"}
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-300 transition"
                  onClick={openCancelConfirmModal} // Mở modal xác nhận hủy
                  disabled={isProcessing}
                >
                  {isProcessing ? "Đang xử lý..." : "Hủy"}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Xác nhận Hủy lịch */}
      <Modal isOpen={isCancelConfirmModalOpen} onClose={closeModal} className="max-w-sm p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          {selectedAppointment && (
              <div>
                  <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">Xác nhận hủy lịch hẹn</h2>
                  <p className="mb-4 text-gray-700 dark:text-gray-300">
                      Bạn có chắc chắn muốn hủy lịch hẹn dịch vụ <b>{selectedAppointment.serviceName}</b> của khách hàng <b>{selectedAppointment.userName}</b> vào lúc <b>{new Date(selectedAppointment.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</b> ngày <b>{new Date(selectedAppointment.startTime).toLocaleDateString("vi-VN")}</b> không?
                  </p>
                  <div className="flex justify-end gap-2 mt-4">
                      <button
                          type="button"
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                          onClick={closeModal} // Đóng modal hiện tại (modal xác nhận hủy)
                      >
                          Không
                      </button>
                      <button
                          type="button"
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                          onClick={() => handleCancel()} // Gọi hàm handleCancel đã được sửa đổi
                          disabled={isProcessing}
                      >
                          {isProcessing ? "Đang hủy..." : "Có, hủy lịch"}
                      </button>
                  </div>
              </div>
          )}
      </Modal>

      {/* Modal Xác nhận Từ chối lịch (với lý do) */}
      <Modal isOpen={isRejectConfirmModalOpen} onClose={closeModal} className="max-w-sm p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          {selectedAppointment && (
              <div>
                  <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">Từ chối lịch hẹn</h2>
                  <p className="mb-4 text-gray-700 dark:text-gray-300">
                      Bạn có chắc chắn muốn từ chối lịch hẹn dịch vụ <b>{selectedAppointment.serviceName}</b> của khách hàng <b>{selectedAppointment.userName}</b> vào lúc <b>{new Date(selectedAppointment.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</b> ngày <b>{new Date(selectedAppointment.startTime).toLocaleDateString("vi-VN")}</b> không?
                  </p>
                  <div className="mb-4">
                      <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Lý do từ chối (tùy chọn):
                      </label>
                      <textarea
                          id="rejectReason"
                          rows={3}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                          placeholder="Ví dụ: Bận việc đột xuất, lịch đầy..."
                      ></textarea>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                      <button
                          type="button"
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                          onClick={closeModal} // Đóng modal hiện tại (modal xác nhận từ chối)
                      >
                          Không
                      </button>
                      <button
                          type="button"
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                          onClick={handleReject} // Gọi hàm handleReject đã được sửa đổi
                          disabled={isProcessing}
                      >
                          {isProcessing ? "Đang từ chối..." : "Có, từ chối lịch"}
                      </button>
                  </div>
              </div>
          )}
      </Modal>
    </div>
  );
}