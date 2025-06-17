import React, { useState, useEffect } from "react";
import api from "../../service/api";
import url from "../../service/url";
import { toast, ToastContainer } from "react-toastify";
import { Search, X, Eye, Pencil } from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";

interface Store {
    storeId: number;
    storeName: string;
    phoneNumber: string;
    cityProvince: string | null;
    district: string | null;
    openingTime: string | null;
    closingTime: string | null;
    description: string | null;
    storeImages: string | null;
    averageRating: number;
    createdAt: string | null;
}

interface StoreFormData {
    storeName: string;
    phoneNumber: string;
    cityProvince: string;
    district: string;
    openingTime: string;
    closingTime: string;
    description: string;
    storeImages: string;
}

interface Pagination {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
}

export function Store() {
    const [stores, setStores] = useState<Store[]>([]);
    const [filterCity, setFilterCity] = useState("");
    const [filterDistrict, setFilterDistrict] = useState("");
    const [cities, setCities] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        currentPage: 1,
        totalPages: 1,
        pageSize: 10,
        totalItems: 0,
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isViewing, setIsViewing] = useState(false);
    const [currentStore, setCurrentStore] = useState<Store | null>(null);
    const [formData, setFormData] = useState<StoreFormData>({
        storeName: "",
        phoneNumber: "",
        cityProvince: "",
        district: "",
        openingTime: "",
        closingTime: "",
        description: "",
        storeImages: "",
    });

    const fetchStores = async (city: string = "", district: string = "") => {
        try {
            const response = await api.get(url.STORE.LOCATE, {
                params: { city, district },
            });
            const mappedStores = response.data.map((store: any) => ({
                storeId: store.storeId,
                storeName: store.storeName || "",
                phoneNumber: store.phoneNumber || "",
                cityProvince: store.cityProvince || null,
                district: store.district || null,
                openingTime: store.openingTime || null,
                closingTime: store.closingTime || null,
                description: store.description || null,
                storeImages: store.storeImages || null,
                averageRating: store.averageRating || 0,
                createdAt: store.createdAt
                    ? new Date(store.createdAt).toISOString()
                    : null,
            }));
            setStores(mappedStores);
            setPagination({
                ...pagination,
                totalItems: mappedStores.length,
                totalPages: Math.ceil(
                    mappedStores.length / pagination.pageSize
                ),
            });
        } catch (error) {
            console.error("Lỗi API:", error);
            toast.error("Lỗi khi lấy danh sách cửa hàng");
            setStores([]);
        }
    };

    const fetchCities = async () => {
        try {
            const response = await api.get(url.STORE.CITIES);
            setCities(response.data.map((city: any) => city.name));
        } catch (error) {
            toast.error("Lỗi khi lấy danh sách thành phố");
            console.error(error);
        }
    };

    const fetchDistricts = async (city: string) => {
        if (!city) {
            setDistricts([]);
            return;
        }
        try {
            const response = await api.get(url.STORE.DISTRICTS, {
                params: { cityProvince: city },
            });
            setDistricts(response.data.map((district: any) => district.name));
        } catch (error) {
            toast.error("Lỗi khi lấy danh sách quận/huyện");
            console.error(error);
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (name === "cityProvince") {
            fetchDistricts(value);
            setFormData((prev) => ({ ...prev, district: "" }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentStore?.storeId) {
                await api.put(
                    `${url.STORE.UPDATE}/${currentStore.storeId}`,
                    formData
                );
                toast.success("Cập nhật cửa hàng thành công");
            } else {
                await api.post(url.STORE.ADD, formData);
                toast.success("Thêm cửa hàng thành công");
            }
            fetchStores(filterCity, filterDistrict);
            closeModal();
        } catch (error) {
            toast.error(
                isEditing
                    ? "Lỗi khi cập nhật cửa hàng"
                    : "Lỗi khi thêm cửa hàng"
            );
            console.error(error);
        }
    };

    const openModal = (mode: "add" | "edit" | "view", store?: Store) => {
        setIsModalOpen(true);
        setIsEditing(mode === "edit");
        setIsViewing(mode === "view");
        setCurrentStore(store || null);

        if (store && (mode === "edit" || mode === "view")) {
            setFormData({
                storeName: store.storeName,
                phoneNumber: store.phoneNumber,
                cityProvince: store.cityProvince || "",
                district: store.district || "",
                openingTime: store.openingTime || "",
                closingTime: store.closingTime || "",
                description: store.description || "",
                storeImages: store.storeImages || "",
            });
            if (store.cityProvince) {
                fetchDistricts(store.cityProvince);
            }
        } else {
            setFormData({
                storeName: "",
                phoneNumber: "",
                cityProvince: "",
                district: "",
                openingTime: "",
                closingTime: "",
                description: "",
                storeImages: "",
            });
            setDistricts([]);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditing(false);
        setIsViewing(false);
        setCurrentStore(null);
    };

    const handleFilter = () => {
        fetchStores(filterCity, filterDistrict);
    };

    useEffect(() => {
        fetchStores();
        fetchCities();
    }, []);

    return (
        <div>
            <PageBreadcrumb pageTitle="Quản Lý Cửa Hàng" />
            <ComponentCard title="Quản Lý Cửa Hàng">
                <div>
                    {/* Filter Section */}
                    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Ô tìm thành phố */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleFilter();
                            }}
                            className="relative w-full md:max-w-sm"
                        >
                            {/* Icon kính lúp bên trái */}
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Search size={18} />
                            </div>

                            <Input
                                type="text"
                                value={filterCity}
                                onChange={(e) => setFilterCity(e.target.value)}
                                placeholder="Tìm theo thành phố..."
                                className="w-full border border-gray-300 rounded-full py-2 pl-10 pr-10 shadow-sm
             hover:border-blue-500 
             focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-gray-200" // Added dark mode classes
                            />

                            {/* Nút X xoá ở bên phải */}
                            {filterCity && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilterCity("");
                                        fetchStores(); // reset về ban đầu
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                    title="Xoá"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </form>

                        {/* Nút thêm */}
                        <button
                            onClick={() => openModal("add")}
                            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
                        >
                            Thêm cửa hàng mới
                        </button>
                    </div>

                    {/* Store Table */}
                    <div className="bg-white dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800"> {/* Added dark:divide-gray-800 */}
                            <thead className="bg-gray-50 dark:bg-gray-900"> {/* Added dark:bg-gray-900 */}
                                <tr className="dark:bg-gray-900">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"> {/* Adjusted dark:text-gray-300 */}
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"> {/* Adjusted dark:text-gray-300 */}
                                        Tên cửa hàng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"> {/* Adjusted dark:text-gray-300 */}
                                        Thành phố
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"> {/* Adjusted dark:text-gray-300 */}
                                        Quận/Huyện
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"> {/* Adjusted dark:text-gray-300 */}
                                        Hành động
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800"> {/* Added dark:divide-gray-800 */}
                                {stores.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-4 text-center text-gray-500 dark:text-gray-400" // Adjusted dark:text-gray-400
                                        >
                                            Không có dữ liệu
                                        </td>
                                    </tr>
                                ) : (
                                    stores.map((store) => (
                                        <tr
                                            key={store.storeId}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800" // Adjusted dark:hover:bg-gray-800
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100"> {/* Added dark:text-gray-100 */}
                                                {store.storeId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100"> {/* Added dark:text-gray-100 */}
                                                {store.storeName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100"> {/* Added dark:text-gray-100 */}
                                                {store.cityProvince || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100"> {/* Added dark:text-gray-100 */}
                                                {store.district || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap space-x-3">
                                                <button
                                                    onClick={() =>
                                                        openModal("view", store)
                                                    }
                                                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300" // Added dark mode colors
                                                    title="Xem"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        openModal("edit", store)
                                                    }
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" // Added dark mode colors
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

                    {/* Pagination */}
                    <div className="mt-4 flex justify-between items-center">
                        <button
                            onClick={() => handleFilter()}
                            disabled={pagination.currentPage === 1}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600" // Added dark mode classes
                        >
                            Trang trước
                        </button>
                        <span className="text-gray-700 dark:text-gray-200"> {/* Added dark mode class */}
                            Trang {pagination.currentPage} /{" "}
                            {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => handleFilter()}
                            disabled={
                                pagination.currentPage === pagination.totalPages
                            }
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600" // Added dark mode classes
                        >
                            Trang sau
                        </button>
                    </div>

                    {/* Modal */}
                    {isModalOpen && (
                        <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 dark:bg-black/60">
                            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
                                <button
                                    onClick={closeModal}
                                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                                    aria-label="Đóng"
                                >
                                    <X size={22} />
                                </button>
                                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                                    {isViewing
                                        ? "Chi tiết cửa hàng"
                                        : isEditing
                                        ? "Sửa cửa hàng"
                                        : "Thêm cửa hàng"}
                                </h2>
                                {isViewing ? (
                                    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg w-full max-w-screen-xl mx-auto">
                                        <div className="flex flex-col md:flex-row gap-6 w-full">
                                            {/* Cột trái: hình ảnh */}
                                            <div className="md:w-1/3 w-full">
                                                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"> {/* Added dark:text-gray-200 */}
                                                    Hình ảnh
                                                </Label>
                                                {formData.storeImages ? (
                                                    <img
                                                        src={
                                                            formData.storeImages
                                                        }
                                                        alt="Store"
                                                        className="w-full max-h-64 rounded-md object-cover"
                                                    />
                                                ) : (
                                                    <p className="text-gray-900 dark:text-gray-100">
                                                        Không có hình ảnh
                                                    </p>
                                                )}
                                            </div>

                                            {/* Cột phải: thông tin */}
                                            <div className="md:w-2/3 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200"> {/* Added dark:text-gray-200 */}
                                                        Tên cửa hàng
                                                    </Label>
                                                    <p className="mt-1 text-gray-900 dark:text-gray-100">
                                                        {formData.storeName}
                                                    </p>
                                                </div>
                                                <div>
                                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200"> {/* Added dark:text-gray-200 */}
                                                        Số điện thoại
                                                    </Label>
                                                    <p className="mt-1 text-gray-900 dark:text-gray-100">
                                                        {formData.phoneNumber}
                                                    </p>
                                                </div>
                                                <div>
                                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200"> {/* Added dark:text-gray-200 */}
                                                        Thành phố
                                                    </Label>
                                                    <p className="mt-1 text-gray-900 dark:text-gray-100">
                                                        {formData.cityProvince ||
                                                            "N/A"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200"> {/* Added dark:text-gray-200 */}
                                                        Quận/Huyện
                                                    </Label>
                                                    <p className="mt-1 text-gray-900 dark:text-gray-100">
                                                        {formData.district ||
                                                            "N/A"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200"> {/* Added dark:text-gray-200 */}
                                                        Giờ mở cửa
                                                    </Label>
                                                    <p className="mt-1 text-gray-900 dark:text-gray-100">
                                                        {formData.openingTime ||
                                                            "N/A"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200"> {/* Added dark:text-gray-200 */}
                                                        Giờ đóng cửa
                                                    </Label>
                                                    <p className="mt-1 text-gray-900 dark:text-gray-100">
                                                        {formData.closingTime ||
                                                            "N/A"}
                                                    </p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200"> {/* Added dark:text-gray-200 */}
                                                        Mô tả
                                                    </Label>
                                                    <p className="mt-1 text-gray-900 dark:text-gray-100">
                                                        {formData.description ||
                                                            "N/A"}
                                                    </p>
                                                </div>
                                                <div className="md:col-span-2 flex justify-end">
                                                    <button
                                                        onClick={closeModal}
                                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600" // Added dark mode classes
                                                    >
                                                        Đóng
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <form
                                        onSubmit={handleSubmit}
                                        className="w-full grid grid-cols-1 md:grid-cols-3 gap-4"
                                    >
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200"> {/* Added dark:text-gray-200 */}
                                                Tên cửa hàng
                                            </Label>
                                            <input
                                                type="text"
                                                name="storeName"
                                                value={formData.storeName}
                                                onChange={handleInputChange}
                                                required
                                                className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700" // Adjusted dark:text-gray-100, dark:border-gray-700
                                            />
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200"> {/* Added dark:text-gray-200 */}
                                                Số điện thoại
                                            </Label>
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                                required
                                                className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700" // Adjusted dark:text-gray-100, dark:border-gray-700
                                            />
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200"> {/* Added dark:text-gray-200 */}
                                                Thành phố
                                            </Label>
                                            <input
                                                type="text"
                                                name="cityProvince"
                                                value={formData.cityProvince}
                                                onChange={handleInputChange}
                                                required
                                                className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700" // Adjusted dark:text-gray-100, dark:border-gray-700
                                            />
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200"> {/* Added dark:text-gray-200 */}
                                                Quận/Huyện
                                            </Label>
                                            <input
                                                type="text"
                                                name="district"
                                                value={formData.district}
                                                onChange={handleInputChange}
                                                required
                                                className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700" // Adjusted dark:text-gray-100, dark:border-gray-700
                                            />
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200"> {/* Added dark:text-gray-200 */}
                                                Giờ mở cửa
                                            </Label>
                                            <input
                                                type="time"
                                                name="openingTime"
                                                value={formData.openingTime}
                                                onChange={handleInputChange}
                                                className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700" // Adjusted dark:text-gray-100, dark:border-gray-700
                                            />
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200"> {/* Added dark:text-gray-200 */}
                                                Giờ đóng cửa
                                            </Label>
                                            <input
                                                type="time"
                                                name="closingTime"
                                                value={formData.closingTime}
                                                onChange={handleInputChange}
                                                className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700" // Adjusted dark:text-gray-100, dark:border-gray-700
                                            />
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200"> {/* Added dark:text-gray-200 */}
                                                Mô tả
                                            </Label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700" // Adjusted dark:text-gray-100, dark:border-gray-700
                                                rows={4}
                                            />
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200"> {/* Added dark:text-gray-200 */}
                                                URL hình ảnh
                                            </Label>
                                            <input
                                                type="text"
                                                name="storeImages"
                                                value={formData.storeImages}
                                                onChange={handleInputChange}
                                                className="dark:text-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700" // Adjusted dark:text-gray-100, dark:border-gray-700
                                            />
                                        </div>
                                        <div className="col-span-full flex justify-end gap-3 mt-4">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-200 transition dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600" // Added dark mode classes
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