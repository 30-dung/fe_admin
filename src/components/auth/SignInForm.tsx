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

interface UserProfileResponse {
  fullName: string;
  email: string;
  phoneNumber: string;
  membershipType: string;
  loyaltyPoints: number;
}

interface EmployeeProfileResponse {
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string;
  specialization?: string;
}

export default function SignInForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(true);
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
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");
    if (token && role) {
      if (role.includes("ROLE_ADMIN") || role.includes("ROLE_EMPLOYEE")) {
        navigate(returnTo);
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("role");
        navigate("/signin");
      }
    }
    setLoading(false);
  }, [navigate, returnTo]);

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
      newErrors.email = "Please enter your email address.";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = "Please enter your password.";
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
      valid = false;
    } else if (formData.password.length > 50) {
      newErrors.password = "Password must be less than 50 characters.";
      valid = false;
    }

    setFormErrors(newErrors);
    return valid;
  };

  const fetchUserProfile = async (token: string, role: string) => {
  try {
    const headers = { Authorization: `Bearer ${token}` };
    let user;

    if (role.includes("ROLE_ADMIN")) {
      const response = await axios.get<UserProfileResponse>(url.USER.PROFILE, { headers });
      user = {
        fullName: response.data.fullName,
        email: response.data.email,
        avatarUrl: "/images/user/owner.jpg", // fallback
      };
    } else if (role.includes("ROLE_EMPLOYEE")) {
      const response = await axios.get<EmployeeProfileResponse>(url.EMPLOYEE.PROFILE, { headers });
      user = {
        fullName: response.data.fullName,
        email: response.data.email,
        avatarUrl: response.data.avatarUrl || "/images/user/owner.jpg",
      };
    }

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    setNotification({ message: "Failed to load profile", isSuccess: false });
  }
};

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotification(null);

    if (validateForm()) {
      try {
        const response = await axios.post<LoginResponse>(url.AUTH.LOGIN, formData);
        const { token, role } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);

        if (role.includes("ROLE_ADMIN") || role.includes("ROLE_EMPLOYEE")) {
          await fetchUserProfile(token, role);
          setNotification({ message: "Login successful", isSuccess: true });
          setTimeout(() => {
            navigate(returnTo);
          }, 1000);
        } else {
          setNotification({
            message: "Access denied: Insufficient permissions",
            isSuccess: false,
          });
          localStorage.removeItem("token");
          localStorage.removeItem("role");
        }
      } catch (error: unknown) {
        let errorMessage = "An error occurred during login";
        if (isAxiosError(error)) {
          errorMessage = error.response?.data?.message || error.message;
        }
        setNotification({ message: errorMessage, isSuccess: false });
      }
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/homes"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="info@gmail.com"
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
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
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
                    Keep me logged in
                  </span>
                </div>
                <Link
                  to="/reset-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
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
                  {loading ? "Loading..." : "Sign in"}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}