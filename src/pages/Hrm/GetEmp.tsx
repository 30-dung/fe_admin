import React, { useEffect, useState } from "react";
import axios from "service/api";
import url from "service/url";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
interface EmployeeUpdateDTO {
    employeeCode?: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    gender?: Gender;
    dateOfBirth?: string;
    specialization?: string;
    avatarUrl?: string;
    baseSalary?: number;
    commissionRate?: number;
    salaryType?: SalaryType;
    // Thêm các trường khác nếu cần
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
interface Store {
    storeId: number;
    storeName: string;
}
const Modal: React.FC<{
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}> = ({ open, onClose, children }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 dark:bg-black/60">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 min-w-[400px] relative">
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    ×
                </button>
                {children}
            </div>
        </div>
    );
};
const EmployeeList: React.FC = () => {
    const [stores, setStores] = useState<Store[]>([]);
    const [storeId, setStoreId] = useState<number>(1);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
    const [updateData, setUpdateData] = useState<EmployeeUpdateDTO>({});

    // THÊM STATE MỚI ĐỂ QUẢN LÝ GIÁ TRỊ STRING CỦA COMMISSION RATE INPUT
    const [commissionRateInput, setCommissionRateInput] = useState<string>("");

    const [updating, setUpdating] = useState(false);

    // Lấy danh sách cửa hàng
    useEffect(() => {
        axios.get(url.STORE.ALL).then((res) => setStores(res.data));
    }, []);

    // Lấy danh sách nhân viên theo storeId
    useEffect(() => {
        const fetchEmployees = async () => {
            setLoading(true);
            try {
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

    // Lấy tên cửa hàng theo id
    const storeName =
        stores.find((s) => s.storeId === storeId)?.storeName || `#${storeId}`;

    const handleEdit = (emp: Employee) => {
        setEditingEmp(emp);
        setUpdateData({
            employeeCode: emp.employeeCode,
            fullName: emp.fullName,
            email: emp.email,
            phoneNumber: emp.phoneNumber,
            gender: emp.gender,
            dateOfBirth: emp.dateOfBirth,
            specialization: emp.specialization,
            avatarUrl: emp.avatarUrl,
            baseSalary: emp.baseSalary,
            commissionRate: emp.commissionRate, // Giữ nguyên giá trị number
            salaryType: emp.salaryType,
        });
        // KHI MỞ MODAL, CẬP NHẬT GIÁ TRỊ STRING CHO INPUT COMMISSION RATE
        setCommissionRateInput(emp.commissionRate !== undefined ? String(emp.commissionRate) : "");
    };

    const handleUpdate = async () => {
        if (!editingEmp) return;
        setUpdating(true);

        // Đảm bảo commissionRate trong updateData là giá trị số từ input string
        const finalCommissionRate = parseFloat(commissionRateInput);
        if (isNaN(finalCommissionRate)) {
             toast.error("Tỉ lệ hoa hồng không hợp lệ.", { // Thông báo lỗi nếu giá trị cuối cùng không phải số
                position: "top-right",
                autoClose: 4000,
            });
            setUpdating(false);
            return;
        }

        try {
            await axios.put(
                url.EMPLOYEE.ADMIN_UPDATE.replace(
                    "{employeeId}",
                    String(editingEmp.employeeId)
                ),
                { ...updateData, commissionRate: finalCommissionRate } // Gửi giá trị đã parse
            );
            setEditingEmp(null);
            setUpdateData({});
            setCommissionRateInput(""); // Reset input string state sau khi cập nhật
            // Reload employees
            const endpoint = url.EMPLOYEE.GET_BY_STORE.replace(
                "{storeId}",
                String(storeId)
            );
            const response = await axios.get<Employee[]>(endpoint);
            setEmployees(response.data);
            toast.success("Cập nhật nhân viên thành công!", {
                position: "top-right",
                autoClose: 2000,
            });
        } catch (err: any) {
            // Hiển thị chi tiết lỗi nếu có
            if (err.response?.data?.errors) {
                const errorsObj = err.response.data.errors;
                if (typeof errorsObj === "object") {
                    Object.values(errorsObj).forEach((errArr) => {
                        if (Array.isArray(errArr)) {
                            errArr.forEach((msg) =>
                                toast.error(msg, {
                                    position: "top-right",
                                    autoClose: 4000,
                                })
                            );
                        } else if (typeof errArr === "string") {
                            toast.error(errArr, {
                                position: "top-right",
                                autoClose: 4000,
                            });
                        }
                    });
                }
            } else if (err.response?.data?.message) {
                toast.error(err.response.data.message, {
                    position: "top-right",
                    autoClose: 4000,
                });
            } else {
                toast.error("Cập nhật thất bại", {
                    position: "top-right",
                    autoClose: 4000,
                });
            }
        } finally {
            setUpdating(false);
        }
    };
    return (
        <div className="max-w-5xl mx-auto mt-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Danh sách nhân viên {storeName}
                </h2>
                <div>
                    <label className="mr-2 text-gray-700 dark:text-gray-200">
                        Chọn cửa hàng:
                    </label>
                    <select
                        value={storeId}
                        onChange={(e) => setStoreId(Number(e.target.value))}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-48"
                    >
                        {stores.map((store) => (
                            <option key={store.storeId} value={store.storeId}>
                                {store.storeName}
                            </option>
                        ))}
                    </select>
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
                                    <th className="py-2 dark:text-gray-400">
                                        #
                                    </th>
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
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp, idx) => (
                                    <tr
                                        key={emp.employeeId}
                                        className="border-t border-gray-100 dark:border-gray-800"
                                    >
                                        <td className="py-2 dark:text-gray-400">
                                            {idx + 1}
                                        </td>
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
                                            <button
                                                className="px-2 py-1 bg-blue-600 text-white rounded"
                                                onClick={() => handleEdit(emp)}
                                            >
                                                Sửa
                                            </button>
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

                {/* Modal sửa nhân viên */}
                <Modal open={!!editingEmp} onClose={() => setEditingEmp(null)}>
                    <h3 className="font-bold mb-4 text-lg">
                        Cập nhật nhân viên
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            className="border p-2 rounded"
                            placeholder="Mã nhân viên"
                            value={updateData.employeeCode || ""}
                            onChange={(e) =>
                                setUpdateData((d) => ({
                                    ...d,
                                    employeeCode: e.target.value,
                                }))
                            }
                        />
                        <input
                            className="border p-2 rounded"
                            placeholder="Họ tên"
                            value={updateData.fullName || ""}
                            onChange={(e) =>
                                setUpdateData((d) => ({
                                    ...d,
                                    fullName: e.target.value,
                                }))
                            }
                        />
                        <input
                            className="border p-2 rounded"
                            placeholder="Email"
                            value={updateData.email || ""}
                            onChange={(e) =>
                                setUpdateData((d) => ({
                                    ...d,
                                    email: e.target.value,
                                }))
                            }
                        />
                        <input
                            className="border p-2 rounded"
                            placeholder="Số điện thoại"
                            value={updateData.phoneNumber || ""}
                            onChange={(e) =>
                                setUpdateData((d) => ({
                                    ...d,
                                    phoneNumber: e.target.value,
                                }))
                            }
                        />
                        <select
                            className="border p-2 rounded"
                            value={updateData.gender || ""}
                            onChange={(e) =>
                                setUpdateData((d) => ({
                                    ...d,
                                    gender: e.target.value as Gender,
                                }))
                            }
                        >
                            <option value="">Giới tính</option>
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                            <option value="OTHER">Khác</option>
                        </select>
                        <input
                            className="border p-2 rounded"
                            type="date"
                            value={updateData.dateOfBirth?.slice(0, 10) || ""}
                            onChange={(e) =>
                                setUpdateData((d) => ({
                                    ...d,
                                    dateOfBirth: e.target.value,
                                }))
                            }
                        />
                        <input
                            className="border p-2 rounded"
                            placeholder="Chuyên môn"
                            value={updateData.specialization || ""}
                            onChange={(e) =>
                                setUpdateData((d) => ({
                                    ...d,
                                    specialization: e.target.value,
                                }))
                            }
                        />
                        <input
                            className="border p-2 rounded"
                            placeholder="Avatar URL"
                            value={updateData.avatarUrl || ""}
                            onChange={(e) =>
                                setUpdateData((d) => ({
                                    ...d,
                                    avatarUrl: e.target.value,
                                }))
                            }
                        />
                        <input
                            className="border p-2 rounded"
                            type="number"
                            placeholder="Lương cơ bản"
                            value={updateData.baseSalary || ""}
                            onChange={(e) =>
                                setUpdateData((d) => ({
                                    ...d,
                                    baseSalary: Number(e.target.value),
                                }))
                            }
                        />
                        <input
                            className="border p-2 rounded"
                            type="text" // Giữ type="text" để xử lý nhập liệu linh hoạt hơn
                            placeholder="Tỉ lệ hoa hồng (ví dụ: 0.07 cho 7%)"
                            value={commissionRateInput} // KẾT NỐI VỚI STATE CHUỖI MỚI NÀY
                            onChange={(e) => {
                                const value = e.target.value;
                                setCommissionRateInput(value); // CẬP NHẬT STATE CHUỖI ĐỂ HIỂN THỊ TRONG INPUT

                                // Cố gắng parse thành số float. Nếu người dùng nhập "0." hoặc ".",
                                // parseFloat vẫn trả về 0 hoặc NaN.
                                const parsedValue = parseFloat(value);

                                // Cập nhật updateData.commissionRate chỉ khi parsedValue không phải NaN.
                                // Điều này đảm bảo giá trị gửi đi là số, nhưng input vẫn hiển thị chuỗi đang gõ.
                                setUpdateData((d) => ({
                                    ...d,
                                    // Nếu parse thành công và không phải NaN, sử dụng giá trị đã parse.
                                    // Ngược lại, nếu input rỗng hoặc không phải số, có thể để undefined/null
                                    commissionRate: !isNaN(parsedValue) ? parsedValue : undefined,
                                }));
                            }}
                        />
                        <select
                            className="border p-2 rounded"
                            value={updateData.salaryType || ""}
                            onChange={(e) =>
                                setUpdateData((d) => ({
                                    ...d,
                                    salaryType: e.target.value as SalaryType,
                                }))
                            }
                        >
                            <option value="">Loại lương</option>
                            <option value="FIXED">Cố định</option>
                            <option value="COMMISSION">Hoa hồng</option>
                            <option value="MIXED">Kết hợp</option>
                        </select>
                    </div>
                    <div className="mt-6 flex gap-2 justify-end">
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                            onClick={handleUpdate}
                            disabled={updating}
                        >
                            {updating ? "Đang cập nhật..." : "Lưu"}
                        </button>
                        <button
                            className="px-4 py-2 bg-gray-400 text-white rounded"
                            onClick={() => setEditingEmp(null)}
                            disabled={updating}
                        >
                            Hủy
                        </button>
                    </div>
                </Modal>
            </div>
            <ToastContainer />
        </div>
    );
};

export default EmployeeList;