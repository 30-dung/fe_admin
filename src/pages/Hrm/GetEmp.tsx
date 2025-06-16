import React, { useEffect, useState } from "react";
import axios from "service/api";
import url from "service/url";

// Enum cho giới tính
enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER",
}

// Enum cho loại lương
enum SalaryType {
    FIXED = "FIXED",
    COMMISSION = "COMMISSION",
    MIXED = "MIXED",
}

// Kiểu dữ liệu nhân viên
interface Employee {
    employeeId: number;
    employeeCode: string;
    fullName: string;
    avatarUrl?: string;
    email: string;
    phoneNumber?: string;
    gender?: Gender;
    dateOfBirth?: string;
    specialization?: string;
    baseSalary: number;
    commissionRate: number;
    salaryType: SalaryType;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const genderLabel = {
    MALE: "Nam",
    FEMALE: "Nữ",
    OTHER: "Khác",
};

const salaryTypeLabel = {
    FIXED: "Cố định",
    COMMISSION: "Hoa hồng",
    MIXED: "Kết hợp",
};

const EmployeeList: React.FC = () => {
    const [storeId, setStoreId] = useState<number>(1);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchEmployees = async () => {
            setLoading(true);
            try {
                // Thay {storeId} trong url
                const endpoint = url.EMPLOYEE.GET_BY_STORE.replace(
                    "{storeId}",
                    String(storeId)
                );
                const response = await axios.get<Employee[]>(endpoint);
                setEmployees(response.data);
            } catch (error) {
                setEmployees([]);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, [storeId]);

    return (
        <div className="max-w-5xl mx-auto mt-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Danh sách nhân viên cửa hàng #{storeId}
                </h2>
                <div>
                    <label className="mr-2 text-gray-700 dark:text-gray-200">
                        Nhập Store ID:
                    </label>
                    <input
                        type="number"
                        value={storeId}
                        onChange={(e) => setStoreId(Number(e.target.value))}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-24"
                        min={1}
                    />
                </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
                {loading ? (
                    <p className="text-gray-500 dark:text-gray-400">
                        Đang tải dữ liệu...
                    </p>
                ) : employees.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <th className="py-2">#</th>
                                    <th className="py-2 dark:text-gray-400">
                                        Avatar
                                    </th>
                                    <th className="py-2 dark:text-gray-400">
                                        Tên nhân viên
                                    </th>
                                    <th className="py-2 dark:text-gray-400">
                                        Email
                                    </th>
                                    <th className="py-2 dark:text-gray-400">
                                        Điện thoại
                                    </th>
                                    <th className="py-2 dark:text-gray-400">
                                        Giới tính
                                    </th>
                                    <th className="py-2 dark:text-gray-400">
                                        Lương
                                    </th>
                                    <th className="py-2 dark:text-gray-400">
                                        Loại lương
                                    </th>
                                    <th className="py-2 dark:text-gray-400">
                                        Trạng thái
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp, idx) => (
                                    <tr
                                        key={emp.employeeId}
                                        className="border-t border-gray-100 dark:border-gray-800"
                                    >
                                        <td className="py-2">{idx + 1}</td>
                                        <td className="py-2">
                                            {emp.avatarUrl ? (
                                                <img
                                                    src={emp.avatarUrl}
                                                    alt={emp.fullName}
                                                    className="w-10 h-10 rounded-full object-cover dark:text-gray-400"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-200 ">
                                                    {emp.fullName.charAt(0)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 font-semibold dark:text-gray-400">
                                            {emp.fullName}
                                        </td>
                                        <td className="py-2 dark:text-gray-400">
                                            {emp.email}
                                        </td>
                                        <td className="py-2 dark:text-gray-400">
                                            {emp.phoneNumber || "-"}
                                        </td>
                                        <td className="py-2 dark:text-gray-400">
                                            {emp.gender
                                                ? genderLabel[emp.gender]
                                                : "-"}
                                        </td>
                                        <td className="py-2 dark:text-gray-400">
                                            {emp.baseSalary.toLocaleString()}₫
                                        </td>
                                        <td className="py-2 dark:text-gray-400">
                                            {salaryTypeLabel[emp.salaryType]}
                                        </td>
                                        <td className="py-2">
                                            {emp.isActive ? (
                                                <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs">
                                                    Đang làm
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded bg-gray-200 text-gray-600 text-xs">
                                                    Nghỉ
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                        Không có nhân viên nào.
                    </p>
                )}
            </div>
        </div>
    );
};

export default EmployeeList;
