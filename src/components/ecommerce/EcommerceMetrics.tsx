// src/components/ecommerce/EcommerceMetrics.tsx
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { useState, useEffect } from "react";
import api from "@/service/api"; // Import api instance
import url from "@/service/url"; // Import url constants

export default function EcommerceMetrics() {
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [registeredServicesCount, setRegisteredServicesCount] = useState<number>(0);

  useEffect(() => {
    // Fetch Customer Count
    const fetchCustomerCount = async () => {
      try {
        const response = await api.get(url.CUSTOMER.GET_ALL); // Sử dụng api.get và url.CUSTOMER.GET_ALL
        setCustomerCount(response.data.length); // Đếm số lượng người dùng từ danh sách trả về
      } catch (error) {
        console.error("Error fetching customer count:", error);
        setCustomerCount(0); // Đặt về 0 nếu có lỗi
      }
    };

    // Fetch Registered Services Count (Total Appointments)
    const fetchRegisteredServicesCount = async () => {
      try {
        const response = await api.get(url.APPOINTMENT.GET_ALL); // Sử dụng api.get và url.APPOINTMENT.GET_ALL
        setRegisteredServicesCount(response.data.length); // Đếm số lượng cuộc hẹn từ danh sách trả về
      } catch (error) {
        console.error("Error fetching registered services count:", error);
        setRegisteredServicesCount(0); // Đặt về 0 nếu có lỗi
      }
    };

    fetchCustomerCount();
    fetchRegisteredServicesCount();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Customers Total
              (Registered)
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {customerCount.toLocaleString()}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            11.01%
          </Badge>
        </div>
      </div>
      {/* */}

      {/* */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Registered Services (Total Bookings)
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {registeredServicesCount.toLocaleString()}
            </h4>
          </div>

          <Badge color="error">
            <ArrowDownIcon />
            9.05%
          </Badge>
        </div>
      </div>
      {/* */}
    </div>
  );
}