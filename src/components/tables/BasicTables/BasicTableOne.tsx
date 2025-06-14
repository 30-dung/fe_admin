import { useEffect, useState } from "react";
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

interface Appointment {
  appointmentId: number;
  storeName: string;
  serviceName: string[];
  userName: string;
  employeeName: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}

export default function BasicTableOne() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [startDateFilter, setStartDateFilter] = useState<string>("");

  const getEmployeeEmail = async () => {
    try {
      const response = await axios.get(url.EMPLOYEE.PROFILE);
      return response.data.email;
    } catch (err) {
      throw new Error("Không thể lấy thông tin người dùng");
    }
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const email = await getEmployeeEmail();
        const response = await axios.get(url.APPOINTMENT.GET_BY_EMPLOYEE.replace("{email}", email));
        console.log("API response:", response.data);

        const appointmentMap = new Map<number, Appointment>();
        response.data.forEach((item: any) => {
          const appointmentId = item.appointmentId;
          if (appointmentMap.has(appointmentId)) {
            const existing = appointmentMap.get(appointmentId)!;
            existing.serviceName.push(item.storeService?.serviceName || "Unknown Service");
          } else {
            appointmentMap.set(appointmentId, {
              appointmentId: item.appointmentId,
              storeName: item.storeService?.storeName || "Unknown Store",
              serviceName: [item.storeService?.serviceName || "Unknown Service"],
              employeeName: item.employee?.fullName || "Unknown Employee",
              startTime: item.startTime,
              endTime: item.endTime,
              status: item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase(),
              userName: item.user?.fullName || "Unknown User",
              createdAt: item.createdAt || new Date().toISOString(),
            });
          }
        });

        const sortedAppointments = Array.from(appointmentMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        console.log("Sorted Appointments:", sortedAppointments);
        setAppointments(sortedAppointments);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || "Không thể tải lịch sử đặt lịch");
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleViewDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    console.log("Status thực tế:", appointment.status);
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

  const handleConfirm = async (appointmentId: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await axios.patch(url.APPOINTMENT.CONFIRM.replace("${id}", appointmentId.toString()));
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointmentId === appointmentId ? { ...a, status: "Confirmed" } : a
        )
      );
      setSelectedAppointment((prev) =>
        prev && prev.appointmentId === appointmentId ? { ...prev, status: "Confirmed" } : prev
      );
    } catch (error: any) {
      console.error("Lỗi khi xác nhận lịch hẹn:", error.response?.data || error.message);
      alert(`Xác nhận thất bại: ${error.response?.data || "Lỗi không xác định"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async (appointmentId: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await axios.patch(url.APPOINTMENT.CANCEL.replace("${id}", appointmentId.toString()));
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointmentId === appointmentId ? { ...a, status: "Canceled" } : a
        )
      );
      setSelectedAppointment((prev) =>
        prev && prev.appointmentId === appointmentId ? { ...prev, status: "Canceled" } : prev
      );
    } catch (error: any) {
      console.error("Lỗi khi hủy lịch hẹn:", error.response?.data || error.message);
      alert(`Hủy thất bại: ${error.response?.data || "Lỗi không xác định"}`);
    } finally {
      setIsProcessing(false);
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
      console.error("Lỗi khi hoàn thành lịch hẹn:", error.response?.data || error.message);
      alert(`Hoàn thành thất bại: ${error.response?.data || "Lỗi không xác định"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearFilters = () => {
    setStatusFilter("All");
    setStartDateFilter("");
  };

  // Filter appointments by status and start date
  const filteredAppointments = appointments.filter((item) => {
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesDate =
      startDateFilter === "" ||
      new Date(item.startTime).toLocaleDateString("en-CA") === startDateFilter;
    return matchesStatus && matchesDate;
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] shadow-sm">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-white/[0.05]">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Danh sách lịch hẹn</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="Pending">Chờ xác nhận</option>
            <option value="Confirmed">Đã xác nhận</option>
            <option value="Completed">Hoàn thành</option>
            <option value="Canceled">Đã hủy</option>
          </select>
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
            disabled={statusFilter === "All" && startDateFilter === ""}
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-6 text-gray-500 dark:text-gray-400">Đang tải...</div>}
      {error && <div className="text-red-500 text-center py-6">{error}</div>}
      {!loading && !error && filteredAppointments.length === 0 && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">Không có lịch hẹn nào</div>
      )}
      {!loading && !error && filteredAppointments.length > 0 && (
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
              {filteredAppointments.map((item) => (
                <TableRow key={item.appointmentId}>
                  <TableCell className="px-6 py-4 text-gray-600 text-start text-sm dark:text-gray-300">
                    {item.employeeName}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600 text-start text-sm dark:text-gray-300">
                    {item.userName}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600 text-start text-sm dark:text-gray-300">
                    {item.serviceName.join(", ")}
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
      )}
      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        {selectedAppointment && (
          <div>
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">Chi tiết lịch hẹn</h2>
            <div className="mb-3 text-gray-700 dark:text-gray-300"><b>Nhân viên:</b> {selectedAppointment.employeeName}</div>
            <div className="mb-3 text-gray-700 dark:text-gray-300"><b>Khách hàng:</b> {selectedAppointment.userName}</div>
            <div className="mb-3 text-gray-700 dark:text-gray-300"><b>Dịch vụ:</b> {selectedAppointment.serviceName.join(", ")}</div>
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
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 transition"
                  onClick={() => handleCancel(selectedAppointment.appointmentId)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Đang xử lý..." : "Hủy"}
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
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}