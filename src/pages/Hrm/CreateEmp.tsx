// CreateEmp.tsx
import React, { useState, useEffect } from "react";
import {
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Shield,
    Eye,
    EyeOff,
} from "lucide-react";
import url from "service/url";
import axios from "service/api";
import PageBreadcrumb from "components/common/PageBreadCrumb";
import ComponentCard from "components/common/ComponentCard";
import Label from "components/form/Label";
import Input from "components/form/input/InputField";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Types based on backend
interface EmployeeRequestDTO {
    employeeCode: string;
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    dateOfBirth: string; // Changed to string for easier handling with input type="date"
    specialization: string;
    storeId: number;
    roleIds: number[];
    avatarUrl?: string; // This will be a URL
}

interface Store {
    storeId: number;
    storeName: string;
    cityProvince: string;
    district: string;
}

interface Role {
    id: number;
    name: string;
    description: string;
}

const CreateEmployeeForm = () => {
    const [formData, setFormData] = useState<EmployeeRequestDTO>({
        employeeCode: "",
        fullName: "",
        email: "",
        password: "",
        phoneNumber: "",
        gender: "MALE",
        dateOfBirth: "", // Khởi tạo là empty string
        specialization: "",
        storeId: 0,
        roleIds: [3],
        avatarUrl: "",
    });

    const [stores, setStores] = useState<Store[]>([]);

    const [roles, setRoles] = useState<Role[]>([
        { id: 1, name: "ADMIN", description: "Quản trị viên" },
        { id: 3, name: "EMPLOYEE", description: "Nhân viên" },
    ]);

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // NEW STATES for avatar image handling
    const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.employeeCode.trim()) {
            newErrors.employeeCode = "Mã nhân viên không được để trống";
        }

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Họ tên không được để trống";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email không được để trống";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email không đúng định dạng";
        }

        if (!formData.password.trim()) {
            newErrors.password = "Mật khẩu không được để trống";
        } else if (formData.password.length < 6) {
            newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = "Số điện thoại không được để trống";
        } else if (!/^[0-9]{10,11}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = "Số điện thoại không đúng định dạng";
        }

        // Sửa phần validation dateOfBirth
        if (!formData.dateOfBirth.trim()) {
            newErrors.dateOfBirth = "Ngày sinh không được để trống";
        } else {
            // Validate date format and check if it's a valid date
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(formData.dateOfBirth)) {
                newErrors.dateOfBirth = "Ngày sinh không đúng định dạng";
            } else {
                const date = new Date(formData.dateOfBirth);
                if (isNaN(date.getTime())) {
                    newErrors.dateOfBirth = "Ngày sinh không hợp lệ";
                }
            }
        }

        if (!formData.specialization.trim()) {
            newErrors.specialization = "Chuyên môn không được để trống";
        }

        if (formData.storeId === 0) {
            newErrors.storeId = "Vui lòng chọn cửa hàng";
        }

        // For roleIds, ensure '3' (EMPLOYEE) is always selected.
        if (!formData.roleIds.includes(3)) {
            newErrors.roleIds = "Vai trò 'Nhân viên' phải được chọn.";
        }
        if (formData.roleIds.length === 0) {
            newErrors.roleIds = "Vui lòng chọn ít nhất một vai trò";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // NEW Image Upload Function
    const uploadImage = async (imageFile: File): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append("file", imageFile);
            const response = await axios.post<string>(
                url.UPLOAD.IMAGE,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            return response.data; // This will be the URL returned by the backend
        } catch (error: any) {
            toast.error(`Không thể tải ảnh lên: ${error.message}`);
            return null;
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            let avatarUrl: string | null = formData.avatarUrl || ""; // Start with current URL

            if (selectedAvatar) {
                // If a new image is selected, upload it
                avatarUrl = await uploadImage(selectedAvatar);
                if (!avatarUrl) {
                    // Stop if image upload fails
                    setIsSubmitting(false);
                    return;
                }
            } else if (formData.avatarUrl === "") {
                // If the user cleared the field and no new file selected
                avatarUrl = ""; // Explicitly set to empty if cleared
            }

            // Convert dateOfBirth to ISO string format (YYYY-MM-DDTHH:mm:ss) expected by backend
            // formData.dateOfBirth is already a string in YYYY-MM-DD format
            const dateOfBirthISO = formData.dateOfBirth
                ? `${formData.dateOfBirth}T00:00:00` // Add time component for backend
                : null;

            const payload = {
                ...formData,
                dateOfBirth: dateOfBirthISO, // Pass the formatted string or null
                avatarUrl: avatarUrl, // Use the uploaded URL or existing one
            };

            const response = await axios.post(url.EMPLOYEE.CREATE, payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200 || response.status === 201) {
                toast.success("Tạo nhân viên thành công!", {
                    position: "top-right",
                    autoClose: 3000,
                });

                // Reset form
                setFormData({
                    employeeCode: "",
                    fullName: "",
                    email: "",
                    password: "",
                    phoneNumber: "",
                    gender: "MALE",
                    dateOfBirth: "", // Reset về empty string
                    specialization: "",
                    storeId: 0,
                    roleIds: [3],
                    avatarUrl: "",
                });
                setSelectedAvatar(null); // Clear selected file
                setAvatarPreview(null); // Clear preview
            } else {
                toast.error(
                    `Lỗi: ${
                        response.data?.message || "Không thể tạo nhân viên"
                    }`,
                    { position: "top-right", autoClose: 4000 }
                );
            }
        } catch (error: any) {
            // Hiển thị chi tiết lỗi từ backend nếu có
            if (error.response?.data?.errors) {
                const errorsObj = error.response.data.errors;
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
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message, {
                    position: "top-right",
                    autoClose: 4000,
                });
            } else {
                toast.error(error.message, {
                    position: "top-right",
                    autoClose: 4000,
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;

        // For dateOfBirth, directly use the string value from input type="date"
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    // NEW handler for avatar file input
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedAvatar(file);
            setAvatarPreview(URL.createObjectURL(file)); // Create a preview URL
        } else {
            setSelectedAvatar(null);
            setAvatarPreview(null);
        }
    };

    const handleRoleChange = (roleId: number) => {
        setFormData((prev) => ({
            ...prev,
            roleIds: prev.roleIds.includes(roleId)
                ? prev.roleIds.filter((id) => id !== roleId)
                : [...prev.roleIds, roleId],
        }));

        if (errors.roleIds) {
            setErrors((prev) => ({
                ...prev,
                roleIds: "",
            }));
        }
    };
    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await axios.get(url.STORE.ALL);
                setStores(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Không thể lấy danh sách cửa hàng", error);
                setStores([]);
            }
        };
        fetchStores();
    }, []);

    return (
        <div>
            <PageBreadcrumb pageTitle="Tạo hồ sơ nhân viên" />
            <ComponentCard title="Điền thông tin để tạo tài khoản nhân viên mới">
                <div className="space-y-6">
                    {/* Basic Information */}
                    <div className=" p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Mã nhân viên *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 " />
                                    <Input
                                        type="text"
                                        name="employeeCode"
                                        value={formData.employeeCode}
                                        onChange={handleInputChange}
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.employeeCode
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="Nhập mã nhân viên"
                                    />
                                </div>
                                {errors.employeeCode && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.employeeCode}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label>Họ và tên *</Label>
                                <Input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.fullName
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="Nhập họ và tên"
                                />
                                {errors.fullName && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.fullName}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label>Email *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`pl-[62px]  ${
                                            errors.email
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="Nhập email"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label>Mật khẩu *</Label>
                                <div className="relative">
                                    <Input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`w-full pr-10 pl-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.password
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="Nhập mật khẩu"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label>Số điện thoại *</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.phoneNumber
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>
                                {errors.phoneNumber && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.phoneNumber}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label>Giới tính *</Label>
                                <div className="relative">
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400 w-full  pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        style={{ height: "43px" }}
                                    >
                                        <option
                                            className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                                            value="MALE"
                                        >
                                            Nam
                                        </option>
                                        <option
                                            className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                                            value="FEMALE"
                                        >
                                            Nữ
                                        </option>
                                        <option
                                            className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                                            value="OTHER"
                                        >
                                            Khác
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <Label>Ngày sinh *</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="date"
                                        name="dateOfBirth"
                                        // Use the string value directly for input type="date"
                                        value={formData.dateOfBirth}
                                        onChange={handleInputChange}
                                        className={`text-gray-700 dark:bg-gray-900 dark:text-gray-400 w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.dateOfBirth
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        }`}
                                    />
                                </div>
                                {errors.dateOfBirth && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.dateOfBirth}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label>Chuyên môn *</Label>
                                <Input
                                    name="specialization"
                                    value={formData.specialization}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.specialization
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="Nhập chuyên môn"
                                />
                                {errors.specialization && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.specialization}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Work Information */}
                    <div className=" p-4 rounded-lg">
                        <h2 className="text-lg font-semibold  dark:text-gray-400 mb-4">
                            Thông tin công việc
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cửa hàng *
                                </Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <select
                                        name="storeId"
                                        value={formData.storeId}
                                        onChange={handleInputChange}
                                        className={`text-gray-700 dark:bg-gray-900 dark:text-gray-400 w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.storeId
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        }`}
                                        style={{ height: "43px" }}
                                    >
                                        <option
                                            className="dark:bg-gray-900"
                                            value={0}
                                        >
                                            Chọn cửa hàng
                                        </option>
                                        {stores.map((store) => (
                                            <option
                                                key={store.storeId}
                                                value={store.storeId}
                                                className="dark:bg-gray-900"
                                            >
                                                {store.storeName} -{" "}
                                                {store.cityProvince}{" "}
                                                {store.district &&
                                                    `- ${store.district}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.storeId && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.storeId}
                                    </p>
                                )}
                            </div>

                            {/* NEW: File Input for Avatar URL */}
                            <div>
                                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Ảnh đại diện
                                </Label>
                                <input
                                    type="file"
                                    name="avatarFile"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    onChange={handleAvatarChange}
                                    accept="image/*"
                                />
                                {avatarPreview && (
                                    <div className="mt-2">
                                        <img
                                            src={avatarPreview}
                                            alt="Xem trước ảnh đại diện"
                                            className="w-24 h-24 object-cover rounded-full"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4">
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                Vai trò *{" "}
                                <Shield className="inline h-4 w-4 ml-1" />
                            </Label>
                            <div className="dark:text-gray-400 font-semibold">
                                {/* Only display EMPLOYEE role for now as per your original code's fixed roleIds */}
                                Nhân viên
                                {/* If you want to allow admin to assign roles, you'd need checkboxes for roles: */}
                                {/*
                                {roles.map(role => (
                                    <div key={role.id}>
                                        <input
                                            type="checkbox"
                                            id={`role-${role.id}`}
                                            name="roleIds"
                                            value={role.id}
                                            checked={formData.roleIds.includes(role.id)}
                                            onChange={() => handleRoleChange(role.id)}
                                            className="mr-2"
                                        />
                                        <label htmlFor={`role-${role.id}`}>{role.name} ({role.description})</label>
                                    </div>
                                ))}
                                */}
                            </div>
                            {errors.roleIds && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.roleIds}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Salary Information Notice */}

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => {
                                // Reset form and image states on cancel
                                setFormData({
                                    employeeCode: "",
                                    fullName: "",
                                    email: "",
                                    password: "",
                                    phoneNumber: "",
                                    gender: "MALE",
                                    dateOfBirth: "", // Reset về empty string
                                    specialization: "",
                                    storeId: 0,
                                    roleIds: [3],
                                    avatarUrl: "",
                                });
                                setSelectedAvatar(null);
                                setAvatarPreview(null);
                                setErrors({}); // Clear errors
                            }}
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Đang tạo..." : "Tạo nhân viên"}
                        </button>
                    </div>
                </div>
                {/* </div> */}
            </ComponentCard>
            <ToastContainer />
        </div>
    );
};

export default CreateEmployeeForm;
