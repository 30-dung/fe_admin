import React, { useState } from "react";

interface WorkScheduleFormData {
  employeeName: string;
  workDate: string;
  shift: string;
  note: string;
}

const WorkScheduleRegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<WorkScheduleFormData>({
    employeeName: "",
    workDate: "",
    shift: "",
    note: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Xử lý gửi dữ liệu ở đây (gọi API hoặc lưu vào state)
    setSubmitted(true);
  };

  return (
    <form
      className="max-w-md mx-auto bg-white p-6 rounded shadow"
      onSubmit={handleSubmit}
    >
      <h2 className="text-xl font-bold mb-4">Đăng ký lịch làm việc</h2>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Tên nhân viên</label>
        <input
          type="text"
          name="employeeName"
          value={formData.employeeName}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Ngày làm việc</label>
        <input
          type="date"
          name="workDate"
          value={formData.workDate}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Ca làm</label>
        <select
          name="shift"
          value={formData.shift}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        >
          <option value="">-- Chọn ca --</option>
          <option value="morning">Sáng</option>
          <option value="afternoon">Chiều</option>
          <option value="evening">Tối</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Ghi chú</label>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          rows={3}
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Đăng ký
      </button>
      {submitted && (
        <div className="mt-4 text-green-600 font-medium">
          Đăng ký thành công!
        </div>
      )}
    </form>
  );
};

export default WorkScheduleRegistrationForm;