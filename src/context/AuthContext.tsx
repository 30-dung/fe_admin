import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from "@/service/api"; // Import axios for fetching user profile
import url from "@/service/url"; // Import url for API endpoints

// Định nghĩa kiểu cho UserProfile (để lưu trong AuthState)
interface UserProfile {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  // Thêm các trường khác của profile nếu cần
}

// Định nghĩa kiểu cho trạng thái xác thực
interface AuthState {
  token: string | null;
  email: string | null;
  role: string | null; // e.g., "ROLE_ADMIN", "ROLE_EMPLOYEE", "ROLE_CUSTOMER"
  isAuthenticated: boolean;
  userProfile: UserProfile | null; // Thêm trường userProfile
}

// Định nghĩa kiểu cho AuthContextType
interface AuthContextType {
  auth: AuthState; // Chắc chắn luôn có giá trị
  login: (token: string, email: string, role: string) => Promise<void>; // Make login async
  logout: () => void;
  isLoadingAuth: boolean; // Trạng thái loading khi cố gắng khôi phục auth từ localStorage
}

// Khởi tạo AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    email: null,
    role: null,
    isAuthenticated: false,
    userProfile: null,
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Hàm để fetch user profile
  const fetchAndSetUserProfile = useCallback(async (token: string, email: string, role: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      let userProfileData: UserProfile = { fullName: null, email: null, avatarUrl: null };

      // Cập nhật email trong profile
      userProfileData.email = email;

      if (role.includes("ROLE_ADMIN")) {
        const response = await axios.get<{ fullName: string; email: string }>(url.USER.PROFILE, { headers });
        userProfileData.fullName = response.data.fullName;
        userProfileData.avatarUrl = "/images/user/owner.jpg"; // Default for admin
      } else if (role.includes("ROLE_EMPLOYEE")) {
        const response = await axios.get<{ fullName: string; email: string; avatarUrl?: string }>(url.EMPLOYEE.PROFILE, { headers });
        userProfileData.fullName = response.data.fullName;
        userProfileData.avatarUrl = response.data.avatarUrl || "/images/user/owner.jpg";
      }
      // Set userProfile trong trạng thái auth
      setAuth(prevAuth => ({ ...prevAuth, userProfile: userProfileData }));
    } catch (error) {
      console.error("Failed to fetch user profile in AuthContext:", error);
      setAuth(prevAuth => ({ ...prevAuth, userProfile: null })); // Xóa profile nếu lỗi
    }
  }, []);

  // useEffect để khôi phục trạng thái từ localStorage khi component mount
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedRole = localStorage.getItem('role');
        const storedEmail = localStorage.getItem('email');

        if (storedToken && storedRole && storedEmail) {
          setAuth({
            token: storedToken,
            email: storedEmail,
            role: storedRole,
            isAuthenticated: true,
            userProfile: null, // Sẽ fetch lại profile sau
          });
          // Fetch profile ngay lập tức nếu có token
          await fetchAndSetUserProfile(storedToken, storedEmail, storedRole);
        }
      } catch (error) {
        console.error("Failed to load auth from localStorage", error);
        // Xóa dữ liệu lỗi nếu có
        logout(); // Sử dụng hàm logout để dọn dẹp
      } finally {
        setIsLoadingAuth(false);
      }
    };
    restoreAuth();
  }, [fetchAndSetUserProfile]); // Dependency on fetchAndSetUserProfile to prevent stale closure

  // Hàm login: cập nhật trạng thái AuthContext và lưu vào localStorage
  const login = useCallback(async (token: string, email: string, role: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('email', email);

    setAuth({
      token,
      email,
      role,
      isAuthenticated: true,
      userProfile: null, // Đặt null trước khi fetch mới
    });
    await fetchAndSetUserProfile(token, email, role);
  }, [fetchAndSetUserProfile]);

  // Hàm logout: xóa trạng thái AuthContext và localStorage
  const logout = useCallback(() => {
    setAuth({ token: null, email: null, role: null, isAuthenticated: false, userProfile: null });
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('user'); // Xóa cả thông tin user profile
  }, []);

  const value = {
    auth,
    login,
    logout,
    isLoadingAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để sử dụng AuthContext một cách tiện lợi
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};