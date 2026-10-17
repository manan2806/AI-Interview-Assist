import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth Pages
import Home from "./pages/Auth/Home";
import Login from "./pages/Auth/Login";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import VerifyOTP from "./pages/Auth/VerifyOTP";
import ResetPassword from "./pages/Auth/ResetPassword";
import Register from "./pages/Auth/Register";

// User Pages
import Dashboard from "./pages/User/Dashboard";
import Profile from "./pages/User/Profile";
import ProfileImprovement from "./pages/User/ProfileImprovement";
import InterviewSetup from "./pages/User/InterviewSetup";
import InterviewStart from "./pages/User/InterviewStart";
import InterviewResult from "./pages/User/InterviewResult";
import InterviewHistory from "./pages/User/InterviewHistory";
import InterviewDetails from "./pages/User/InterviewDetails";
import PerformanceChart from "./pages/User/PerformanceChart";
import Support from "./pages/User/Support";
import Settings from "./pages/User/Settings";

// Admin Pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminInterview from "./pages/Admin/AdminInterview";
import AdminProfile from "./pages/Admin/AdminProfile";
import AdminSettings from "./pages/Admin/AdminSettings";

// Routes
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>

            <Routes>
                {/* ==================================
                    PUBLIC ROUTES
                ================================== */}
                {/* Main Home Page */}
                <Route
                    path="/"
                    element={<Home />}
                />

                {/* Optional /home URL */}
                <Route
                    path="/home"
                    element={<Home />}
                />

                {/* Login */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* Register */}
                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* Forgot Password */}
                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                {/* Verify OTP */}
                <Route
                    path="/verify-otp"
                    element={<VerifyOTP />}
                />

                {/* Reset Password */}
                <Route
                    path="/reset-password"
                    element={<ResetPassword />}
                />

                {/* ==================================
                    PROTECTED ROUTES
                ================================== */}
                <Route element={<ProtectedRoute requiredRole="user" />}>
                    {/* Dashboard */}
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    {/* Profile */}
                    <Route
                        path="/profile"
                        element={<Profile />}
                    />

                    {/* Profile Improvement */}
                    <Route
                        path="/profile-improvement"
                        element={<ProfileImprovement />}
                    />

                    {/* Help & Support */}
                    <Route
                        path="/support"
                        element={<Support />}
                    />

                    {/* Setting */}
                    <Route
                        path="/settings"
                        element={<Settings />}
                    />

                    {/* Interview Setup */}
                    <Route
                        path="/interview/setup"
                        element={<InterviewSetup />}
                    />

                    {/* Interview Start */}
                    <Route
                        path="/interview/start"
                        element={<InterviewStart />}
                    />

                    {/* Interview Result */}
                    <Route
                        path="/interview/result"
                        element={<InterviewResult />}
                    />

                    {/* Interview History */}
                    <Route
                        path="/interview/history"
                        element={<InterviewHistory />}
                    />

                    {/* Performance Chart */}
                    <Route
                        path="/interview/performance"
                        element={<PerformanceChart />}
                    />

                    {/* Interview Details */}
                    <Route
                        path="/interview/details/:id"
                        element={<InterviewDetails />}
                    />
                </Route>

                {/* ==================================
                    ADMIN ROUTE
                ================================== */}
                <Route element={<ProtectedRoute requiredRole="admin" />}>
                    <Route
                        path="/admin-dashboard"
                        element={<AdminDashboard />}
                    />

                    <Route
                        path="/admin-users"
                        element={<AdminUsers />}
                    />

                    <Route
                        path="/admin-interviews"
                        element={<AdminInterview />}
                    />

                    <Route
                        path="/admin-profile"
                        element={<AdminProfile />}
                    />

                    <Route
                        path="/admin-settings"
                        element={<AdminSettings />}
                    />
                </Route>

                {/* ==================================
                    INVALID URL
                ================================== */}
                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>

        </BrowserRouter>
    );
}

export default App;
