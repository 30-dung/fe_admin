import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// Giả định các icon được nhập từ thư viện icon
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
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
  roles?: UserRole[]; // Vai trò được phép truy cập
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean; roles?: UserRole[] }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Bảng điều khiển",
    path: "/",
    roles: ["ROLE_ADMIN", "ROLE_EMPLOYEE"], // Cả hai vai trò
  },
  {
    icon: <GridIcon />,
    name: "Cửa hàng",
    path: "/store",
    roles: ["ROLE_ADMIN"], // Chỉ admin
  },
  {
    icon: <CalenderIcon />,
    name: "Lịch",
    path: "/calendar",
    roles: ["ROLE_EMPLOYEE"], // Chỉ employee
  },
  {
    icon: <UserCircleIcon />,
    name: "Nhân viên",
    path: "/profile",
    roles: ["ROLE_EMPLOYEE"], // Chỉ employee
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
    name: "Bảng",
    icon: <TableIcon />,
    roles: ["ROLE_EMPLOYEE"],
    subItems: [
      { name: "Cuộc hẹn", path: "/basic-tables", pro: false, roles: ["ROLE_EMPLOYEE"] },
    ],
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
];

interface AppSidebarProps {
  userRole?: UserRole; // Cho phép userRole là optional để xử lý trường hợp undefined
}

const AppSidebar: React.FC<AppSidebarProps> = ({ userRole }) => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Lấy userRole từ localStorage nếu prop userRole là undefined
  const effectiveRole = userRole || (localStorage.getItem("role") as UserRole) || null;

  // Chuyển hướng đến trang đăng nhập nếu chưa có vai trò
  useEffect(() => {
    if (!effectiveRole) {
      console.warn("No user role found. Redirecting to signin.");
      navigate("/signin");
    }
  }, [effectiveRole, navigate]);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // Lọc các mục menu theo vai trò
  const filteredNavItems = effectiveRole
    ? navItems
        .filter((item) => !item.roles || item.roles.includes(effectiveRole))
        .map((item) => ({
          ...item,
          subItems: item.subItems?.filter(
            (subItem) => !subItem.roles || subItem.roles.includes(effectiveRole)
          ),
        }))
        .filter((item) => item.path || (item.subItems && item.subItems.length > 0))
    : [];

  // Debug: In ra thông tin để kiểm tra
  useEffect(() => {
    console.log("Effective Role:", effectiveRole);
    console.log("Filtered Nav Items:", filteredNavItems);
  }, [effectiveRole, filteredNavItems]);

  useEffect(() => {
    let submenuMatched = false;
    filteredNavItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({
              type: "main",
              index,
            });
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, filteredNavItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.length === 0 ? (
        <li className="text-gray-500">Không có mục menu nào</li>
      ) : (
        items.map((nav, index) => (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "menu-item-icon-active"
                      : ""
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isMobileOpen || isHovered) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {(isExpanded || isMobileOpen || isHovered) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                      openSubmenu?.type === menuType && openSubmenu?.index === index
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
                  className={`menu-item group ${
                    isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(nav.path) ? "menu-item-icon-active" : ""
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isMobileOpen || isHovered) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isMobileOpen || isHovered) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? `${subMenuHeight[`${menuType}-${index}`]}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                            >
                              mới
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge-mini`}
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

  // Nếu không có vai trò, không render sidebar
  if (!effectiveRole) {
    return null;
  }

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
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
              {renderMenuItems(filteredNavItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;