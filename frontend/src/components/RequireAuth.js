import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardPathFor, profileSetupPathFor } from "../lib/api";
export default function RequireAuth({ children, role, allowIncompleteProfile = false, }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return _jsx("p", { className: "max-w-7xl mx-auto px-6 py-10 text-gray-400", children: "Loading..." });
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    if (role && user.role !== role) {
        return _jsx(Navigate, { to: dashboardPathFor(user.role), replace: true });
    }
    if (!user.isProfileComplete && !allowIncompleteProfile) {
        return _jsx(Navigate, { to: profileSetupPathFor(user.role), replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
