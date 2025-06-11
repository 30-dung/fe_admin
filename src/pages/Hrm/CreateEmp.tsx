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
import url from "../../service/url";
import axios from "../../service/api";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

// Types based on backend
interface EmployeeRequestDTO {
    employeeCode: string;
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    dateOfBirth: Date;
    specialization: string;
    storeId: number;
    roleIds: number[];
    avatarUrl?: string;
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
        dateOfBirth: new Date(),
        specialization: "",
        storeId: 0,
        roleIds: [3],
        avatarUrl: "",
    });

    const [stores, setStores] = useState<Store[]>([]);

    const [roles, setRoles] = useState<Role[]>([
        { id: 1, name: "ADMIN", description: "Quản trị viên" },
        { id: 2, name: "MANAGER", description: "Quản lý" },
        { id: 3, name: "EMPLOYEE", description: "Nhân viên" },
        { id: 4, name: "CASHIER", description: "Thu ngân" },
    ]);

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

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

        if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = "Ngày sinh không được để trống";
        }

        if (!formData.specialization.trim()) {
            newErrors.specialization = "Chuyên môn không được để trống";
        }

        if (formData.storeId === 0) {
            newErrors.storeId = "Vui lòng chọn cửa hàng";
        }

        if (formData.roleIds.length === 0) {
            newErrors.roleIds = "Vui lòng chọn ít nhất một vai trò";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Convert dateOfBirth to ISO string
            const payload = {
                ...formData,
                dateOfBirth:
                    formData.dateOfBirth instanceof Date
                        ? formData.dateOfBirth.toISOString().slice(0, 19)
                        : new Date(formData.dateOfBirth)
                              .toISOString()
                              .slice(0, 19),
            };

            const response = await axios.post(url.EMPLOYEE.CREATE, payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200 || response.status === 201) {
                alert("Tạo nhân viên thành công!");

                // Reset form
                setFormData({
                    employeeCode: "",
                    fullName: "",
                    email: "",
                    password: "",
                    phoneNumber: "",
                    gender: "MALE",
                    dateOfBirth: new Date(),
                    specialization: "",
                    storeId: 0,
                    roleIds: [3],
                    avatarUrl: "",
                });
            } else {
                alert(
                    `Lỗi: ${
                        response.data?.message || "Không thể tạo nhân viên"
                    }`
                );
            }
        } catch (error: any) {
            console.error("Error creating employee:", error);
            alert(
                `Đã xảy ra lỗi khi tạo nhân viên: ${
                    error.response?.data?.message || error.message
                }`
            );
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

                            <div>
                                <Label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL Avatar
                                </Label>
                                <Input
                                    type="url"
                                    name="avatarUrl"
                                    value={formData.avatarUrl}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập URL ảnh đại diện"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                Vai trò *{" "}
                                <Shield className="inline h-4 w-4 ml-1" />
                            </Label>
                            <div className="dark:text-gray-400 font-semibold">
                                Nhân viên
                            </div>
                        </div>
                    </div>

                    {/* Salary Information Notice */}
                    <div className=" border border-blue-200 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">
                            Thông tin lương mặc định
                        </h3>
                        <div className="text-sm text-blue-700 space-y-1">
                            <p>• Lương cơ bản: 10,000,000 VND</p>
                            <p>• Tỷ lệ hoa hồng: 5%</p>
                            <p>• Loại lương: Lương cố định + hoa hồng</p>
                            <p className="text-xs text-blue-600 mt-2">
                                *Có thể chỉnh sửa sau khi tạo tài khoản
                            </p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>
    );
};

export default CreateEmployeeForm;
