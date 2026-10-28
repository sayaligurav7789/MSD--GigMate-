import axios from "axios";
const baseURL = import.meta.env.VITE_API_URL || "/api";
export const api = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("gigmate_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
export function dashboardPathFor(role) {
    if (role === "admin")
        return "/admin";
    return role === "student" ? "/student/dashboard" : "/client/dashboard";
}
export function profileSetupPathFor(role) {
    if (role === "admin")
        return "/admin";
    return role === "student" ? "/student/profile-setup" : "/client/profile-setup";
}
export function postLoginPathFor(user) {
    return user.isProfileComplete ? dashboardPathFor(user.role) : profileSetupPathFor(user.role);
}
