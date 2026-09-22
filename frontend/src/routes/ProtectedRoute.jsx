import { Navigate, Outlet } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";

function ProtectedRoute() {

    if (!isLoggedIn()) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;