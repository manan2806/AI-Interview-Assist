import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ProfileImprovement from "./pages/ProfileImprovement";
import InterviewSetup from "./pages/InterviewSetup";
import InterviewStart from "./pages/InterviewStart";
import InterviewResult from "./pages/InterviewResult";
import InterviewHistory from "./pages/InterviewHistory";
import InterviewDetails from "./pages/InterviewDetails";

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

                <Route element={<ProtectedRoute />}>

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


                    {/* Interview Details */}
                    <Route
                        path="/interview/details/:id"
                        element={<InterviewDetails />}
                    />

                </Route>


                {/* ==================================
                    INVALID URL
                ================================== */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;
