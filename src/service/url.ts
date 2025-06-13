import { C } from "node_modules/@fullcalendar/core/internal-common";

const url = {
    BASE_URL: "http://localhost:9090/api/",

    AUTH: {
        REGISTER: "auth/register", // Đăng ký người dùng mới.
        LOGIN: "auth/login", // Đăng nhập người dùng.
        FORGOT_PASSWORD: "/auth/forgot-password", // Quên mật khẩu, gửi email để đặt lại mật khẩu.
        RESET_PASSWORD: "/auth/reset-password", // Đặt lại mật khẩu sau khi nhận được email.
    },

    USER: {
        PROFILE: "user/profile", // Lấy thông tin người dùng hiện tại.``
        UPDATE_PROFILE: "user/update-profile", // Cập nhật thông tin người dùng hiện tại.
        
    },

    STORE:{
     ADD: "/store/add", // Thêm mới một cửa hàng.
    UPDATE: "/store/update", // Cập nhật thông tin cửa hàng.
    DELETE: "/store/delete", // Xóa một cửa hàng.
    LOCATE: "/store/locate", // Tìm kiếm cửa hàng theo vị trí.
    ALL: "/store/all", // Lấy danh sách tất cả cửa hàng.
    CITIES: "/store/cities", // Lấy danh sách các thành phố.
    DISTRICTS: "/store/districts", // Lấy danh sách các quận huyện theo thành phố.
    GET_BY_ID: 'store', // Lấy thông tin cửa hàng theo ID.
},

     STORE_SERVICE: {
        GET_BY_STORE: 'services/store', // Matches /api/services/store/{storeId}
    },

    EMPLOYEE: {
        PROFILE: "employees/profile", //Lấy thông tin nhân viên hiện tại.
        GET_BY_STORE: "employees/store/{storeId}", //Lấy danh sách nhân viên thuộc về một cửa hàng cụ thể.
        CREATE: "employees/create", //Tạo mới một nhân viên.
        GET_PENDING_APPOINTMENTS: "employees/pending", //Lấy danh sách các cuộc hẹn đang chờ của nhân viên.
        UPDATE_APPOINTMENT_STATUS: "employees/appointments/{appointmentId}/status?action={action}" //Cập nhật trạng thái cuộc hẹn của nhân viên.
    },

    WORKING_TIME_SLOT: {
        CREATE: "employee/working-time-slots/registration", // Tạo mới một khung giờ làm việc.
        GET_BY_EMPLOYEE: "employee/working-time-slots/worktimelist", // Lấy danh sách khung giờ làm việc của một nhân viên cụ thể.
    },

     APPOINTMENT: {
    CREATE: 'appointments',                               // POST: Tạo nhiều lịch hẹn
    GET_ALL: 'appointments',                              // GET: Lấy tất cả lịch hẹn
    GET_BY_ID: 'appointments/${id}',              // GET: Lấy lịch hẹn theo ID
    UPDATE: 'appointments/${id}',                 // PUT: Cập nhật lịch hẹn
    DELETE: 'appointments/${id}',                 // DELETE: Xoá lịch hẹn
    GET_BY_USER: 'appointments/user/{email}', // GET: Lấy lịch hẹn theo người dùng
    GET_BY_EMPLOYEE: 'appointments/employee/{email}', // GET: Lấy lịch hẹn theo nhân viên
    CONFIRM: 'appointments/${id}/confirm',        // PATCH: Nhân viên xác nhận lịch hẹn
    CANCEL: 'appointments/${id}/cancel',     // PATCH: Khách hoặc nhân viên huỷ lịch hẹn
      COMPLETE: 'appointments/${id}/complete', // PATCH: Nhân viên hoàn thành lịch hẹn   

    },
    SERVICE: {
        GET_ALL: "services", // Lấy danh sách tất cả dịch vụ.
        GET_BY_ID: "services/${id}",
        CREATE: "services", // Tạo mới một dịch vụ.
        UPDATE: "services/${id}", // Cập nhật thông tin dịch vụ.
        DELETE: "services/${id}", // Xóa một dịch vụ.
    },

};

export default url;