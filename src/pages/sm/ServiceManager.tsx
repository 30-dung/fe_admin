import {
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import React, { useEffect, useState } from "react";
import axios from "service/api";
import url from "service/url";
import { toast, ToastContainer } from "react-toastify";
import { X } from "lucide-react";

export default function ServiceManager() {
    // Interfaces (Giữ nguyên)
    interface Service {
        serviceId: number;
        serviceName: string;
        description: string;
        durationMinutes: number;
        serviceImg?: string;
    }

    interface Store {
        storeId: number;
        storeName: string;
        storeImage?: string;
    }

    interface StoreService {
        storeServiceId: number;
        store: Store;
        service: Service;
        price: number;
    }

    interface ServiceWithPrices extends Service {
        storeServices: StoreService[];
    }

    interface CreateServiceFormState {
        serviceName: string;
        description: string;
        durationMinutes: string;
        serviceImg: string;
    }

    interface AddPriceFormState {
        serviceId: number | null;
        storeId: number | null;
        price: number;
    }

    // States (Giữ nguyên)
    const [services, setServices] = useState<ServiceWithPrices[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [allStoreServices, setAllStoreServices] = useState<StoreService[]>([]);

    const [modal, setModal] = useState<{
        type: "addService" | "editService" | "detailService" | "addPriceToExistingService" | "editStoreServicePrice" | null;
        data: any;
    }>({ type: null, data: null });

    const [createServiceForm, setCreateServiceForm] = useState<CreateServiceFormState>({
        serviceName: "",
        description: "",
        durationMinutes: "",
        serviceImg: "",
    });

    const [addPriceForm, setAddPriceForm] = useState<AddPriceFormState>({
        serviceId: null,
        storeId: null,
        price: 0,
    });

    const [editPriceForm, setEditPriceForm] = useState<{
        storeServiceId: number | null;
        price: number;
    }>({ storeServiceId: null, price: 0 });


    const [confirmDelete, setConfirmDelete] = useState<{
        open: boolean;
        id: number | null;
    }>({ open: false, id: null });

    // --- Fetching Data --- (Giữ nguyên)
    const fetchServicesAndPrices = async () => {
        try {
            const [servicesRes, storeServicesRes] = await Promise.all([
                axios.get<Service[]>(url.SERVICE.GET_ALL),
                axios.get<StoreService[]>(url.STORE_SERVICE.GET_ALL)
            ]);

            const fetchedServices: Service[] = servicesRes.data;
            const fetchedStoreServices: StoreService[] = storeServicesRes.data;
            setAllStoreServices(fetchedStoreServices);

            const servicesWithPrices: ServiceWithPrices[] = fetchedServices.map(service => {
                const relatedStoreServices = fetchedStoreServices.filter(ss => ss.service.serviceId === service.serviceId);
                return {
                    ...service,
                    storeServices: relatedStoreServices,
                };
            });
            setServices(servicesWithPrices);
        } catch (error: any) {
            toast.error(`Không thể tải dữ liệu: ${error.message}`);
        }
    };

    const fetchStores = async () => {
        try {
            const res = await axios.get<Store[]>(url.STORE.ALL);
            setStores(res.data);
        } catch (error: any) {
            toast.error(`Không thể tải danh sách cửa hàng: ${error.message}`);
        }
    };

    useEffect(() => {
        fetchServicesAndPrices();
        fetchStores();
    }, []);

    // --- Modal Handlers --- (Giữ nguyên)
    const openAddServiceModal = () => {
        setCreateServiceForm({
            serviceName: "",
            description: "",
            durationMinutes: "",
            serviceImg: "",
        });
        setModal({ type: "addService", data: null });
    };

    const openEditServiceModal = (service: Service) => {
        setCreateServiceForm({
            serviceName: service.serviceName,
            description: service.description,
            durationMinutes: String(service.durationMinutes),
            serviceImg: service.serviceImg || "",
        });
        setModal({ type: "editService", data: service });
    };

    const openDetailServiceModal = async (id: number) => {
        try {
            const serviceRes = await axios.get<Service>(
                url.SERVICE.GET_BY_ID.replace("${id}", String(id))
            );
            const serviceDetails = serviceRes.data;

            const relatedStoreServices = allStoreServices.filter(ss => ss.service.serviceId === id);

            setModal({ type: "detailService", data: { ...serviceDetails, storeServices: relatedStoreServices } });
        } catch (error: any) {
            toast.error(`Không thể lấy chi tiết dịch vụ: ${error.message}`);
        }
    };

    const openAddPriceModal = (serviceId: number | null = null) => {
        setAddPriceForm({
            serviceId: serviceId,
            storeId: null,
            price: 0,
        });
        setModal({ type: "addPriceToExistingService", data: serviceId });
    };

    const openEditStoreServicePriceModal = (storeService: StoreService) => {
        setEditPriceForm({
            storeServiceId: storeService.storeServiceId,
            price: storeService.price,
        });
        setModal({ type: "editStoreServicePrice", data: storeService });
    };

    const closeModal = () => {
        setModal({ type: null, data: null });
    };

    // --- Form Change Handlers --- (Giữ nguyên)
    const handleCreateServiceFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setCreateServiceForm({ ...createServiceForm, [e.target.name]: e.target.value });
    };

    const handleAddPriceFormChange = (
        e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
    ) => {
        const { name, value } = e.target;
        setAddPriceForm(prev => ({
            ...prev,
            [name]: name === "price" || name === "serviceId" || name === "storeId"
                ? (value === "" ? (name === "serviceId" || name === "storeId" ? null : 0) : parseFloat(value))
                : value,
        }));
    };

    const handleEditPriceFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditPriceForm(prev => ({
            ...prev,
            [name]: parseFloat(value),
        }));
    };

    // --- CRUD Operations --- (Giữ nguyên)
    const handleAddService = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const serviceData = {
                serviceName: createServiceForm.serviceName,
                description: createServiceForm.description,
                durationMinutes: Number(createServiceForm.durationMinutes),
                serviceImg: createServiceForm.serviceImg,
            };
            const res = await axios.post<Service>(url.SERVICE.CREATE, serviceData);
            toast.success("Tạo dịch vụ thành công!");
            closeModal();
            fetchServicesAndPrices();

            openAddPriceModal(res.data.serviceId);

        } catch (error: any) {
            toast.error(`Tạo dịch vụ thất bại! ${error.message}`);
        }
    };

    const handleUpdateService = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const serviceToUpdate = modal.data as Service;
            if (!serviceToUpdate || serviceToUpdate.serviceId === undefined) {
                toast.error("Không tìm thấy dịch vụ để cập nhật.");
                return;
            }

            const serviceData = {
                serviceName: createServiceForm.serviceName,
                description: createServiceForm.description,
                durationMinutes: Number(createServiceForm.durationMinutes),
                serviceImg: createServiceForm.serviceImg,
            };
            await axios.put(
                url.SERVICE.UPDATE.replace(
                    "${id}",
                    String(serviceToUpdate.serviceId)
                ),
                serviceData
            );
            toast.success("Cập nhật dịch vụ thành công!");
            closeModal();
            fetchServicesAndPrices();
        } catch (error: any) {
            toast.error(`Cập nhật dịch vụ thất bại! ${error.message}`);
        }
    };

    const handleAddPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (addPriceForm.serviceId === null || addPriceForm.storeId === null || addPriceForm.price <= 0) {
                toast.error("Vui lòng chọn dịch vụ, cửa hàng và nhập giá hợp lệ.");
                return;
            }
            await axios.post(url.STORE_SERVICE.CREATE_PRICE, addPriceForm);
            toast.success("Thêm giá dịch vụ thành công!");
            closeModal();
            fetchServicesAndPrices();
        } catch (error: any) {
            let errorMessage = "Thêm giá dịch vụ thất bại! ";
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage += error.response.data.message;
            } else {
                errorMessage += error.message;
            }
            toast.error(errorMessage);
        }
    };

    const handleUpdateStoreServicePrice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editPriceForm.storeServiceId === null || editPriceForm.price <= 0) {
                toast.error("Giá không hợp lệ.");
                return;
            }

            const currentStoreService = allStoreServices.find(ss => ss.storeServiceId === editPriceForm.storeServiceId);
            if (!currentStoreService) {
                toast.error("Không tìm thấy thông tin giá dịch vụ để cập nhật.");
                return;
            }

            const updateData = {
                serviceId: currentStoreService.service.serviceId,
                storeId: currentStoreService.store.storeId,
                price: editPriceForm.price,
            };

            await axios.put(url.STORE_SERVICE.UPDATE.replace("${id}", String(editPriceForm.storeServiceId)), updateData);
            toast.success("Cập nhật giá dịch vụ thành công!");
            closeModal();
            fetchServicesAndPrices();
        } catch (error: any) {
            let errorMessage = "Cập nhật giá dịch vụ thất bại! ";
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage += error.response.data.message;
            } else {
                errorMessage += error.message;
            }
            toast.error(errorMessage);
        }
    };


    const handleDeleteStoreService = async (storeServiceId: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa liên kết giá này?")) {
            return;
        }
        try {
            await axios.delete(url.STORE_SERVICE.DELETE.replace("${id}", String(storeServiceId)));
            toast.success("Xóa giá dịch vụ thành công!");
            fetchServicesAndPrices();
            if (modal.type === "detailService") {
                const updatedServiceDetails = {
                    ...modal.data,
                    storeServices: modal.data.storeServices.filter((ss: StoreService) => ss.storeServiceId !== storeServiceId)
                };
                setModal({ type: "detailService", data: updatedServiceDetails });
            }
        } catch (error: any) {
            toast.error(`Xóa giá dịch vụ thất bại! ${error.message}`);
        }
    };

    const askDeleteService = (id: number) => {
        setConfirmDelete({ open: true, id: id });
    };

    const handleConfirmDeleteService = async () => {
        if (confirmDelete.id === null) return;
        try {
            const relatedStoreServices = allStoreServices.filter(ss => ss.service.serviceId === confirmDelete.id);
            for (const ss of relatedStoreServices) {
                await axios.delete(url.STORE_SERVICE.DELETE.replace("${id}", String(ss.storeServiceId)));
            }

            await axios.delete(
                url.SERVICE.DELETE.replace("${id}", String(confirmDelete.id))
            );
            toast.success("Xóa dịch vụ và tất cả giá liên quan thành công!");
            fetchServicesAndPrices();
            setConfirmDelete({ open: false, id: null });
        } catch (error: any) {
            toast.error(`Xóa thất bại! ${error.message}`);
            setConfirmDelete({ open: false, id: null });
        }
    };

    return (
        <div>
            <PageBreadcrumb pageTitle="Quản lý dịch vụ" />

            <div className="mx-auto mt-8 p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Danh sách dịch vụ
                    </h2>
                    <div className="flex gap-2">
                        <button
                            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                            onClick={openAddServiceModal}
                        >
                            Thêm dịch vụ mới
                        </button>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <table className="min-w-full text-left table-fixed divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="w-[30%] py-2 px-4 text-gray-500 dark:text-gray-300">Tên dịch vụ</th>
                                <th className="w-[30%] py-2 px-4 text-gray-500 dark:text-gray-300">Mô tả</th>
                                <th className="w-[30%] py-2 px-4 text-gray-500 dark:text-gray-300">Thời lượng</th>
                                <th className="w-[30%] py-2 px-4 text-gray-500 dark:text-gray-300">Ảnh</th>
                                <th className="w-[15%] py-2 px-4 text-gray-500 dark:text-gray-300">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                            {services.map((s) => (
                                <tr
                                    key={s.serviceId}
                                    className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <td className="py-2 px-4 dark:text-gray-100 overflow-hidden text-ellipsis">{s.serviceName}</td>
                                    <td className="py-2 px-4 dark:text-gray-100 overflow-hidden text-ellipsis">{s.description}</td>
                                    <td className="py-2 px-4 dark:text-gray-100">{s.durationMinutes} phút</td>
                                    <td className="py-2 px-4">
                                        {s.serviceImg && (
                                            <img
                                                src={s.serviceImg}
                                                alt=""
                                                className="w-16 h-10 object-cover rounded"
                                            />
                                        )}
                                    </td>
                                    <td className="py-2 px-4 flex gap-2 items-center">
                                        <button
                                            className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
                                            title="Xem chi tiết (bao gồm giá)"
                                            onClick={() =>
                                                openDetailServiceModal(s.serviceId)
                                            }
                                        >
                                            <EyeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </button>
                                        <button
                                            className="p-2 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900"
                                            title="Sửa dịch vụ"
                                            onClick={() => openEditServiceModal(s)}
                                        >
                                            <PencilSquareIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                                        </button>
                                        <button
                                            className="p-2 rounded hover:bg-green-100 dark:hover:bg-green-900"
                                            title="Thêm/Quản lý giá cho dịch vụ này"
                                            onClick={() => openAddPriceModal(s.serviceId)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-600 dark:text-green-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                        </button>
                                        <button
                                            className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900"
                                            title="Xóa dịch vụ này và tất cả giá liên quan"
                                            onClick={() =>
                                                askDeleteService(s.serviceId)
                                            }
                                        >
                                            <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {services.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="text-center py-4 text-gray-500 dark:text-gray-400"
                                    >
                                        Không có dịch vụ nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal Thêm Dịch vụ mới (Giữ nguyên) */}
                {modal.type === "addService" && (
                    <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 dark:bg-black/60">
                        <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <button
                                onClick={closeModal}
                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                                aria-label="Đóng"
                                type="button"
                            >
                                <X size={22} />
                            </button>
                            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                                Thêm dịch vụ mới
                            </h2>
                            <form className="space-y-4" onSubmit={handleAddService}>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-200">
                                        Tên dịch vụ
                                    </label>
                                    <input
                                        type="text"
                                        name="serviceName"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        value={createServiceForm.serviceName}
                                        onChange={handleCreateServiceFormChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-200">
                                        Mô tả
                                    </label>
                                    <textarea
                                        name="description"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        value={createServiceForm.description}
                                        onChange={handleCreateServiceFormChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-200">
                                        Thời lượng (phút)
                                    </label>
                                    <input
                                        type="number"
                                        name="durationMinutes"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        value={createServiceForm.durationMinutes}
                                        onChange={handleCreateServiceFormChange}
                                        required
                                        min={1}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-200">
                                        Ảnh dịch vụ (URL)
                                    </label>
                                    <input
                                        type="text"
                                        name="serviceImg"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        value={createServiceForm.serviceImg}
                                        onChange={handleCreateServiceFormChange}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Thêm
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-600"
                                        onClick={closeModal}
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Sửa Dịch vụ (Giữ nguyên) */}
                {modal.type === "editService" && (
                    <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 dark:bg-black/60">
                        <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <button
                                onClick={closeModal}
                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                                aria-label="Đóng"
                                type="button"
                            >
                                <X size={22} />
                            </button>
                            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                                Cập nhật dịch vụ
                            </h2>
                            <form className="space-y-4" onSubmit={handleUpdateService}>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-200">
                                        Tên dịch vụ
                                    </label>
                                    <input
                                        type="text"
                                        name="serviceName"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        value={createServiceForm.serviceName}
                                        onChange={handleCreateServiceFormChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-200">
                                        Mô tả
                                    </label>
                                    <textarea
                                        name="description"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        value={createServiceForm.description}
                                        onChange={handleCreateServiceFormChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-200">
                                        Thời lượng (phút)
                                    </label>
                                    <input
                                        type="number"
                                        name="durationMinutes"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        value={createServiceForm.durationMinutes}
                                        onChange={handleCreateServiceFormChange}
                                        required
                                        min={1}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-200">
                                        Ảnh dịch vụ (URL)
                                    </label>
                                    <input
                                        type="text"
                                        name="serviceImg"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        value={createServiceForm.serviceImg}
                                        onChange={handleCreateServiceFormChange}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Cập nhật
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-600"
                                        onClick={closeModal}
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Thêm giá cho dịch vụ đã có (Giữ nguyên) */}
                {modal.type === "addPriceToExistingService" && (
                    <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 dark:bg-black/60">
                        <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <button
                                onClick={closeModal}
                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                                aria-label="Đóng"
                                type="button"
                            >
                                <X size={22} />
                            </button>
                            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                                Thêm giá cho dịch vụ tại cửa hàng
                            </h2>
                            <form className="space-y-4" onSubmit={handleAddPrice}>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-200">
                                        Chọn dịch vụ
                                    </label>
                                    <select
                                        name="serviceId"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        value={addPriceForm.serviceId || ""}
                                        onChange={handleAddPriceFormChange}
                                        required
                                        disabled={modal.data !== null}
                                    >
                                        <option value="">-- Chọn dịch vụ --</option>
                                        {services.map((service) => (
                                            <option key={service.serviceId} value={service.serviceId}>
                                                {service.serviceName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-200">
                                        Chọn cửa hàng
                                    </label>
                                    <select
                                        name="storeId"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        value={addPriceForm.storeId || ""}
                                        onChange={handleAddPriceFormChange}
                                        required
                                    >
                                        <option value="">-- Chọn cửa hàng --</option>
                                        {stores.map((store) => (
                                            <option key={store.storeId} value={store.storeId}>
                                                {store.storeName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-200">
                                        Giá tiền (VNĐ)
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        value={addPriceForm.price}
                                        onChange={handleAddPriceFormChange}
                                        required
                                        min={0}
                                        step="1000"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                                    >
                                        Thêm giá
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-600"
                                        onClick={closeModal}
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal xem chi tiết dịch vụ */}
            {modal.type === "detailService" && modal.data && (
                <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 dark:bg-black/60">
                    {/* Thiết lập kích thước cố định cho modal để giữ form */}
                    <div className="relative w-full max-w-4xl h-[70vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
                        <button
                            onClick={closeModal}
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                            aria-label="Đóng"
                            type="button"
                        >
                            <X size={22} />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                            Chi tiết dịch vụ
                        </h2>
                        {/* Container cho 2 cột chính: ảnh + thông tin & danh sách giá */}
                        <div className="flex flex-grow overflow-hidden gap-6">
                            {/* Cột bên trái: Ảnh và thông tin dịch vụ */}
                            <div className="w-1/2 flex flex-col pr-4 border-r border-gray-200 dark:border-gray-700">
                                {/* Ảnh dịch vụ - đặt trong một div với chiều cao cố định */}
                                <div className="flex-shrink-0 mb-4 flex justify-center items-center h-48 w-full bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    {modal.data.serviceImg ? (
                                        <img
                                            src={modal.data.serviceImg}
                                            alt={modal.data.serviceName}
                                            className="max-w-full max-h-full object-contain rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                            Không có ảnh
                                        </div>
                                    )}
                                </div>

                                {/* Thông tin dịch vụ dưới ảnh */}
                                <div className="space-y-3 text-gray-700 dark:text-gray-200 flex-grow mt-4">
                                    <div>
                                        <span className="font-semibold text-gray-800 dark:text-gray-100">
                                            Tên dịch vụ:
                                        </span>{" "}
                                        <p className="inline-block">{modal.data.serviceName}</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 dark:text-gray-100">
                                            Mô tả:
                                        </span>{" "}
                                        <p className="inline-block">{modal.data.description}</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 dark:text-gray-100">
                                            Thời lượng:
                                        </span>{" "}
                                        <p className="inline-block">{modal.data.durationMinutes} phút</p>
                                    </div>
                                </div>
                            </div>

                            {/* Cột bên phải: Danh sách giá tại các cửa hàng */}
                            <div className="w-1/2 flex flex-col">
                                <span className="font-semibold text-gray-800 dark:text-gray-100 block mb-3">
                                    Giá tại các cửa hàng:
                                </span>
                               
                                <div className="flex-grow relative custom-scrollbar scroll-fade-container-detail pb-4">
                                    {modal.data.storeServices && modal.data.storeServices.length > 0 ? (
                                        <ul className="space-y-4">
                                            {modal.data.storeServices.map((ss: StoreService) => (
                                                <li key={ss.storeServiceId} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                                                    <div className="flex items-center gap-3">
                                                        {ss.store.storeImage && (
                                                            <img
                                                                src={ss.store.storeImage}
                                                                alt={ss.store.storeName}
                                                                className="w-12 h-12 object-cover rounded-full shadow"
                                                            />
                                                        )}
                                                        <div>
                                                            <span className="font-medium text-gray-900 dark:text-gray-100">{ss.store.storeName}</span>
                                                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                                                Giá: {ss.price.toLocaleString('vi-VN')} VNĐ
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        <button
                                                            className="p-1 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900"
                                                            title="Sửa giá"
                                                            onClick={() => openEditStoreServicePriceModal(ss)}
                                                        >
                                                            <PencilSquareIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                                                        </button>
                                                        <button
                                                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
                                                            title="Xóa giá này"
                                                            onClick={() => handleDeleteStoreService(ss.storeServiceId)}
                                                        >
                                                            <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có giá nào được thiết lập cho dịch vụ này tại các cửa hàng.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            

                {/* Modal Sửa giá của StoreService (Giữ nguyên) */}
                {modal.type === "editStoreServicePrice" && modal.data && (
                    <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 dark:bg-black/60">
                        <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <button
                                onClick={closeModal}
                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                                aria-label="Đóng"
                                type="button"
                            >
                                <X size={22} />
                            </button>
                            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                                Sửa giá dịch vụ tại cửa hàng
                            </h2>
                            <form className="space-y-4" onSubmit={handleUpdateStoreServicePrice}>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-200">
                                        Dịch vụ
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        value={modal.data.service.serviceName}
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-200">
                                        Cửa hàng
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        value={modal.data.store.storeName}
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-200">
                                        Giá tiền (VNĐ)
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        value={editPriceForm.price}
                                        onChange={handleEditPriceFormChange}
                                        required
                                        min={0}
                                        step="1000"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Cập nhật giá
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-600"
                                        onClick={closeModal}
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}


                {/* Modal xác nhận xóa dịch vụ (Giữ nguyên) */}
                {confirmDelete.open && (
                    <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 dark:bg-black/60">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full">
                            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">
                                Xác nhận xóa
                            </h3>
                            <p className="mb-6 text-gray-700 dark:text-gray-200">
                                Bạn có chắc chắn muốn xóa dịch vụ này không? Điều này cũng sẽ xóa tất cả các giá liên quan của dịch vụ tại các cửa hàng. Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex justify-end gap-2">
                                <button
                                    className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-600"
                                    onClick={() =>
                                        setConfirmDelete({
                                            open: false,
                                            id: null,
                                        })
                                    }
                                >
                                    Hủy
                                </button>
                                <button
                                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                                    onClick={handleConfirmDeleteService}
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}