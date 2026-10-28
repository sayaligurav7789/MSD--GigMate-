import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUserState] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("gigmate_token"));
    const [loading, setLoading] = useState(true);
    async function refresh() {
        if (!localStorage.getItem("gigmate_token")) {
            setUserState(null);
            setLoading(false);
            return;
        }
        try {
            const { data } = await api.get("/auth/me");
            setUserState(data.user);
        }
        catch {
            localStorage.removeItem("gigmate_token");
            setToken(null);
            setUserState(null);
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    async function login(email, password) {
        const { data } = await api.post("/auth/login", {
            email,
            password,
        });
        localStorage.setItem("gigmate_token", data.token);
        setToken(data.token);
        setUserState(data.user);
        return data.user;
    }
    async function signup(payload) {
        // Intentionally does NOT log the user in. Caller should redirect to /login.
        await api.post("/auth/signup", payload);
    }
    function logout() {
        localStorage.removeItem("gigmate_token");
        setToken(null);
        setUserState(null);
    }
    function setUser(u) {
        setUserState(u);
    }
    return (_jsx(AuthContext.Provider, { value: { user, token, loading, login, signup, logout, refresh, setUser }, children: children }));
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
