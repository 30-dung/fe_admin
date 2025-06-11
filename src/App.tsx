import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Homes from "./pages/Dashboard/Homes";
import { ProtectedRoutes } from "./ProtectedRoutes";
import { Store } from "./pages/Store";
import routes from "./config/routes";
import CreateEmployeeForm from "./pages/Hrm/CreateEmp";

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
                            <Route path="/store" element={<Store />} />
                            {/* Human Resources Management */}
                            <Route
                                path={routes.ce}
                                element={<CreateEmployeeForm />}
                            />
                        </Route>
                    </Route>
                </Routes>
            </Router>
        </>
    );
}
