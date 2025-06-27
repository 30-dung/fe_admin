import { useEffect, useState, FormEvent } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import axios from "../../service/api";
import url from "../../service/url";
import { toast, ToastContainer } from "react-toastify"; // Import ToastContainer và toast

interface Employee {
  fullName?: string;
  avatarUrl?: string; // Sẽ là đường dẫn tương đối từ backend
  dateOfBirth?: string;
  email?: string;
  employeeCode?: string;
  gender?: string;
  phoneNumber?: string;
  specialization?: string;
  storeId?: string; // Giả định là string
  store?: {
    id: string; // Giả định là string
    storeName?: string;
  };
}

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Employee>({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // NEW STATES for avatar image handling
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // Để hiển thị ảnh preview hoặc ảnh cũ

  // Format date to "DD/MM/YYYY" for display
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return "";
    try {
      let datePart = dateStr;
      if (dateStr.includes("/")) {
        const [day, month, year] = dateStr.split("/");
        datePart = `${year}-${month}-${day}`;
      } else if (dateStr.includes("T")) {
        datePart = dateStr.split("T")[0];
      }
      const date = new Date(datePart);
      if (isNaN(date.getTime())) throw new Error("Invalid date");
      return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Format date to "YYYY-MM-DD" for input value
  const formatDateForInput = (dateStr: string | undefined): string => {
    if (!dateStr) return "";
    try {
      let datePart = dateStr;
      if (dateStr.includes("/")) {
        const [day, month, year] = dateStr.split("/");
        datePart = `${year}-${month}-${day}`;
      } else if (dateStr.includes("T")) {
        datePart = dateStr.split("T")[0];
      }
      const date = new Date(datePart);
      if (isNaN(date.getTime())) throw new Error("Invalid date");
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    } catch (error) {
      console.error("Error formatting date for input:", error);
      return "";
    }
  };

  // Fetch employee data
  useEffect(() => {
    axios
      .get(url.EMPLOYEE.PROFILE, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      })
      .then((res) => {
        setEmployee(res.data);
        setFormData(res.data);
        // Khi tải dữ liệu về, set avatarPreview cho ảnh hiện tại
        if (res.data.avatarUrl) {
          // Xử lý cả URL tuyệt đối (http/https) và tương đối (/)
          setAvatarPreview(res.data.avatarUrl.startsWith('http') ? res.data.avatarUrl : `http://localhost:9090${res.data.avatarUrl}`);
        } else {
          setAvatarPreview("/images/user/owner.jpg"); // Ảnh mặc định nếu không có avatar
        }
        console.log("Employee data:", res.data);
      })
      .catch((error) => {
        console.error("Error fetching employee data:", error);
        // Đảm bảo avatarUrl mặc định được xử lý đúng
        setEmployee({
          fullName: "",
          avatarUrl: "/images/user/owner.jpg",
          dateOfBirth: "",
          email: "",
          employeeCode: "",
          gender: "",
          phoneNumber: "",
          specialization: "",
          storeId: "",
        });
        setFormData({
          fullName: "",
          email: "",
          employeeCode: "",
          gender: "",
          phoneNumber: "",
          dateOfBirth: "",
        });
        setAvatarPreview("/images/user/owner.jpg"); // Set ảnh mặc định khi lỗi
      });
  }, []);

  // Handle input changes for profile form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle input changes for password form
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  // NEW handler for avatar file input
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file)); // Create a preview URL for the newly selected file
    } else {
      setSelectedAvatarFile(null);
      // KHI KHÔNG CHỌN FILE MỚI, QUAY LẠI ẢNH HIỆN TẠI CỦA FORM DATA (nếu có) HOẶC ẢNH MẶC ĐỊNH
      setAvatarPreview(formData.avatarUrl ? (formData.avatarUrl.startsWith('http') ? formData.avatarUrl : `http://localhost:9090${formData.avatarUrl}`) : "/images/user/owner.jpg");
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
          return response.data; // This will be the URL (relative path) returned by the backend
      } catch (error: any) {
          toast.error(`Không thể tải ảnh lên: ${error.message}`);
          return null;
      }
  };

  // Handle profile update
  const handleSaveProfile = async () => {
    try {
      if (!formData.fullName || !formData.email) {
        toast.error("Họ tên và Email là bắt buộc."); // Sử dụng toast
        return;
      }
      if (formData.dateOfBirth) {
        const date = new Date(formData.dateOfBirth);
        if (isNaN(date.getTime())) {
          toast.error("Ngày sinh không hợp lệ."); // Sử dụng toast
          return;
        }
      }

      let finalAvatarUrl: string | undefined = formData.avatarUrl; // Bắt đầu với URL hiện tại từ formData (đường dẫn tương đối)

      if (selectedAvatarFile) {
          // Nếu người dùng CHỌN ẢNH MỚI, upload ảnh mới
          const uploadedUrl = await uploadImage(selectedAvatarFile);
          if (!uploadedUrl) {
              return; // Dừng lại nếu upload ảnh thất bại
          }
          finalAvatarUrl = uploadedUrl; // Cập nhật finalAvatarUrl bằng đường dẫn mới (tương đối)
      } else if (formData.avatarUrl === "") {
          // Nếu người dùng ĐÃ XÓA ảnh cũ (bằng nút "Xóa ảnh hiện tại") VÀ KHÔNG CHỌN ảnh mới
          finalAvatarUrl = ""; // Gửi chuỗi rỗng cho backend
      }
      // Trường hợp còn lại: người dùng không chọn ảnh mới và cũng không xóa ảnh cũ (formData.avatarUrl
      // vẫn là đường dẫn tương đối ban đầu), thì finalAvatarUrl giữ nguyên giá trị đó.


      const formattedData = {
        fullName: formData.fullName,
        email: formData.email,
        employeeCode: formData.employeeCode || "",
        gender: formData.gender || "",
        phoneNumber: formData.phoneNumber || "",
        avatarUrl: finalAvatarUrl, // Gửi URL cuối cùng (tương đối)
        specialization: formData.specialization || "",
        dateOfBirth: formData.dateOfBirth || "",
      };

      console.log("Dữ liệu gửi:", formattedData);

      const response = await axios.put(url.EMPLOYEE.UPDATE_PROFILE, formattedData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
      });

      setEmployee(response.data); // Cập nhật employee state với dữ liệu trả về từ backend (chứa URL mới nếu có)
      // Cập nhật lại avatarPreview để hiển thị ảnh mới sau khi save thành công
      if (response.data.avatarUrl) {
          setAvatarPreview(response.data.avatarUrl.startsWith('http') ? response.data.avatarUrl : `http://localhost:9090${response.data.avatarUrl}`);
      } else {
          setAvatarPreview("/images/user/owner.jpg");
      }
      setSelectedAvatarFile(null); // Reset selected file sau khi save
      toast.success("Cập nhật hồ sơ thành công!"); // Sử dụng toast
      closeModal();
    } catch (error: any) {
      console.error("Lỗi cập nhật hồ sơ:", error.response?.data || error.message);
      const errorMessage =
        error.response?.data?.message ||
        "Cập nhật hồ sơ thất bại. Vui lòng thử lại.";
      toast.error(errorMessage); // Sử dụng toast
    }
  };

  // Handle password update
  const handleSavePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại."); // Sử dụng toast
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu mới và xác nhận mật khẩu không khớp."); // Sử dụng toast
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(passwordData.newPassword)) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt."); // Sử dụng toast
      return;
    }

    try {
      const response = await axios.put(
        url.EMPLOYEE.UPDATE_PASSWORD,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmNewPassword: passwordData.confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Password update response:", response.data);
      toast.success("Đổi mật khẩu thành công!"); // Sử dụng toast
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsPasswordModalOpen(false);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.errors?.map((err: any) => err.defaultMessage).join("; ") ||
        error.response?.data?.message ||
        "Đổi mật khẩu thất bại. Vui lòng kiểm tra mật khẩu hiện tại hoặc thử lại.";
      console.error("Error updating password:", error.response?.data || error.message);
      toast.error(errorMessage); // Sử dụng toast
      // window.history.replaceState({}, document.title, window.location.pathname); // Dòng này có thể gây lỗi hoặc hành vi không mong muốn, nên cân nhắc bỏ
    }
  };

  // Khi mở modal chỉnh sửa, reset trạng thái file và preview
  const handleOpenEditModal = () => {
    setSelectedAvatarFile(null); // Clear selected file
    // Set preview to current avatar or default, using the full URL
    setAvatarPreview(formData.avatarUrl ? (formData.avatarUrl.startsWith('http') ? formData.avatarUrl : `http://localhost:9090${formData.avatarUrl}`) : "/images/user/owner.jpg");
    openModal();
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Thông tin cá nhân
          </h4>
          <div className="flex flex-col items-center w-full gap-6 lg:flex-row lg:items-start">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img
                src={employee?.avatarUrl ? (employee.avatarUrl.startsWith('http') ? employee.avatarUrl : `http://localhost:9090${employee.avatarUrl}`) : "/images/user/owner.jpg"}
                alt="user"
                className="w-full h-full object-cover" // Thêm object-cover để ảnh hiển thị đúng
              />
            </div>
            <div>
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 lg:text-left" style={{ marginTop: 25 }}>
                {employee?.fullName || ""}
              </h4>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Địa chỉ email
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {employee?.email || ""}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Mã nhân viên
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {employee?.employeeCode || ""}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Giới tính
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {employee?.gender || ""}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Số điện thoại
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {employee?.phoneNumber || ""}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Chuyên môn
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {employee?.specialization || "Không có"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Cửa hàng
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {employee?.store?.storeName || "Chưa có thông tin"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Ngày sinh
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {formatDate(employee?.dateOfBirth)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-row gap-3 lg:flex-row lg:items-end">
          <button
            onClick={handleOpenEditModal} // Sử dụng hàm mới để mở modal chỉnh sửa
            className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"            >
              <svg
                className="fill-current"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.05470 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.0440 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.63590 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.12620 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                  fill=""
                />
              </svg>
              Chỉnh sửa
            </button>
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9 2.25C6.92893 2.25 5.25 3.92893 5.25 6V7.5H4.5C3.67157 7.5 3 8.17157 3 9V15C3 15.8284 3.67157 16.5 4.5 16.5H13.5C14.3284 16.5 15 15.8284 15 15V9C15 8.17157 14.3284 7.5 13.5 7.5H12.75V6C12.75 3.92893 11.0711 2.25 9 2.25ZM6.75 6V7.5H11.25V6C11.25 4.75736 10.2426 3.75 9 3.75C7.75736 3.75 6.75 4.75736 6.75 6ZM9 12.75C9.62132 12.75 10.125 12.2463 10.125 11.625C10.125 11.0037 9.62132 10.5 9 10.5C8.37868 10.5 7.875 11.0037 7.875 11.625C7.875 12.2463 8.37868 12.75 9 12.75Z"
                  fill=""
                />
              </svg>
              Đổi mật khẩu
            </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Chỉnh sửa thông tin cá nhân
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Cập nhật thông tin của bạn để giữ hồ sơ luôn mới nhất.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Họ và tên</Label>
                  <Input
                    type="text"
                    name="fullName"
                    value={formData?.fullName || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="text"
                    name="email"
                    value={formData?.email || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label>Mã nhân viên</Label>
                  <Input
                    type="text"
                    name="employeeCode"
                    value={formData?.employeeCode || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label>Giới tính</Label>
                  <Input
                    type="text"
                    name="gender"
                    value={formData?.gender || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label>Số điện thoại</Label>
                  <Input
                    type="text"
                    name="phoneNumber"
                    value={formData?.phoneNumber || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label>Ngày sinh</Label>
                  <Input
                    type="date"
                    name="dateOfBirth"
                    value={formatDateForInput(formData?.dateOfBirth)}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label>Ảnh đại diện</Label> {/* Sửa label từ "Avatar URL" sang "Avatar" */}
                  <input
                    type="file" // Sửa type từ "text" sang "file"
                    name="avatarFile" // Đặt tên khác để tránh nhầm lẫn với avatarUrl string
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    onChange={handleAvatarFileChange} // Thêm handler mới
                    accept="image/*" // Chỉ chấp nhận file ảnh
                  />
                  {avatarPreview && (
                      <div className="mt-2">
                          <img
                              src={avatarPreview} // Luôn dùng avatarPreview để hiển thị ảnh
                              alt="Xem trước ảnh đại diện"
                              className="w-24 h-24 object-cover rounded-full"
                          />
                      </div>
                  )}
                  {/* Nút xóa ảnh hiện tại */}
                  {formData.avatarUrl && !selectedAvatarFile && (
                      <button
                          type="button"
                          onClick={() => {
                              setFormData(prev => ({ ...prev, avatarUrl: "" })); // Xóa URL ảnh khỏi form data
                              setAvatarPreview("/images/user/owner.jpg"); // Hiển thị ảnh mặc định
                          }}
                          className="text-red-500 text-sm mt-1 hover:underline"
                      >
                          Xóa ảnh hiện tại
                      </button>
                  )}
                </div>
                <div>
                  <Label>Chuyên môn</Label>
                  <Input
                    type="text"
                    name="specialization"
                    value={formData?.specialization || ""}
                    onChange={handleInputChange}
                    placeholder="Nhập chuyên môn"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Đóng
              </Button>
              <Button size="sm" onClick={handleSaveProfile}>
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Đổi mật khẩu
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Cập nhật mật khẩu để bảo mật tài khoản của bạn.
            </p>
          </div>
          <form onSubmit={handleSavePassword} className="flex flex-col">
            <div className="custom-scrollbar h-[300px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Mật khẩu hiện tại</Label>
                  <Input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                  />
                </div>
                <div>
                  <Label>Mật khẩu mới</Label>
                  <Input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                  />
                </div>
                <div>
                  <Label>Xác nhận mật khẩu mới</Label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
                Đóng
              </Button>
              <Button size="sm" type="submit">
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </div>
      </Modal>
      {/* Thêm ToastContainer */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}