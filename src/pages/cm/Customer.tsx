import React, { useEffect, useState } from "react";
import api from "../../service/api";
import url from "../../service/url";
import { toast, ToastContainer } from "react-toastify";
import { Search, X, Eye, Pencil } from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";

interface User {
    userId: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    membershipType: string;
    loyaltyPoints: number;
}

const membershipTypes = ["REGULAR", "VIP", "PREMIUM"];

export function Customer() {
    const [users, setUsers] = useState<User[]>([]);
    const [filterName, setFilterName] = useState("");
    const [filterType, setFilterType] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isViewing, setIsViewing] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<
        Partial<User & { password?: string }>
    >({
        fullName: "",
        email: "",
        phoneNumber: "",
        membershipType: "",
        loyaltyPoints: 0,
        password: "",
    });

    const fetchUsers = async () => {
        try {
            const res = await api.get(url.CUSTOMER.GET_ALL);
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            toast.error("Lỗi khi lấy danh sách khách hàng");
            setUsers([]);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentUser?.userId) {
                await api.put(
                    url.CUSTOMER.UPDATE.replace(
                        "{userId}",
                        currentUser.userId.toString()
                    ),
                    formData
                );
                toast.success("Cập nhật khách hàng thành công");
            } else {
                await api.post(url.CUSTOMER.CREATE, formData);
                toast.success("Thêm khách hàng thành công");
            }
            fetchUsers();
            closeModal();
        } catch (error) {
            toast.error(
                isEditing
                    ? "Lỗi khi cập nhật khách hàng"
                    : "Lỗi khi thêm khách hàng"
            );
        }
    };

    const openModal = (mode: "add" | "edit" | "view", user?: User) => {
        setIsModalOpen(true);
        setIsEditing(mode === "edit");
        setIsViewing(mode === "view");
        setCurrentUser(user || null);

        if (user && (mode === "edit" || mode === "view")) {
            setFormData({
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                membershipType: user.membershipType,
                loyaltyPoints: user.loyaltyPoints,
            });
        } else {
            setFormData({
                fullName: "",
                email: "",
                phoneNumber: "",
                membershipType: "",
                loyaltyPoints: 0,
                password: "",
            });
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditing(false);
        setIsViewing(false);
        setCurrentUser(null);
    };

    // Filtered users
    const filteredUsers = users
        .filter((u) => membershipTypes.includes(u.membershipType))
        .filter(
            (u) =>
                (!filterName ||
                    u.fullName
                        .toLowerCase()
                        .includes(filterName.toLowerCase())) &&
                (!filterType || u.membershipType === filterType)
        );

    return (
        <div>
            <PageBreadcrumb pageTitle="Quản Lý Khách Hàng" />
            <ComponentCard title="Quản Lý Khách Hàng">
                <div>
                    {/* Filter Section */}
                    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Ô tìm tên khách hàng */}
                        <form
                            onSubmit={(e) => e.preventDefault()}
                            className="relative w-full md:max-w-sm"
                        >
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Search size={18} />
                            </div>
                            <Input
                                type="text"
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
                                placeholder="Tìm theo tên khách hàng..."
                                className="w-full border border-gray-300 rounded-full py-2 pl-10 pr-10 shadow-sm hover:border-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-gray-200"
                            />
                            {filterName && (
                                <button
                                    type="button"
                                    onClick={() => setFilterName("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                    title="Xoá"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </form>
                        {/* Lọc loại thành viên */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="border border-gray-300 rounded-full py-2 px-4 shadow-sm focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-gray-200"
                        >
                            <option value="">Tất cả loại thành viên</option>
                            {membershipTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                        {/* Nút thêm */}
                        <button
                            onClick={() => openModal("add")}
                            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
                        >
                            Thêm khách hàng mới
                        </button>
                    </div>

                    {/* Customer Table */}
                    <div className="bg-white dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Tên khách hàng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        SĐT
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Loại thành viên
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Điểm
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Hành động
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                                        >
                                            Không có dữ liệu
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr
                                            key={user.userId}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">
                                                {user.userId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">
                                                {user.fullName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">
                                                {user.phoneNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">
                                                {user.membershipType}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">
                                                {user.loyaltyPoints}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap space-x-3">
                                                <button
                                                    onClick={() =>
                                                        openModal("view", user)
                                                    }
                                                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                                    title="Xem"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        openModal("edit", user)
                                                    }
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                    title="Sửa"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Modal */}
                    {isModalOpen && (
                        <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 dark:bg-black/60">
                            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
                                <button
                                    onClick={closeModal}
                                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                                    aria-label="Đóng"
                                >
                                    <X size={22} />
                                </button>
                                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                                    {isViewing
                                        ? "Chi tiết khách hàng"
                                        : isEditing
                                        ? "Sửa khách hàng"
                                        : "Thêm khách hàng"}
                                </h2>
                                {isViewing ? (
                                    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg w-full">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                                    Tên khách hàng
                                                </Label>
                                                <p className="mt-1 text-gray-900 dark:text-gray-100">
                                                    {formData.fullName}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                                    Email
                                                </Label>
                                                <p className="mt-1 text-gray-900 dark:text-gray-100">
                                                    {formData.email}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                                    Số điện thoại
                                                </Label>
                                                <p className="mt-1 text-gray-900 dark:text-gray-100">
                                                    {formData.phoneNumber}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                                    Loại thành viên
                                                </Label>
                                                <p className="mt-1 text-gray-900 dark:text-gray-100">
                                                    {formData.membershipType}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                                    Điểm tích lũy
                                                </Label>
                                                <p className="mt-1 text-gray-900 dark:text-gray-100">
                                                    {formData.loyaltyPoints}
                                                </p>
                                            </div>
                                            <div className="md:col-span-2 flex justify-end">
                                                <button
                                                    onClick={closeModal}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                                >
                                                    Đóng
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <form
                                        onSubmit={handleSubmit}
                                        className="w-full grid grid-cols-1 gap-4"
                                    >
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                                Tên khách hàng
                                            </Label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName || ""}
                                                onChange={handleInputChange}
                                                required
                                                className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                                            />
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                                Email
                                            </Label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email || ""}
                                                onChange={handleInputChange}
                                                required
                                                className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                                            />
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                                Số điện thoại
                                            </Label>
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                value={
                                                    formData.phoneNumber || ""
                                                }
                                                onChange={handleInputChange}
                                                required
                                                className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                                            />
                                        </div>
                                        {!isEditing && (
                                            <div>
                                                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                                    Mật khẩu
                                                </Label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={
                                                        formData.password || ""
                                                    }
                                                    onChange={handleInputChange}
                                                    required
                                                    minLength={6}
                                                    className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                                Loại thành viên
                                            </Label>
                                            <select
                                                name="membershipType"
                                                value={
                                                    formData.membershipType ||
                                                    ""
                                                }
                                                onChange={handleInputChange}
                                                required
                                                className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                                            >
                                                <option value="">
                                                    --Chọn loại--
                                                </option>
                                                {membershipTypes.map((type) => (
                                                    <option
                                                        key={type}
                                                        value={type}
                                                    >
                                                        {type}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                                Điểm tích lũy
                                            </Label>
                                            <input
                                                type="number"
                                                name="loyaltyPoints"
                                                value={
                                                    formData.loyaltyPoints || ""
                                                }
                                                onChange={handleInputChange}
                                                min={0}
                                                className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                                            />
                                        </div>
                                        <div className="col-span-full flex justify-end gap-3 mt-4">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-200 transition dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-1.5 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                                            >
                                                {isEditing
                                                    ? "Cập nhật"
                                                    : "Thêm"}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                    <ToastContainer position="top-right" autoClose={3000} />
                </div>
            </ComponentCard>
        </div>
    );
}

export default Customer;
