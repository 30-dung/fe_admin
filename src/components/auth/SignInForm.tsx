import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import axios from "../../service/api";
import { isAxiosError } from "axios";
import url from "../../service/url";
import { useAuth } from "@/context/AuthContext"; // Import useAuth hook

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  role: string;
}

// Bỏ các interface UserProfileResponse, EmployeeProfileResponse vì AuthContext sẽ fetch

export default function SignInForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";
  const { auth, login, logout, isLoadingAuth } = useAuth(); // Sử dụng useAuth

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({
    email: "",
    password: "",
  });
  const [notification, setNotification] = useState<{ message: string; isSuccess: boolean } | null>(null);

  useEffect(() => {
    // Chờ cho AuthContext hoàn tất việc khôi phục trạng thái ban đầu
    if (isLoadingAuth) {
      return;
    }

    // Nếu đã xác thực và có role phù hợp, điều hướng
    if (auth.isAuthenticated) {
      if (auth.role && (auth.role.includes("ROLE_ADMIN") || auth.role.includes("ROLE_EMPLOYEE"))) {
        navigate(returnTo);
      } else {
        // Nếu role không phù hợp (ví dụ: chỉ là khách hàng hoặc role không hợp lệ)
        logout(); // Đăng xuất để xóa token, role, email khỏi localStorage và context
        navigate("/signin");
      }
    }
  }, [auth, navigate, returnTo, logout, isLoadingAuth]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormErrors({ ...formErrors, [name]: "" });
    setNotification(null);
  };

  const validateForm = () => {
    let valid = true;
    const newErrors: FormErrors = { email: "", password: "" };

    if (!formData.email) {
      newErrors.email = "Vui lòng nhập địa chỉ email.";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Vui lòng nhập địa chỉ email hợp lệ.";
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu.";
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
      valid = false;
    } else if (formData.password.length > 50) {
      newErrors.password = "Mật khẩu phải ít hơn 50 ký tự.";
      valid = false;
    }

    setFormErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotification(null);
    setLoading(true);

    if (validateForm()) {
      try {
        const response = await axios.post<LoginResponse>(url.AUTH.LOGIN, formData);
        const { token, role } = response.data;

        if (role.includes("ROLE_ADMIN") || role.includes("ROLE_EMPLOYEE")) {
          await login(token, formData.email, role); // Gọi hàm login từ AuthContext
          setNotification({ message: "Đăng nhập thành công", isSuccess: true });
          setTimeout(() => {
            navigate(returnTo);
          }, 1000);
        } else {
          setNotification({
            message: "Truy cập bị từ chối: Không đủ quyền hạn",
            isSuccess: false,
          });
          logout(); // Gọi logout từ AuthContext
        }
      } catch (error: unknown) {
        let errorMessage = "Đã xảy ra lỗi trong quá trình đăng nhập";
        if (isAxiosError(error)) {
          errorMessage = error.response?.data?.message || error.message;
        }
        setNotification({ message: errorMessage, isSuccess: false });
        logout(); // Đảm bảo logout nếu có lỗi
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  // Hiển thị loading overlay nếu AuthContext đang khôi phục trạng thái
  if (isLoadingAuth) {
    return <div>Đang tải xác thực...</div>;
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Đăng nhập
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nhập email và mật khẩu để đăng nhập!
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="admin@gmail.com"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500 dark:text-red-400">{formErrors.email}</p>
                )}
              </div>
              <div>
                <Label>
                  Mật khẩu <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Nhập mật khẩu của bạn"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
                {formErrors.password && (
                  <p className="text-sm text-red-500 dark:text-red-400">{formErrors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Duy trì đăng nhập
                  </span>
                </div>
                <Link
                  to="/reset-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {notification && (
                <p
                  className={`text-sm p-2 rounded ${
                    notification.isSuccess
                      ? "text-green-500 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                      : "text-red-500 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {notification.message}
                </p>
              )}

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  size="sm"
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Chưa có tài khoản?{" "}
              <Link
                to="/signup"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Đăng ký
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}