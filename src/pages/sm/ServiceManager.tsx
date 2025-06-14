import React, { useEffect, useState } from "react";
import axios from "service/api";
import url from "service/url";

export default function ServiceManager() {
  interface Service {
    serviceId: string;
    serviceName: string;
    description: string;
    durationMinutes: number | string;
    serviceImg?: string;
  }
  const [services, setServices] = useState<Service[]>([]);
  const [modal, setModal] = useState<{ type: 'add' | 'edit' | 'detail' | null; data: any }>(
    { type: null, data: null }
  ); // type: 'add' | 'edit' | 'detail'
  const [form, setForm] = useState({
    serviceName: "",
    description: "",
    durationMinutes: "",
    serviceImg: "",
  });
  const [message, setMessage] = useState("");

  // Lấy danh sách dịch vụ
  const fetchServices = async () => {
    try {
      const res = await axios.get(url.SERVICE.GET_ALL);
      setServices(res.data);
    } catch {
      setMessage("Không thể tải danh sách dịch vụ");
    }
  };

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line
  }, []);

  // Mở modal thêm mới
  const openAddModal = () => {
    setForm({
      serviceName: "",
      description: "",
      durationMinutes: "",
      serviceImg: "",
    });
    setMessage("");
    setModal({ type: "add", data: null });
  };

  // Mở modal sửa
  interface Service {
    serviceId: string;
    serviceName: string;
    description: string;
    durationMinutes: number | string;
    serviceImg?: string;
  }

  interface ModalState {
    type: 'add' | 'edit' | 'detail' | null;
    data: Service | null;
  }

  const openEditModal = (service: Service) => {
    setForm({
      serviceName: service.serviceName,
      description: service.description,
      durationMinutes: String(service.durationMinutes),
      serviceImg: service.serviceImg || "",
    });
    setMessage("");
    setModal({ type: "edit", data: service });
  };

  // Mở modal xem chi tiết
  interface ServiceDetail {
    serviceId: string;
    serviceName: string;
    description: string;
    durationMinutes: number;
    serviceImg?: string;
  }

  const openDetailModal = async (id: string) => {
    try {
      const res = await axios.get<ServiceDetail>(url.SERVICE.GET_BY_ID.replace("${id}", id));
      setModal({ type: "detail", data: res.data });
    } catch {
      setMessage("Không thể lấy chi tiết dịch vụ");
    }
  };

  // Đóng modal
  const closeModal = () => {
    setModal({ type: null, data: null });
    setMessage("");
  };

  // Xử lý thay đổi form
  interface FormState {
    serviceName: string;
    description: string;
    durationMinutes: string;
    serviceImg: string;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Thêm mới dịch vụ
  interface AddEvent {
    preventDefault: () => void;
  }

  interface CreateServiceRequest {
    serviceName: string;
    description: string;
    durationMinutes: string;
    serviceImg: string;
  }

  const handleAdd = async (e: AddEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      await axios.post<CreateServiceRequest>(url.SERVICE.CREATE, form);
      setMessage("Tạo dịch vụ thành công!");
      closeModal();
      fetchServices();
    } catch {
      setMessage("Tạo dịch vụ thất bại!");
    }
  };

  // Cập nhật dịch vụ
  interface UpdateEvent {
    preventDefault: () => void;
  }

  interface UpdateServiceRequest {
    serviceName: string;
    description: string;
    durationMinutes: string;
    serviceImg: string;
  }

  const handleUpdate = async (e: UpdateEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      await axios.put<UpdateServiceRequest>(
        url.SERVICE.UPDATE.replace("${id}", (modal.data as Service).serviceId),
        form
      );
      setMessage("Cập nhật thành công!");
      closeModal();
      fetchServices();
    } catch {
      setMessage("Cập nhật thất bại!");
    }
  };

  // Xóa dịch vụ
  interface DeleteEvent {
    (id: string): Promise<void>;
  }

  const handleDelete: DeleteEvent = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa dịch vụ này?")) return;
    try {
      await axios.delete(url.SERVICE.DELETE.replace("${id}", id));
      fetchServices();
    } catch {
      setMessage("Xóa thất bại!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Danh sách dịch vụ</h2>
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={openAddModal}
        >
          Thêm dịch vụ
        </button>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Tên dịch vụ</th>
              <th className="py-2">Mô tả</th>
              <th className="py-2">Thời lượng</th>
              <th className="py-2">Ảnh</th>
              <th className="py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.serviceId} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-2">{s.serviceName}</td>
                <td className="py-2">{s.description}</td>
                <td className="py-2">{s.durationMinutes} phút</td>
                <td className="py-2">
                  {s.serviceImg && (
                    <img src={s.serviceImg} alt="" className="w-16 h-10 object-cover rounded" />
                  )}
                </td>
                <td className="py-2 flex gap-2">
                  <button
                    className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => openDetailModal(s.serviceId)}
                  >
                    Xem
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                    onClick={() => openEditModal(s)}
                  >
                    Sửa
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                    onClick={() => handleDelete(s.serviceId)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  Không có dịch vụ nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm/Sửa */}
      {(modal.type === "add" || modal.type === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
              aria-label="Đóng"
              type="button"
            >
              &#10005;
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              {modal.type === "add" ? "Thêm dịch vụ" : "Cập nhật dịch vụ"}
            </h2>
            <form className="space-y-4" onSubmit={modal.type === "add" ? handleAdd : handleUpdate}>
              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-200">Tên dịch vụ</label>
                <input
                  type="text"
                  name="serviceName"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={form.serviceName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-200">Mô tả</label>
                <textarea
                  name="description"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-200">Thời lượng (phút)</label>
                <input
                  type="number"
                  name="durationMinutes"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={form.durationMinutes}
                  onChange={handleChange}
                  required
                  min={1}
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-200">Ảnh dịch vụ (URL)</label>
                <input
                  type="text"
                  name="serviceImg"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={form.serviceImg}
                  onChange={handleChange}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  {modal.type === "add" ? "Thêm" : "Cập nhật"}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-600"
                  onClick={closeModal}
                >
                  Hủy
                </button>
              </div>
              {message && (
                <div className="mt-2 text-center text-red-500 dark:text-red-400">{message}</div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal xem chi tiết */}
      {modal.type === "detail" && modal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
              aria-label="Đóng"
              type="button"
            >
              &#10005;
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Chi tiết dịch vụ
            </h2>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Tên dịch vụ:</span> {modal.data.serviceName}
              </div>
              <div>
                <span className="font-semibold">Mô tả:</span> {modal.data.description}
              </div>
              <div>
                <span className="font-semibold">Thời lượng:</span> {modal.data.durationMinutes} phút
              </div>
              {modal.data.serviceImg && (
                <div>
                  <span className="font-semibold">Ảnh:</span>
                  <img src={modal.data.serviceImg} alt="" className="w-32 h-20 object-cover rounded mt-1" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}