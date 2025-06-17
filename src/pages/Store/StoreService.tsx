import axios from "service/api";
import url from "service/url";
import React, { useEffect, useState } from "react";

interface Store {
    storeId: number;
    storeName: string;
}

interface ServiceEntity {
    serviceId: number;
    serviceName: string;
    description: string;
    durationMinutes: number;
    serviceImg: string;
}

interface StoreServiceRequest {
    storeId: number;
    serviceId: number;
    price: number;
}

interface StoreService {
    storeServiceId: number;
    service: ServiceEntity;
    price: number;
}

function StoreService() {
    const [stores, setStores] = useState<Store[]>([]);
    const [services, setServices] = useState<ServiceEntity[]>([]);
    const [storeServices, setStoreServices] = useState<StoreService[]>([]);

    const [selectedStore, setSelectedStore] = useState<number>();
    const [selectedService, setSelectedService] = useState<number>();
    const [price, setPrice] = useState<number>();

    // Lấy danh sách cửa hàng và dịch vụ
    useEffect(() => {
        axios.get(url.STORE.ALL).then((res) => setStores(res.data));
        axios.get(url.SERVICE.GET_ALL).then((res) => setServices(res.data));
    }, []);

    // Lấy danh sách dịch vụ của cửa hàng khi chọn cửa hàng
    useEffect(() => {
        if (selectedStore) {
            const endpoint = `${url.STORE_SERVICE.GET_BY_STORE}/${selectedStore}`;
            axios.get(endpoint).then((res) => setStoreServices(res.data));
        }
    }, [selectedStore]);

    // Tạo StoreService mới
    const handleCreate = () => {
        if (!selectedStore || !selectedService || !price) return;
        const request: StoreServiceRequest = {
            storeId: selectedStore,
            serviceId: selectedService,
            price: price,
        };
        axios.post("/store-service/price", request).then(() => {
            alert("Created!");
            if (selectedStore) {
                const endpoint = `${url.STORE_SERVICE.GET_BY_STORE}/${selectedStore}`;
                axios.get(endpoint).then((res) => setStoreServices(res.data));
            }
        });
    };

    // Cập nhật giá dịch vụ
    const handlePriceUpdate = (storeServiceId: number, newPrice: number) => {
        axios
            .put(`/api/store-services/${storeServiceId}/price`, {
                price: newPrice,
            })
            .then(() => {
                alert("Updated!");
                if (selectedStore) {
                    const endpoint = `${url.STORE_SERVICE.GET_BY_STORE}/${selectedStore}`;
                    axios
                        .get(endpoint)
                        .then((res) => setStoreServices(res.data));
                }
            });
    };

    return (
        <div className="grid gap-4 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
                <div className="grid gap-4">
                    <div>
                        <label className="block mb-1 text-gray-700 dark:text-gray-200">
                            Chọn cửa hàng
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            onChange={(e) =>
                                setSelectedStore(Number(e.target.value))
                            }
                            value={selectedStore || ""}
                        >
                            <option value="">-- Chọn cửa hàng --</option>
                            {stores.map((store) => (
                                <option
                                    key={store.storeId}
                                    value={store.storeId}
                                >
                                    {store.storeName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block mb-1 text-gray-700 dark:text-gray-200">
                            Chọn dịch vụ
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            onChange={(e) =>
                                setSelectedService(Number(e.target.value))
                            }
                            value={selectedService || ""}
                        >
                            <option value="">-- Chọn dịch vụ --</option>
                            {services.map((service) => (
                                <option
                                    key={service.serviceId}
                                    value={service.serviceId}
                                >
                                    {service.serviceName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block mb-1 text-gray-700 dark:text-gray-200">
                            Giá
                        </label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            onChange={(e) => setPrice(Number(e.target.value))}
                            value={price || ""}
                        />
                    </div>

                    <button
                        type="button"
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                        onClick={handleCreate}
                    >
                        Tạo
                    </button>
                </div>
            </div>

            {storeServices.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
                    <div className="grid gap-2">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                            Dịch vụ đã có tại cửa hàng
                        </h3>
                        {storeServices.map((ss) => (
                            <div
                                key={ss.storeServiceId}
                                className="flex items-center justify-between gap-2"
                            >
                                <div>
                                    <div className="font-semibold text-gray-800 dark:text-gray-100">
                                        {ss.service.serviceName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Giá hiện tại: {ss.price}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Giá mới"
                                        className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        onBlur={(e) =>
                                            handlePriceUpdate(
                                                ss.storeServiceId,
                                                Number(e.target.value)
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default StoreService;
