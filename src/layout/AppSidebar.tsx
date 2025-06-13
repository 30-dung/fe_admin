
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

// Định nghĩa kiểu vai trò
type UserRole = "ROLE_ADMIN" | "ROLE_EMPLOYEE";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles?: UserRole[];
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean; roles?: UserRole[] }[];
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
            { name: "Cửa hàng", path: "/store", pro: false, roles: ["ROLE_ADMIN"] },
            { name: "Dịch vụ", path: "/store-service", pro: false, roles: ["ROLE_ADMIN"] },
        ],
    },
  {
    icon: <CalenderIcon />,
    name: "Lịch",
    path: "/calendar",
    roles: ["ROLE_EMPLOYEE"],
  },
  {
    icon: <UserCircleIcon />,
    name: "Nhân viên",
    path: "/profile",
    roles: ["ROLE_EMPLOYEE"],
  },
  {
    name: "Biểu mẫu",
    icon: <ListIcon />,
    roles: ["ROLE_ADMIN"],
    subItems: [
      { name: "Thành phần biểu mẫu", path: "/form-elements", pro: false, roles: ["ROLE_ADMIN"] },
    ],
  },
  {
    name: "Cuộc hẹn",
    icon: <TableIcon />,
    path: "/basic-tables",
    roles: ["ROLE_EMPLOYEE"],
  },
  {
    name: "Trang",
    icon: <PageIcon />,
    roles: ["ROLE_ADMIN"],
    subItems: [
      { name: "Trang trống", path: "/blank", pro: false, roles: ["ROLE_ADMIN"] },
      { name: "Lỗi 404", path: "/error-404", pro: false, roles: ["ROLE_ADMIN"] },
    ],
  },
  {
    name: "Quản lý nhân sự",
    icon: <GridIcon />,
    roles: ["ROLE_ADMIN"],
    subItems: [
      { name: "Tạo nhân viên", path: "/create-employee", pro: false, roles: ["ROLE_ADMIN"] },
    ],
  },
  {
        name: "Quản lý dịch vụ",
        icon: <GridIcon />,
        roles: ["ROLE_ADMIN"],
        subItems: [
            { name: "Dịch vụ", path: "/service-manager", pro: false, roles: ["ROLE_ADMIN"] },
        ],
    },
];

interface AppSidebarProps {
  userRole?: UserRole;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ userRole }) => {
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

  const effectiveRole = userRole || (localStorage.getItem("role") as UserRole) || null;

  useEffect(() => {
    if (!effectiveRole) {
      console.warn("No user role found. Redirecting to signin.");
      navigate("/signin");
    }
  }, [effectiveRole, navigate]);

  const isActive = useCallback(
    (path: string) => {
      const normalizedPath = path.endsWith("/") ? path.slice(0, -1) : path;
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
              (subItem) => !subItem.roles || subItem.roles.includes(effectiveRole)
            );
            return (
              (!item.roles || item.roles.includes(effectiveRole)) ||
              validSubItems.length > 0
            );
          }
          return !item.roles || item.roles.includes(effectiveRole);
        })
        .map((item) => ({
          ...item,
          subItems: item.subItems?.filter(
            (subItem) => !subItem.roles || subItem.roles.includes(effectiveRole)
          ),
        }))
        .filter((item) => item.path || (item.subItems && item.subItems.length > 0))
    : [];

  useEffect(() => {
    console.log("Filtered Nav Items:", filteredNavItems.map((item) => ({
      name: item.name,
      path: item.path,
      subItems: item.subItems?.map((sub) => sub.name),
    })));
    console.log("Sidebar state:", { isExpanded, isMobileOpen, isHovered, openSubmenu });
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
                  console.log("Toggling submenu for:", nav.name);
                  toggleSubmenu(nav.name);
                }}
                className={`menu-item group flex items-center w-full p-2 rounded-lg transition-colors ${
                  openSubmenu === nav.name
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
              >
                <span className={`menu-item-icon-size ${openSubmenu === nav.name ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                  {nav.icon}
                </span>
                {(isExpanded || isMobileOpen || isHovered) && (
                  <span className="flex-1 text-left">{nav.name}</span>
                )}
                {(isExpanded || isMobileOpen || isHovered) && (
                  <ChevronDownIcon
                    className={`w-5 h-5 transition-transform ${openSubmenu === nav.name ? "rotate-180 text-blue-500" : ""}`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group flex items-center p-2 rounded-lg transition-colors ${
                    isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
                >
                  <span className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                    {nav.icon}
                  </span>
                  {(isExpanded || isMobileOpen || isHovered) && (
                    <span>{nav.name}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isMobileOpen || isHovered) && (
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openSubmenu === nav.name ? "max-h-[1000px]" : "max-h-0"
                }`}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        onClick={(e) => {
                          console.log("Clicked subItem link:", {
                            path: subItem.path,
                            active: isActive(subItem.path),
                          });
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
                                isActive(subItem.path)
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
                                isActive(subItem.path)
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

  if (!effectiveRole) {
    return null;
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
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/homes">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
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
