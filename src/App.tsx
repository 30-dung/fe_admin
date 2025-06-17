import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "pages/AuthPages/SignIn";
import SignUp from "pages/AuthPages/SignUp";
import NotFound from "pages/OtherPage/NotFound";
import UserProfiles from "pages/UserProfiles";
import Calendar from "pages/Calendar";
import BasicTables from "pages/Tables/BasicTables";
import FormElements from "pages/Forms/FormElements";
import AppLayout from "layout/AppLayout";
import { ScrollToTop } from "components/common/ScrollToTop";
import Homes from "pages/Dashboard/Homes";
import { ProtectedRoutes } from "./ProtectedRoutes";
import routes from "config/routes";
import CreateEmployeeForm from "pages/Hrm/CreateEmp";
import { Store } from "@/pages/Store/Store";
import ServiceManager from "pages/sm/ServiceManager";
import EmployeeList from "pages/Hrm/GetEmp";
import EmployeePayroll from "./pages/Payroll/EmployeePayroll";
import PayrollDashboard from "./pages/Payroll/PayrollDashboard";
import { AuthProvider } from '@/context/AuthContext';
import AdminAppointments from "./pages/AllAppoiment/AdminAppointments";
// import PrivateRoute from "./components/common/PrivateRoute";

export default function App() {
    return (
        <>
            <Router>
                <ScrollToTop />
                <Routes>
                    {/* Auth and Puclic Routes */}
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="*" element={<NotFound />} />

                    {/* Protected Routes */}
                    {/* Dashboard Layout */}
                    <Route
                        element={
                            <ProtectedRoutes
                                allowedRoles={["ROLE_ADMIN", "ROLE_EMPLOYEE"]}
                            />
                        }
                    >
                        <Route element={<AppLayout />}>
                            <Route index path="/" element={<Homes />} />
                            {/* Others Page */}
                            <Route path="/profile" element={<UserProfiles />} />
                            <Route path="/calendar" element={<Calendar />} />
                            {/* Forms */}
                            <Route
                                path="/form-elements"
                                element={<FormElements />}
                            />
                            {/* Tables */}
                            <Route
                                path="/basic-tables"
                                element={<BasicTables />}
                            />
                            {/* Store */}
                            <Route path={routes.store} element={<Store />} />

                            {/* Human Resources Management */}
                            <Route
                                path={routes.ce}
                                element={<CreateEmployeeForm />}
                            />
                            <Route
                                path={routes.ge}
                                element={<EmployeeList />}
                            />
                            {/* Service Manager */}
                            <Route
                                path={routes.serviceManager}
                                element={<ServiceManager />}
                            />
                            <Route path={routes.payrollDashboard} element={<PayrollDashboard />} /> {/* Thêm route */}
                            <Route path={routes.employeePayroll} element={<EmployeePayroll />} /> {/* Thêm route */}
                            <Route path={routes.adminAppointments} element={<AdminAppointments />} />
                        </Route>
                    </Route>
                </Routes>
            </Router>
        </>
    );
}
