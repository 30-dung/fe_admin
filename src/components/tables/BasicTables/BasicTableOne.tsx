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
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedDate, setSelectedDate] = useState<string>("");

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

        setAppointments(sortedAppointments);
        setFilteredAppointments(sortedAppointments);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || "Không thể tải lịch sử đặt lịch");
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  useEffect(() => {
    let filtered = appointments;

    if (selectedStatus !== "All") {
      filtered = filtered.filter((item) => item.status === selectedStatus);
    }

    if (selectedDate) {
      filtered = filtered.filter((item) => {
        const startDate = new Date(item.startTime).toLocaleDateString("sv-SE");
        return startDate === selectedDate;
      });
    }

    setFilteredAppointments(filtered);
  }, [selectedStatus, selectedDate, appointments]);

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

  // Hàm reset bộ lọc
  const resetFilters = () => {
    setSelectedStatus("All");
    setSelectedDate("");
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Giao diện bộ lọc cải tiến */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-white/[0.05]">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          {/* <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Bộ lọc lịch hẹn
          </h3> */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="status-filter"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Trạng thái
              </label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              >
                <option value="All">Tất cả</option>
                <option value="Pending">Đang chờ</option>
                <option value="Confirmed">Đã xác nhận</option>
                <option value="Completed">Hoàn thành</option>
                <option value="Canceled">Đã hủy</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="date-filter"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Ngày bắt đầu
              </label>
              <input
                id="date-filter"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
            </div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition duration-200 self-end"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-4">Đang tải...</div>}
      {error && <div className="text-red-500 text-center py-4">{error}</div>}
      {!loading && !error && (
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Nhân viên
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Khách hàng
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Dịch vụ
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Ngày đặt lịch
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Trạng thái
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredAppointments.map((item) => (
                <TableRow key={item.appointmentId}>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {item.employeeName}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {item.userName}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {item.serviceName.join(", ")}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    <Badge size="sm" color={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start">
                    <button
                      className="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
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
      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-md p-6">
        {selectedAppointment && (
          <div>
            <h2 className="text-lg font-bold mb-4">Chi tiết lịch hẹn</h2>
            <div className="mb-2">
              <b>Nhân viên:</b> {selectedAppointment.employeeName}
            </div>
            <div className="mb-2">
              <b>Khách hàng:</b> {selectedAppointment.userName}
            </div>
            <div className="mb-2">
              <b>Dịch vụ:</b> {selectedAppointment.serviceName.join(", ")}
            </div>
            <div className="mb-2">
              <b>Ngày bắt đầu:</b>{" "}
              {new Date(selectedAppointment.startTime).toLocaleDateString("vi-VN")}
            </div>
            <div className="mb-2">
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
            <div className="mb-2 flex items-center gap-2">
              <b>Trạng thái:</b>
              <Badge size="sm" color={getStatusColor(selectedAppointment.status)}>
                {selectedAppointment.status}
              </Badge>
            </div>
            {selectedAppointment.status === "Pending" && (
              <div className="flex justify-end gap-2 mt-8">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={async () => {
                    try {
                      await axios.patch(
                        url.APPOINTMENT.CONFIRM.replace(
                          "${id}",
                          selectedAppointment.appointmentId.toString()
                        )
                      );
                      setAppointments((prev) =>
                        prev.map((a) =>
                          a.appointmentId === selectedAppointment.appointmentId
                            ? { ...a, status: "Confirmed" }
                            : a
                        )
                      );
                      setSelectedAppointment({
                        ...selectedAppointment,
                        status: "Confirmed",
                      });
                    } catch (error) {
                      alert("Xác nhận thất bại!");
                    }
                  }}
                >
                  Xác nhận
                </button>
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  onClick={async () => {
                    try {
                      await axios.patch(
                        url.APPOINTMENT.CANCEL.replace(
                          "${id}",
                          selectedAppointment.appointmentId.toString()
                        )
                      );
                      setAppointments((prev) =>
                        prev.map((a) =>
                          a.appointmentId === selectedAppointment.appointmentId
                            ? { ...a, status: "Canceled" }
                            : a
                        )
                      );
                      setSelectedAppointment({
                        ...selectedAppointment,
                        status: "Canceled",
                      });
                    } catch (error) {
                      alert("Hủy thất bại!");
                    }
                  }}
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}