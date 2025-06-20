import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import axios from "../../service/api";
import url from "../../service/url";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface User {
  fullName?: string;
  avatarUrl?: string;
  email?: string;
  phoneNumber?: string;
}

interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
}

interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function AdminInfoCard() {
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isPasswordOpen, openModal: openPasswordModal, closeModal: closePasswordModal } = useModal();
  const [user, setUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null); // State cho thông tin cá nhân
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  }); // State cho đổi mật khẩu

  useEffect(() => {
    axios
      .get(url.USER.PROFILE, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      })
      .then((res) => {
        setUser(res.data);
        setEditUser(res.data); // Khởi tạo editUser với dữ liệu ban đầu
        console.log("User data:", res.data); // Debug: Kiểm tra dữ liệu user
      })
      .catch((error) =>
        setUser({
          fullName: "",
          avatarUrl: "/images/user/owner.jpg",
          email: "",
          phoneNumber: "",
        })
      );
  }, []);

  const handleSave = () => {
    if (editUser) {
      const requestData: UpdateProfileRequest = {
        fullName: editUser.fullName,
        phoneNumber: editUser.phoneNumber,
      };
      axios
        .put(url.USER.UPDATE_PROFILE, requestData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        })
        .then((res) => {
          setUser({ ...editUser, email: res.data.email }); // Cập nhật email từ response nếu cần
          console.log("Update successful:", res.data);
          toast.success("Profile updated successfully!");
          closeEditModal();
        })
        .catch((error) => {
          console.error("Error updating user:", error);
          if (error.response && error.response.status === 400) {
            toast.error(error.response.data.message || "Update failed");
          } else {
            toast.error("An error occurred while updating profile");
          }
        });
    }
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }
    const requestData: ChangePasswordRequest = {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword,
    };
    axios
      .put(url.USER.UPDATE_PROFILE, requestData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      })
      .then((res) => {
        console.log("Password changed successfully:", res.data);
        toast.success("Password changed successfully!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" }); // Reset form
        closePasswordModal();
      })
      .catch((error) => {
        console.error("Error changing password:", error);
        if (error.response && error.response.status === 400) {
          toast.error(error.response.data.message || "Password change failed");
        } else {
          toast.error("An error occurred while changing password");
        }
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "currentPassword" || name === "newPassword" || name === "confirmPassword") {
      setPasswordData((prev) => ({ ...prev, [name]: value }));
    } else {
      setEditUser((prev) => (prev ? { ...prev, [name]: value } : prev));
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>
          <div className="flex flex-col items-center w-full gap-6 lg:flex-row lg:items-start">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img src={user?.avatarUrl || "/images/user/owner.jpg"} alt="user" />
            </div>
            <div>
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 lg:text-left" style={{ marginTop: 25 }}>
                {user?.fullName || ""}
              </h4>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.email || ""}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Phone Number
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.phoneNumber || ""}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <button
            onClick={() => {
              console.log("Opening edit modal");
              openEditModal();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-dark dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
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
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit Profile
          </button>
          <button
            onClick={() => {
              console.log("Opening password modal");
              openPasswordModal();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-dark dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
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
                d="M12.75 8.25V6.75C12.75 4.67893 11.0711 3 9 3C6.92893 3 5.25 4.67893 5.25 6.75V8.25H4.5C4.08579 8.25 3.75 8.58579 3.75 9V14C3.75 14.4142 4.08579 14.75 4.5 14.75H13.5C13.9142 14.75 14.25 14.4142 14.25 14V9C14.25 8.58579 13.9142 8.25 13.5 8.25H12.75ZM6.75 6.75C6.75 5.50736 7.75736 4.5 9 4.5C10.2426 4.5 11.25 5.50736 11.25 6.75V8.25H6.75V6.75ZM9 10.5C8.58579 10.5 8.25 10.8358 8.25 11.25V12.75C8.25 13.1642 8.58579 13.5 9 13.5C9.41421 13.5 9.75 13.1642 9.75 12.75V11.25C9.75 10.8358 9.41421 10.5 9 10.5Z"
                fill=""
              />
            </svg>
            Change Password
          </button>
        </div>
      </div>

      <Modal isOpen={isEditOpen} onClose={() => { console.log("Closing edit modal"); closeEditModal(); }} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[250px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    type="text"
                    name="fullName"
                    value={editUser?.fullName || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="text"
                    name="email"
                    value={editUser?.email || ""}
                    onChange={handleInputChange}
                    disabled // Email không được chỉnh sửa trực tiếp
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="text"
                    name="phoneNumber"
                    value={editUser?.phoneNumber || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeEditModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isPasswordOpen} onClose={() => { console.log("Closing password modal"); closePasswordModal(); }} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Change Password
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your password securely.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[250px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closePasswordModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleChangePassword}>
                Change Password
              </Button>
            </div>
          </form>
        </div>
      </Modal>
      <ToastContainer />
    </div>
  );
}