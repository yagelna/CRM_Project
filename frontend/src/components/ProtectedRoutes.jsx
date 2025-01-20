import { Outlet, Navigate } from "react-router-dom";

const ProtectedRoute = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        return <Navigate to="/login" />;
    }
    return <Outlet />;
}

export default ProtectedRoute;