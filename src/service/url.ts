const url = {
    BASE_URL: "http://localhost:9090/api/",

    AUTH: {
        REGISTER: "auth/register",
        LOGIN: "auth/login",
        FORGOT_PASSWORD: "/auth/forgot-password",
        RESET_PASSWORD: "/auth/reset-password",
    },

    USER: {
        PROFILE: "user/profile",
        UPDATE_PROFILE: "user/update-profile",
    },

    STORE: {
        ADD: "/store/add",
        UPDATE: "/store/update",
        DELETE: "/store/delete",
        LOCATE: "/store/locate",
        ALL: "/store/all",
        CITIES: "/store/cities",
        DISTRICTS: "/store/districts",
        GET_BY_ID: "store",
    },

    STORE_SERVICE: {
        GET_BY_STORE: "store-service/store",
        CREATE_PRICE: "store-service/price",
        GET_ALL: "store-service/all",
        DELETE: "store-service/${id}",
        UPDATE: "store-service/${id}",
    },

    EMPLOYEE: {
        PROFILE: "employees/profile",
        GET_BY_STORE: "employees/store/{storeId}",
        CREATE: "employees/create",
        GET_PENDING_APPOINTMENTS: "employees/pending",
        UPDATE_APPOINTMENT_STATUS:
            "employees/appointments/{appointmentId}/status?action={action}",
        GET_ALL: "employees/all",
    },

    WORKING_TIME_SLOT: {
        CREATE: "working-time-slots/registration",
        GET_BY_EMPLOYEE: "working-time-slots/list",
    },

    APPOINTMENT: {
        CREATE: "appointments",
        GET_ALL: "appointments",
        GET_BY_ID: "appointments/${id}",
        UPDATE: "appointments/${id}",
        DELETE: "appointments/${id}",
        GET_BY_USER: "appointments/user/{email}",
        GET_BY_EMPLOYEE: "appointments/employee/{email}",
        CONFIRM: "appointments/${id}/confirm",
        CANCEL: "appointments/${id}/cancel",
        COMPLETE: "appointments/${id}/complete",
        FILTER: "appointments/filter",
    },
    SERVICE: {
        GET_ALL: "services",
        GET_BY_ID: "services/${id}",
        CREATE: "services",
        UPDATE: "services/${id}",
        DELETE: "services/${id}",
    },
    SALARY: {
        PROCESS_UNPROCESSED: "salary/process-unprocessed",
        GENERATE_PAYROLL: "salary/generate-payroll",
        MY_PAYROLL: "salary/my-payroll",
        MY_PAYROLL_HISTORY: "salary/my-payroll/history",
        MONTHLY_PAYROLLS: "salary/payroll/monthly",
        APPROVE_PAYROLL: "salary/approve",
        MARK_PAID: "salary/mark-paid",
        EMPLOYEES: "salary/employees",
    },
    CUSTOMER: {
        CREATE: "user/customer/create",
        UPDATE: "user/custome/update/{userId}",
        DELETE: "user/customer/delete/{userId}",
        GET_ALL: "user/customer/all",
        GET_BY_ID: "user/customer/{userId}",
    },
};

export default url;
