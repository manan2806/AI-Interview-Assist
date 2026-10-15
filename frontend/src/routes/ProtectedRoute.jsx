import { Navigate, Outlet } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";

function ProtectedRoute({ requiredRole }) {
    if (!isLoggedIn()) {
        return <Navigate to="/login" replace />;
    }

    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch (error) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        return <Navigate to="/login" replace />;
    }

    if (!user || !user.role) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        return <Navigate to="/login" replace />;
    }

    // Admin-only route
    if (requiredRole === "admin" && user.role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }

    // User-only route
    if (requiredRole === "user" && user.role !== "user") {
        return <Navigate to="/admin-dashboard" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;