// AdminAppointments.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
import { toast } from 'react-toastify';

interface Appointment {
  appointmentId: number;
  storeName: string;
  serviceName: string;
  userName: string;
  employeeName: string;
  employeeEmail: string;
  employeeId?: number;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}

interface Employee {
  employeeId: number;
  fullName: string;
  email: string;
  store: {
      storeId: number;
      storeName: string;
  };
}

type BadgeColor = "success" | "primary" | "error" | "warning" | "light" | "danger" | "info" | "dark";


export default function AdminAppointments() {
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // States for filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [employeeFilter, setEmployeeFilter] = useState<string>("ALL");
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [selectedNewEmployeeId, setSelectedNewEmployeeId] = useState<string>("ALL");

  const isInitialLoad = useRef(true); // Dùng để kiểm soát load lần đầu

  const calculateDateRange = useCallback((range: string) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (range === "DAY") {
        return {
            startDate: start.toLocaleString("sv-SE").replace(" ", "T"),
            endDate: end.toLocaleString("sv-SE").replace(" ", "T")
        };
    } else if (range === "WEEK") {
        const firstDayOfWeek = new Date(start);
        firstDayOfWeek.setDate(start.getDate() - (start.getDay() + 6) % 7); // Monday
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23, 59, 59, 999);
        return {
            startDate: firstDayOfWeek.toLocaleString("sv-SE").replace(" ", "T"),
            endDate: lastDayOfWeek.toLocaleString("sv-SE").replace(" ", "T")
        };
    } else if (range === "MONTH") {
        const firstDayOfMonth = new Date(start.getFullYear(), start.getMonth(), 1, 0, 0, 0, 0);
        const lastDayOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
        return {
            startDate: firstDayOfMonth.toLocaleString("sv-SE").replace(" ", "T"),
            endDate: lastDayOfMonth.toLocaleString("sv-SE").replace(" ", "T")
        };
    } else {
      return { startDate: "", endDate: "" };
    }
  }, []);

  // fetchAppointments - KHÔNG LỌC Ở FRONTEND NỮA
  const fetchAppointments = useCallback(async (
    currentStatus: string, // Nhận trực tiếp các giá trị filter
    currentEmployee: string,
    currentTimeRange: string
  ) => {
    console.log("AdminAppointments Debug: === fetchAppointments called ===");
    console.log("AdminAppointments Debug: Params being used in fetch:", { currentStatus, currentEmployee, currentTimeRange });

    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (currentStatus !== "ALL") params.status = currentStatus;
      if (currentEmployee !== "ALL") params.employeeEmail = currentEmployee;

      if (currentTimeRange !== "ALL") {
        const { startDate, endDate } = calculateDateRange(currentTimeRange);
        params.startDate = startDate;
        params.endDate = endDate;
      }
      console.log("AdminAppointments Debug: API request params (sent to backend):", params);

      const response = await axios.get(url.APPOINTMENT.FILTER, { params });
      console.log("AdminAppointments Debug: API raw response received. Data length:", response.data.length);
      console.log("AdminAppointments Debug: First 3 items of API raw response:", response.data.slice(0,3));
      
      // KHÔNG CÓ LOGIC LỌC Ở FRONTEND Ở ĐÂY NỮA
      const processedAppointments: Appointment[] = response.data.map((item: any) => ({
        appointmentId: item.appointmentId,
        storeName: item.storeService?.storeName || "Unknown Store",
        serviceName: item.storeService?.serviceName || "Unknown Service",
        userName: item.user?.fullName || "Unknown User",
        employeeName: item.employee?.fullName || "Unknown Employee",
        employeeEmail: item.employee?.email || "Unknown Email",
        employeeId: item.employee?.employeeId,
        startTime: item.startTime || new Date().toISOString(),
        endTime: item.endTime || new Date().toISOString(),
        status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase() : "Unknown",
        createdAt: item.createdAt || new Date().toISOString(),
      }));

      const sortedAppointments = processedAppointments.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAppointments(sortedAppointments);
      setLoading(false);
      setCurrentPage(1); // Reset page to 1 on new filter/search
    } catch (err: any) {
      console.error("AdminAppointments Error: Failed to fetch appointments:", err.response?.data || err);
      setError(err.response?.data?.message || "Không thể tải danh sách lịch hẹn");
      setLoading(false);
    }
  }, [calculateDateRange]); // fetchAppointments chỉ phụ thuộc vào calculateDateRange

  // Effect 1: Đọc URL params và cập nhật các state bộ lọc.
  useEffect(() => {
    const statusParam = searchParams.get("status");
    const employeeEmailParam = searchParams.get("employeeEmail");
    const timeRangeParam = searchParams.get("timeRange");

    console.log("AdminAppointments Debug: Effect 1 (URL param parser) running.");
    console.log("AdminAppointments Debug: Raw URL Params:", { statusParam, employeeEmailParam, timeRangeParam });

    // Cập nhật state nếu giá trị từ URL khác với giá trị hiện tại của state
    // và đảm bảo so sánh không phân biệt hoa thường cho trạng thái.
    const newStatusVal = statusParam ? statusParam.toUpperCase() : "ALL";
    if (newStatusVal !== statusFilter.toUpperCase()) {
      console.log(`AdminAppointments Debug: Updating statusFilter from '${statusFilter}' to '${newStatusVal}'`);
      setStatusFilter(newStatusVal);
    }

    const newEmployeeVal = employeeEmailParam || "ALL";
    if (newEmployeeVal !== employeeFilter) {
      console.log(`AdminAppointments Debug: Updating employeeFilter from '${employeeFilter}' to '${newEmployeeVal}'`);
      setEmployeeFilter(newEmployeeVal);
    }

    const newTimeRangeVal = timeRangeParam || "ALL";
    if (newTimeRangeVal !== timeRangeFilter) {
      console.log(`AdminAppointments Debug: Updating timeRangeFilter from '${timeRangeFilter}' to '${newTimeRangeVal}'`);
      setTimeRangeFilter(newTimeRangeVal);
    }

  }, [searchParams]); // CHỈ phụ thuộc vào searchParams

  // Effect 2: Kích hoạt fetchAppointments khi các state bộ lọc thay đổi HOẶC lần đầu component mount.
  useEffect(() => {
    // Để tránh việc fetch khi component mount lần 2 trong StrictMode
    // và đảm bảo fetch chỉ xảy ra khi các filter states đã được khởi tạo/cập nhật.
    if (isInitialLoad.current) {
        // Log để kiểm tra nếu đây là lần load đầu tiên
        console.log("AdminAppointments Debug: Initial load, checking filter states...");
        // Kiểm tra xem các filter đã được khởi tạo từ URL hay giá trị mặc định chưa
        // Nếu tất cả đều là "ALL" và không có params, thì coi như đã sẵn sàng fetch mặc định.
        // Hoặc nếu có bất kỳ param nào được set khác "ALL", thì cũng sẵn sàng.
        const hasParams = searchParams.get("status") || searchParams.get("employeeEmail") || searchParams.get("timeRange");
        
        if (
            (statusFilter !== "ALL" || employeeFilter !== "ALL" || timeRangeFilter !== "ALL") || // Có params từ URL
            (!hasParams && statusFilter === "ALL" && employeeFilter === "ALL" && timeRangeFilter === "ALL") // Hoặc không có params và tất cả đều là ALL (default)
        ) {
            console.log("AdminAppointments Debug: Filters are initialized for initial fetch.");
            isInitialLoad.current = false; // Đánh dấu đã qua lần tải đầu tiên
            fetchAppointments(statusFilter, employeeFilter, timeRangeFilter);
        } else {
            console.log("AdminAppointments Debug: Filters not yet initialized for initial fetch, waiting...");
        }
    } else {
        // Sau lần tải đầu tiên, fetch mỗi khi bất kỳ state bộ lọc nào thay đổi
        console.log("AdminAppointments Debug: Filter state changed, triggering fetchAppointments.");
        fetchAppointments(statusFilter, employeeFilter, timeRangeFilter);
    }
  }, [statusFilter, employeeFilter, timeRangeFilter, fetchAppointments, searchParams]); // searchParams để đảm bảo effect này chạy nếu URL thay đổi nhưng filters không đổi (ví dụ: same status, but different employee in URL)


  // Fetch employees once on component mount
  useEffect(() => {
    const fetchEmployeesData = async () => {
      try {
        const response = await axios.get(url.EMPLOYEE.GET_ALL);
        setEmployees(response.data);
      } catch (err: any) {
        setError("Không thể tải danh sách nhân viên");
      }
    };
    fetchEmployeesData();
  }, []);


  // Lọc danh sách nhân viên theo cửa hàng khi mở modal chuyển lịch
  useEffect(() => {
      if (isReassignModalOpen && selectedAppointment && employees.length > 0) {
          const currentEmployee = employees.find(
              emp => emp.employeeId === selectedAppointment.employeeId
          );

          if (currentEmployee && currentEmployee.store?.storeId) {
              const currentStoreId = currentEmployee.store.storeId;
              const employeesInSameStore = employees.filter(
                  (emp) => emp.store?.storeId === currentStoreId && emp.employeeId !== selectedAppointment.employeeId
              );
              setFilteredEmployees(employeesInSameStore);
          } else {
              setFilteredEmployees(employees.filter(
                (emp) => emp.employeeId !== selectedAppointment.employeeId
              ));
          }
      } else {
          setFilteredEmployees([]);
      }
  }, [isReassignModalOpen, selectedAppointment, employees]);

  const handleViewDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const openReassignModal = () => {
      setIsModalOpen(false);
      setIsReassignModalOpen(true);
      setSelectedNewEmployeeId("ALL");
  };

  const closeReassignModal = () => {
      setIsReassignModalOpen(false);
      setSelectedAppointment(null);
      setSelectedNewEmployeeId("ALL");
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

  const handleComplete = async (appointmentId: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await axios.patch(url.APPOINTMENT.COMPLETE.replace("${id}", appointmentId.toString()));
      toast.success("Lịch hẹn đã được hoàn thành!");
      fetchAppointments(statusFilter, employeeFilter, timeRangeFilter); // Truyền lại các filter hiện tại
      setSelectedAppointment((prev) =>
        prev && prev.appointmentId === appointmentId ? { ...prev, status: "Completed" } : prev
      );
    } catch (error: any) {
      console.error("Lỗi khi hoàn thành lịch hẹn:", error.response?.data || error.message);
      toast.error(`Hoàn thành thất bại: ${error.response?.data?.message || "Lỗi hệ thống"}`);
    } finally {
      setIsProcessing(false);
      closeModal();
    }
  };

  const handleReassign = async () => {
      if (!selectedAppointment || selectedNewEmployeeId === "ALL") {
          toast.warn("Vui lòng chọn nhân viên mới để chuyển lịch.");
          return;
      }
      if (isProcessing) return;
      setIsProcessing(true);
      try {
          await axios.patch(
              url.APPOINTMENT.REASSIGN.replace("${id}", selectedAppointment.appointmentId.toString()),
              null,
              { params: { newEmployeeId: parseInt(selectedNewEmployeeId) } }
          );
          toast.success("Lịch hẹn đã được chuyển thành công!");
          fetchAppointments(statusFilter, employeeFilter, timeRangeFilter); // Truyền lại các filter hiện tại
          closeReassignModal();
      }
      catch (error: any) {
          console.error("Lỗi khi chuyển lịch:", error.response?.data || error.message);
          toast.error(`Chuyển lịch thất bại: ${error.response?.data?.message || "Lỗi không xác định"}`);
      } finally {
          setIsProcessing(false);
      }
  };


  const handleTimeRangeChange = (value: string) => {
    setTimeRangeFilter(value);
  };

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setEmployeeFilter("ALL");
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
            <option value="REJECTED">Đã từ chối</option> {/* Thêm tùy chọn Rejected */}
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
            {selectedAppointment.status === "Pending" && (
              <div className="flex justify-end gap-2 mt-4">
                {/* Admin không có nút Xác nhận/Từ chối cho Pending (vì là admin) */}
                {/* Nút "Chuyển lịch" cho ADMIN (khi trạng thái là Rejected) */}
              </div>
            )}
            {selectedAppointment.status === "Confirmed" && (
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300 transition"
                  onClick={() => handleComplete(selectedAppointment.appointmentId)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Đang xử lý..." : "Hoàn thành"}
                </button>
              </div>
            )}
            {selectedAppointment.status === "Rejected" && ( // Nút "Chuyển lịch" cho ADMIN chỉ hiển thị khi trạng thái là Rejected
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                  onClick={openReassignModal}
                >
                  Chuyển lịch
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Chuyển lịch cho Admin (đã được làm đẹp hơn) */}
      <Modal isOpen={isReassignModalOpen} onClose={closeReassignModal} className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {selectedAppointment && (
              <div className="flex flex-col gap-5">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Chuyển lịch hẹn</h2>
                      <button
                          onClick={closeReassignModal}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                          <span className="sr-only">Close</span>
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                      </button>
                  </div>

                  <div className="text-gray-700 dark:text-gray-300 space-y-2">
                      <p>
                          Lịch hẹn của khách hàng <b className="font-semibold">{selectedAppointment.userName}</b> với dịch vụ <b className="font-semibold">{selectedAppointment.serviceName}</b>
                      </p>
                      <p>
                          vào lúc <b className="font-semibold">{new Date(selectedAppointment.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</b> ngày <b className="font-semibold">{new Date(selectedAppointment.startTime).toLocaleDateString("vi-VN")}</b> (hiện tại do <b className="font-semibold">{selectedAppointment.employeeName}</b> từ chối).
                      </p>
                  </div>

                  <div className="mt-4">
                      <label htmlFor="newEmployeeSelect" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                          Chọn nhân viên mới trong cùng cửa hàng:
                      </label>
                      <div className="relative">
                          <select
                              id="newEmployeeSelect"
                              value={selectedNewEmployeeId}
                              onChange={(e) => setSelectedNewEmployeeId(e.target.value)}
                              className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-base dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 appearance-none pr-8"
                          >
                              <option value="ALL">-- Chọn nhân viên --</option>
                              {filteredEmployees.map(emp => (
                                  <option key={emp.employeeId} value={emp.employeeId}>
                                      {emp.fullName} ({emp.email})
                                  </option>
                              ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
                      <button
                          type="button"
                          className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                          onClick={closeReassignModal}
                      >
                          Hủy
                      </button>
                      <button
                          type="button"
                          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={handleReassign}
                          disabled={isProcessing || selectedNewEmployeeId === "ALL"}
                      >
                          {isProcessing ? "Đang chuyển..." : "Chuyển lịch"}
                      </button>
                  </div>
              </div>
          )}
      </Modal>
    </div>
  );
}