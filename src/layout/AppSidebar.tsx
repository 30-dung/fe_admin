import { useCallback, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// Giả định các icon được nhập từ thư viện icon
import {
    CalenderIcon,
    ChevronDownIcon,
    GridIcon,
    HorizontaLDots,
    ListIcon,
    PageIcon,
    TableIcon,
    UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
// import { Group, GroupIcon } from "lucide-react"; // Bỏ cái này nếu không dùng
import routes from "@/config/routes";
import { useAuth } from "@/context/AuthContext"; // Import useAuth hook

// Định nghĩa kiểu vai trò
type UserRole = "ROLE_ADMIN" | "ROLE_EMPLOYEE" | "ROLE_CUSTOMER"; // Thêm ROLE_CUSTOMER nếu có thể login

type NavItem = {
    name: string;
    icon: React.ReactNode;
    path?: string;
    roles?: UserRole[];
    subItems?: {
        name: string;
        path: string;
        pro?: boolean;
        new?: boolean;
        roles?: UserRole[];
    }[];
};

const navItems: NavItem[] = [
    {
        icon: <GridIcon />,
        name: "Bảng điều khiển",
        path: "/",
        roles: ["ROLE_ADMIN", "ROLE_EMPLOYEE"],
    },

    {
        icon: <GridIcon />,
        name: "Quản lý cửa hàng",
        roles: ["ROLE_ADMIN"],
        subItems: [
            {
                name: "Cửa hàng",
                path: "/store",
                pro: false,
                roles: ["ROLE_ADMIN"],
            },
            {
                name: "Dịch vụ",
                path: "/service-manager",
                pro: false,
                roles: ["ROLE_ADMIN"],
            },
        ],
    },

    {
        name: "Quản lý nhân sự",
        icon: <UserCircleIcon />,
        roles: ["ROLE_ADMIN"],
        subItems: [
            {
                name: "Tạo nhân viên",
                path: "/create-employee",
                pro: false,
                roles: ["ROLE_ADMIN"],
            },
            {
                name: "Danh sách nhân viên",
                path: "/employee-list",
                pro: false,
                roles: ["ROLE_ADMIN"],
            },
        ],
    },

    {
        icon: <CalenderIcon />,
        name: "Lịch",
        path: "/calendar",
        roles: ["ROLE_EMPLOYEE"],
    },

    {
        name: "Cuộc hẹn",
        icon: <TableIcon />,
        path: "/basic-tables", // Cần đổi path này sang trang Appointments cụ thể nếu có
        roles: ["ROLE_EMPLOYEE"],
    },

    {
        name: "Quản lý bảng lương",
        icon: <GridIcon />,
        path: routes.payrollDashboard,
        roles: ["ROLE_ADMIN"],
    },
    {
        name: "Bảng lương của tôi",
        icon: <UserCircleIcon />,
        path: routes.employeePayroll,
        roles: ["ROLE_EMPLOYEE"],
    },
    {
        name: "Quản lý lịch hẹn",
        icon: <TableIcon />,
        path: "/admin-appointments",
        roles: ["ROLE_ADMIN"],
    },
    {
        icon: <UserCircleIcon />,
        name: "Quản lý khách hàng",
        path: "/customer",
        roles: ["ROLE_ADMIN"],
    },
     {
        icon: <CalenderIcon />,
        name: "Lời góp ý",
        path: "/feedback",
        roles: ["ROLE_ADMIN"],
    },
];

// AppSidebarProps không cần userRole nữa vì sẽ lấy từ context
interface AppSidebarProps {}

const AppSidebar: React.FC<AppSidebarProps> = () => {
    const {
        isExpanded,
        isMobileOpen,
        isHovered,
        setIsHovered,
        openSubmenu,
        toggleSubmenu,
    } = useSidebar();
    const location = useLocation();
    const navigate = useNavigate();
    const { auth, isLoadingAuth } = useAuth(); // Lấy auth và isLoadingAuth từ context

    // Sử dụng auth.role làm effectiveRole
    const effectiveRole = auth.role as UserRole | null;

    useEffect(() => {
        // Chỉ điều hướng nếu AuthContext đã load xong và người dùng chưa được xác thực
        if (!isLoadingAuth && !auth.isAuthenticated) {
            console.warn("User not authenticated. Redirecting to signin.");
            navigate("/signin");
        }
    }, [auth.isAuthenticated, isLoadingAuth, navigate]);

    const isActive = useCallback(
        (path: string) => {
            const normalizedPath = path.endsWith("/")
                ? path.slice(0, -1)
                : path;
            const normalizedLocation = location.pathname.endsWith("/")
                ? location.pathname.slice(0, -1)
                : location.pathname;
            return normalizedLocation === normalizedPath;
        },
        [location.pathname]
    );

    const filteredNavItems = effectiveRole
        ? navItems
              .filter((item) => {
                  if (item.subItems) {
                      const validSubItems = item.subItems.filter(
                          (subItem) =>
                              !subItem.roles ||
                              subItem.roles.includes(effectiveRole)
                      );
                      return (
                          !item.roles ||
                          item.roles.includes(effectiveRole) ||
                          validSubItems.length > 0
                      );
                  }
                  return !item.roles || item.roles.includes(effectiveRole);
              })
              .map((item) => ({
                  ...item,
                  subItems: item.subItems?.filter(
                      (subItem) =>
                          !subItem.roles ||
                          subItem.roles.includes(effectiveRole)
                  ),
              }))
              .filter(
                  (item) =>
                      item.path || (item.subItems && item.subItems.length > 0)
              )
        : [];

    useEffect(() => {
        // Log thông tin để debug, có thể bỏ trong production
        console.log(
            "Filtered Nav Items:",
            filteredNavItems.map((item) => ({
                name: item.name,
                path: item.path,
                subItems: item.subItems?.map((sub) => sub.name),
            }))
        );
        console.log("Sidebar state:", {
            isExpanded,
            isMobileOpen,
            isHovered,
            openSubmenu,
        });
    }, [filteredNavItems, isExpanded, isMobileOpen, isHovered, openSubmenu]);

    const renderMenuItems = (items: NavItem[]) => (
        <ul className="flex flex-col gap-4">
            {items.length === 0 ? (
                <li className="text-gray-500">Không có mục menu nào</li>
            ) : (
                items.map((nav) => (
                    <li key={nav.name}>
                        {nav.subItems ? (
                            <button
                                type="button"
                                onClick={() => {
                                    console.log(
                                        "Toggling submenu for:",
                                        nav.name
                                    );
                                    toggleSubmenu(nav.name);
                                }}
                                className={`menu-item group flex items-center w-full p-2 rounded-lg transition-colors ${
                                    openSubmenu === nav.name
                                        ? "menu-item-active"
                                        : "menu-item-inactive"
                                } ${
                                    !isExpanded && !isHovered
                                        ? "lg:justify-center"
                                        : "lg:justify-start"
                                }`}
                            >
                                <span
                                    className={`menu-item-icon-size ${
                                        openSubmenu === nav.name
                                            ? "menu-item-icon-active"
                                            : "menu-item-icon-inactive"
                                    }`}
                                >
                                    {nav.icon}
                                </span>
                                {(isExpanded || isMobileOpen || isHovered) && (
                                    <span className="flex-1 text-left">
                                        {nav.name}
                                    </span>
                                )}
                                {(isExpanded || isMobileOpen || isHovered) && (
                                    <ChevronDownIcon
                                        className={`w-5 h-5 transition-transform ${
                                            openSubmenu === nav.name
                                                ? "rotate-180 text-blue-500"
                                                : ""
                                        }`}
                                    />
                                )}
                            </button>
                        ) : (
                            nav.path && (
                                <Link
                                    to={nav.path}
                                    className={`menu-item group flex items-center p-2 rounded-lg transition-colors ${
                                        isActive(nav.path)
                                            ? "menu-item-active"
                                            : "menu-item-inactive"
                                    }`}
                                >
                                    <span
                                        className={`menu-item-icon-size ${
                                            isActive(nav.path)
                                                ? "menu-item-icon-active"
                                                : "menu-item-icon-inactive"
                                        }`}
                                    >
                                        {nav.icon}
                                    </span>
                                    {(isExpanded ||
                                        isMobileOpen ||
                                        isHovered) && <span>{nav.name}</span>}
                                </Link>
                            )
                        )}
                        {nav.subItems &&
                            (isExpanded || isMobileOpen || isHovered) && (
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${
                                        openSubmenu === nav.name
                                            ? "max-h-[1000px]"
                                            : "max-h-0"
                                    }`}
                                >
                                    <ul className="mt-2 space-y-1 ml-9">
                                        {nav.subItems.map((subItem) => (
                                            <li key={subItem.name}>
                                                <Link
                                                    to={subItem.path}
                                                    onClick={(e) => {
                                                        console.log(
                                                            "Clicked subItem link:",
                                                            {
                                                                path: subItem.path,
                                                                active: isActive(
                                                                    subItem.path
                                                                ),
                                                            }
                                                        );
                                                        e.stopPropagation();
                                                    }}
                                                    className={`menu-dropdown-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                                                        isActive(subItem.path)
                                                            ? "menu-dropdown-item-active"
                                                            : "menu-dropdown-item-inactive"
                                                    }`}
                                                >
                                                    {subItem.name}
                                                    <span className="flex items-center gap-1 ml-auto">
                                                        {subItem.new && (
                                                            <span
                                                                className={`menu-dropdown-badge ${
                                                                    isActive(
                                                                        subItem.path
                                                                    )
                                                                        ? "menu-dropdown-badge-active"
                                                                        : "menu-dropdown-badge-inactive"
                                                                }`}
                                                            >
                                                                mới
                                                            </span>
                                                        )}
                                                        {subItem.pro && (
                                                            <span
                                                                className={`menu-dropdown-badge ${
                                                                    isActive(
                                                                        subItem.path
                                                                    )
                                                                        ? "menu-dropdown-badge-active"
                                                                        : "menu-dropdown-badge-inactive"
                                                                }`}
                                                            >
                                                                pro
                                                            </span>
                                                        )}
                                                    </span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                    </li>
                ))
            )}
        </ul>
    );

    // Hiển thị null hoặc loading nếu đang loading auth hoặc chưa xác thực
    if (isLoadingAuth || !auth.isAuthenticated) {
        return null; // Có thể thay bằng một loading spinner toàn màn hình nếu cần
    }

    return (
        <aside
            className={`fixed mt-16 lg:mt-0 top-0 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${
            isExpanded || isMobileOpen
                ? "w-[290px]"
                : isHovered
                ? "w-[290px]"
                : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
            onMouseEnter={() => {
                console.log("Mouse entered sidebar");
                !isExpanded && setIsHovered(true);
            }}
            onMouseLeave={() => {
                console.log("Mouse left sidebar");
                setIsHovered(false);
            }}
        >
            <div
                className={`py-8 px-5 flex ${
                    !isExpanded && !isHovered
                        ? "lg:justify-center"
                        : "justify-start"
                }`}
            >
                <Link to="/">
                    {isExpanded || isHovered || isMobileOpen ? (
                        <>
                            <img
                                className="dark:hidden"
                                src="/images/logo/logo1bar.svg"
                                alt="Logo"
                                width={150}
                                height={40}
                            />
                            <img
                                className="hidden dark:block"
                                src="/images/logo/logo2bar.svg"
                                alt="Logo"
                                width={150}
                                height={40}
                            />
                        </>
                    ) : (
                        <img
                            src="/images/logo/logo1icon.svg"
                            alt="Logo"
                            width={32}
                            height={32}
                        />
                    )}
                </Link>
            </div>
            <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar px-5">
                <nav className="mb-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2
                                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                                    !isExpanded && !isHovered
                                        ? "lg:justify-center"
                                        : "justify-start"
                                }`}
                            >
                                {isExpanded || isHovered || isMobileOpen ? (
                                    "Menu"
                                ) : (
                                    <HorizontaLDots className="size-6" />
                                )}
                            </h2>
                            {renderMenuItems(filteredNavItems)}
                        </div>
                    </div>
                </nav>
            </div>
        </aside>
    );
};

export default AppSidebar;