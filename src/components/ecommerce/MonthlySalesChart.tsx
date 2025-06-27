// src/components/ecommerce/MonthlySalesChart.tsx
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { useState, useEffect } from "react";
import api from "@/service/api"; // Import api instance
import url from "@/service/url"; // Import url constants
import { useAuth } from "@/context/AuthContext"; // Import useAuth

export default function MonthlySalesChart() {
  const [monthlyServiceRegistrations, setMonthlyServiceRegistrations] = useState<number[]>(
    Array(12).fill(0) // Khởi tạo mảng 12 phần tử với giá trị 0 cho 12 tháng
  );
  const { auth, isLoadingAuth } = useAuth(); // Lấy thông tin xác thực

  useEffect(() => {
    const fetchMonthlyRegistrations = async () => {
      // Đảm bảo auth đã tải xong và người dùng đã xác thực
      if (isLoadingAuth || !auth.isAuthenticated) {
        console.log("MonthlySalesChart Debug: Auth loading or not authenticated, skipping count fetch.");
        setMonthlyServiceRegistrations(Array(12).fill(0)); // Reset nếu chưa sẵn sàng
        return;
      }

      try {
        let appointments = [];
        const currentYear = new Date().getFullYear();

        if (auth.role && auth.role.includes("ROLE_ADMIN")) {
          // Admin xem tất cả các cuộc hẹn
          const response = await api.get(url.APPOINTMENT.GET_ALL);
          appointments = response.data;
          console.log("MonthlySalesChart Debug: Admin fetched all appointments.");
        } else if (auth.role && auth.role.includes("ROLE_EMPLOYEE") && auth.email) {
          // Employee chỉ xem cuộc hẹn của mình
          // Lấy các cuộc hẹn của nhân viên cho năm hiện tại
          const params = {
            // Không cần truyền status nếu muốn lấy tất cả các trạng thái để thống kê
            // startDate và endDate cho cả năm để đảm bảo lấy đủ dữ liệu thống kê tháng
            startDate: `${currentYear}-01-01T00:00:00`,
            endDate: `${currentYear}-12-31T23:59:59`
          };
          // Sử dụng endpoint GET_BY_EMPLOYEE và truyền email của nhân viên
          const response = await api.get(`${url.APPOINTMENT.GET_BY_EMPLOYEE.replace("{email}", auth.email)}`, { params });
          appointments = response.data;
          console.log(`MonthlySalesChart Debug: Employee ${auth.email} fetched their appointments.`);
        } else {
          console.warn("MonthlySalesChart Debug: Role not recognized or email missing for fetching monthly registrations.");
          setMonthlyServiceRegistrations(Array(12).fill(0));
          return;
        }


        // Xử lý dữ liệu để tính toán số lượng cuộc hẹn theo tháng
        const monthlyCounts = Array(12).fill(0); // Mảng cho 12 tháng

        appointments.forEach((appointment: any) => {
          const appointmentDate = new Date(appointment.startTime);
          if (appointmentDate.getFullYear() === currentYear) {
            const month = appointmentDate.getMonth(); // 0-11
            monthlyCounts[month]++;
          }
        });
        setMonthlyServiceRegistrations(monthlyCounts);
      } catch (error) {
        console.error("Error fetching monthly service registrations:", error);
        setMonthlyServiceRegistrations(Array(12).fill(0)); // Đặt về 0 nếu có lỗi
      }
    };

    fetchMonthlyRegistrations();
  }, [auth.role, auth.email, auth.isAuthenticated, isLoadingAuth]); // Thêm dependencies

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val} services`,
      },
    },
  };

  const series = [
    {
      name: "Service Registrations",
      data: monthlyServiceRegistrations,
    },
  ];

  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Dịch vụ đăng ký hàng tháng
        </h3>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Xem thêm
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Xóa
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}