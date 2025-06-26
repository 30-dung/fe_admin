// GetEmp.tsx
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
    avatarUrl?: string; // This will be a URL
    email: string;
    phoneNumber?: string;
    gender?: Gender;
    dateOfBirth?: string; // Stored as string (ISO format)
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
    dateOfBirth?: string; // Send as string (ISO format)
    specialization?: string;
    avatarUrl?: string; // This will be the URL
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

// Helper function to format number with dots
const formatNumberWithDots = (num: number | string | undefined): string => {
    if (num === undefined || num === null || num === "") {
        return "";
    }
    // Convert to number, then to locale string with 'vi-VN' for dot separator
    const numberValue = typeof num === 'string' ? parseFloat(num.replace(/\./g, '')) : num;
    if (isNaN(numberValue)) {
        return "";
    }
    return numberValue.toLocaleString('vi-VN');
};

// Helper function to parse number from string with dots
const parseNumberFromFormattedString = (str: string): number => {
    // Remove all dots and then parse as float
    const cleanedStr = str.replace(/\./g, '');
    return parseFloat(cleanedStr);
};


const Modal: React.FC<{
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}> = ({ open, onClose, children }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 dark:bg-black/60">
            {/* Increased max-w-2xl to max-w-4xl for a much wider modal */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-4xl w-full relative">
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

    const [commissionRateInput, setCommissionRateInput] = useState<string>("");
    // NEW STATE for formatted base salary input
    const [baseSalaryInput, setBaseSalaryInput] = useState<string>("");

    const [updating, setUpdating] = useState(false);

    // NEW STATES for avatar image handling
    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);


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
            dateOfBirth: emp.dateOfBirth, // Keep as string (ISO format)
            specialization: emp.specialization,
            avatarUrl: emp.avatarUrl, // Set existing URL
            baseSalary: emp.baseSalary,
            commissionRate: emp.commissionRate,
            salaryType: emp.salaryType,
        });
        setCommissionRateInput(emp.commissionRate !== undefined ? String(emp.commissionRate) : "");
        // Initialize formatted base salary input
        setBaseSalaryInput(formatNumberWithDots(emp.baseSalary));


        // Set avatar preview if existing avatarUrl is present
        setSelectedAvatarFile(null); // Clear any previously selected new file
        if (emp.avatarUrl) {
            setAvatarPreview(`http://localhost:9090${emp.avatarUrl}`); // Pre-populate with existing image
        } else {
            setAvatarPreview(null);
        }
    };

    // NEW handler for avatar file input
    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file)); // Create a preview URL
        } else {
            setSelectedAvatarFile(null);
            setAvatarPreview(null);
        }
    };

    // NEW Image Upload Function
    const uploadImage = async (imageFile: File): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append('file', imageFile);
            const response = await axios.post<string>(url.UPLOAD.IMAGE, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data; // This will be the URL returned by the backend
        } catch (error: any) {
            toast.error(`Không thể tải ảnh lên: ${error.message}`);
            return null;
        }
    };


    const handleUpdate = async () => {
        if (!editingEmp) return;
        setUpdating(true);

        const finalCommissionRate = parseFloat(commissionRateInput);
        if (isNaN(finalCommissionRate)) {
             toast.error("Tỉ lệ hoa hồng không hợp lệ.", {
                position: "top-right",
                autoClose: 4000,
            });
            setUpdating(false);
            return;
        }

        // Parse base salary from formatted string
        const finalBaseSalary = parseNumberFromFormattedString(baseSalaryInput);
        if (isNaN(finalBaseSalary) || finalBaseSalary < 0) {
            toast.error("Lương cơ bản không hợp lệ.", {
                position: "top-right",
                autoClose: 4000,
            });
            setUpdating(false);
            return;
        }


        let finalAvatarUrl: string | undefined = updateData.avatarUrl; // Start with current URL in updateData

        if (selectedAvatarFile) {
            // Upload new image if selected
            const uploadedUrl = await uploadImage(selectedAvatarFile);
            if (!uploadedUrl) {
                setUpdating(false);
                return; // Stop if image upload fails
            }
            finalAvatarUrl = uploadedUrl;
        } else if (updateData.avatarUrl === "") {
             // If the user explicitly cleared the existing URL in the form
            finalAvatarUrl = "";
        }


        try {
            const payload = {
                ...updateData,
                baseSalary: finalBaseSalary, // Use parsed number
                commissionRate: finalCommissionRate,
                avatarUrl: finalAvatarUrl, // Use the new URL, or existing, or empty string
            };

            await axios.put(
                url.EMPLOYEE.ADMIN_UPDATE.replace(
                    "{employeeId}",
                    String(editingEmp.employeeId)
                ),
                payload
            );
            setEditingEmp(null);
            setUpdateData({});
            setCommissionRateInput("");
            setBaseSalaryInput(""); // Clear formatted input
            setSelectedAvatarFile(null);
            setAvatarPreview(null);

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
                                                    src={`http://localhost:9090${emp.avatarUrl}`} // Adjust URL
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
                <Modal open={!!editingEmp} onClose={() => {
                    setEditingEmp(null);
                    setAvatarPreview(null); // Clear preview on close
                    setSelectedAvatarFile(null); // Clear selected file on close
                }}>
                    <h3 className="font-bold mb-4 text-lg">
                        Cập nhật nhân viên
                    </h3>
                    {/* Changed grid-cols-2 to grid-cols-3 for a 3-column layout */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Mã nhân viên */}
                        <div>
                            <span className="block mb-1 text-gray-700 dark:text-gray-200 text-sm">Mã nhân viên</span>
                            <input
                                className="border p-2 rounded w-full"
                                placeholder="Mã nhân viên"
                                value={updateData.employeeCode || ""}
                                onChange={(e) =>
                                    setUpdateData((d) => ({
                                        ...d,
                                        employeeCode: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        {/* Họ tên */}
                        <div>
                            <span className="block mb-1 text-gray-700 dark:text-gray-200 text-sm">Họ tên</span>
                            <input
                                className="border p-2 rounded w-full"
                                placeholder="Họ tên"
                                value={updateData.fullName || ""}
                                onChange={(e) =>
                                    setUpdateData((d) => ({
                                        ...d,
                                        fullName: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        {/* Email */}
                        <div>
                            <span className="block mb-1 text-gray-700 dark:text-gray-200 text-sm">Email</span>
                            <input
                                className="border p-2 rounded w-full"
                                placeholder="Email"
                                value={updateData.email || ""}
                                onChange={(e) =>
                                    setUpdateData((d) => ({
                                        ...d,
                                        email: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        {/* Số điện thoại */}
                        <div>
                            <span className="block mb-1 text-gray-700 dark:text-gray-200 text-sm">Số điện thoại</span>
                            <input
                                className="border p-2 rounded w-full"
                                placeholder="Số điện thoại"
                                value={updateData.phoneNumber || ""}
                                onChange={(e) =>
                                    setUpdateData((d) => ({
                                        ...d,
                                        phoneNumber: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        {/* Giới tính */}
                        <div>
                            <span className="block mb-1 text-gray-700 dark:text-gray-200 text-sm">Giới tính</span>
                            <select
                                className="border p-2 rounded w-full"
                                value={updateData.gender || ""}
                                onChange={(e) =>
                                    setUpdateData((d) => ({
                                        ...d,
                                        gender: e.target.value as Gender,
                                    }))
                                }
                            >
                                <option value="">Chọn giới tính</option>
                                <option value="MALE">Nam</option>
                                <option value="FEMALE">Nữ</option>
                                <option value="OTHER">Khác</option>
                            </select>
                        </div>
                        {/* Ngày sinh */}
                        <div>
                            <span className="block mb-1 text-gray-700 dark:text-gray-200 text-sm">Ngày sinh</span>
                            <input
                                className="border p-2 rounded w-full"
                                type="date"
                                value={updateData.dateOfBirth?.slice(0, 10) || ""}
                                onChange={(e) =>
                                    setUpdateData((d) => ({
                                        ...d,
                                        dateOfBirth: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        {/* Chuyên môn */}
                        <div>
                            <span className="block mb-1 text-gray-700 dark:text-gray-200 text-sm">Chuyên môn</span>
                            <input
                                className="border p-2 rounded w-full"
                                placeholder="Chuyên môn"
                                value={updateData.specialization || ""}
                                onChange={(e) =>
                                    setUpdateData((d) => ({
                                        ...d,
                                        specialization: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        {/* Ảnh đại diện - Moved preview and clear button inside this div */}
                        <div>
                            <span className="block mb-1 text-gray-700 dark:text-gray-200 text-sm">Ảnh đại diện</span>
                            <input
                                type="file"
                                name="avatarFile"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                onChange={handleAvatarFileChange}
                                accept="image/*"
                            />
                            {/* Image Preview and Clear button */}
                            {(avatarPreview || updateData.avatarUrl) && (
                                <div className="mt-2 flex flex-col items-start"> {/* Use flex-col and items-start for stacking */}
                                    <img
                                        src={avatarPreview || `http://localhost:9090${updateData.avatarUrl}`}
                                        alt="Xem trước ảnh đại diện"
                                        className="w-24 h-24 object-cover rounded-full"
                                    />
                                    {/* Option to clear existing avatar if no new file is selected */}
                                    {updateData.avatarUrl && !selectedAvatarFile && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUpdateData(prev => ({ ...prev, avatarUrl: "" }));
                                                setAvatarPreview(null);
                                            }}
                                            className="text-red-500 text-sm mt-1 hover:underline"
                                        >
                                            Xóa ảnh hiện tại
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Lương cơ bản */}
                        <div>
                            <span className="block mb-1 text-gray-700 dark:text-gray-200 text-sm">Lương cơ bản (VNĐ)</span>
                            <input
                                className="border p-2 rounded w-full"
                                type="text" // Changed to text to allow custom formatting
                                placeholder="Lương cơ bản"
                                value={baseSalaryInput} // Bound to new state
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setBaseSalaryInput(formatNumberWithDots(value)); // Format for display
                                    // Also update the numerical value in updateData for submission
                                    setUpdateData(prev => ({
                                        ...prev,
                                        baseSalary: parseNumberFromFormattedString(value)
                                    }));
                                }}
                            />
                        </div>
                        {/* Tỉ lệ hoa hồng */}
                        <div>
                            <span className="block mb-1 text-gray-700 dark:text-gray-200 text-sm">Tỉ lệ hoa hồng</span>
                            <input
                                className="border p-2 rounded w-full"
                                type="text"
                                placeholder="Ví dụ: 0.07 cho 7%"
                                value={commissionRateInput}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setCommissionRateInput(value);
                                    const parsedValue = parseFloat(value);
                                    setUpdateData((d) => ({
                                        ...d,
                                        commissionRate: !isNaN(parsedValue) ? parsedValue : undefined,
                                    }));
                                }}
                            />
                        </div>
                        {/* Loại lương */}
                        <div>
                            <span className="block mb-1 text-gray-700 dark:text-gray-200 text-sm">Loại lương</span>
                            <select
                                className="border p-2 rounded w-full"
                                value={updateData.salaryType || ""}
                                onChange={(e) =>
                                    setUpdateData((d) => ({
                                        ...d,
                                        salaryType: e.target.value as SalaryType,
                                    }))
                                }
                            >
                                <option value="">Chọn loại lương</option>
                                <option value="FIXED">Cố định</option>
                                <option value="COMMISSION">Hoa hồng</option>
                                <option value="MIXED">Kết hợp</option>
                            </select>
                        </div>
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
                            onClick={() => {
                                setEditingEmp(null);
                                setAvatarPreview(null); // Clear preview on cancel
                                setSelectedAvatarFile(null); // Clear selected file on cancel
                            }}
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