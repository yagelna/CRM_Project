// /src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../AxiosInstance";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);        // { id, email, groups:[...], permissions:[...] }
    const [loading, setLoading] = useState(true);

    const refreshMe = async () => {
        try {
            const { data } = await axiosInstance.get("api/user/me/");
            setUser(data);
            localStorage.setItem("userProfile", JSON.stringify(data));
            return data;
        } catch (e) {
            setUser(null);
            localStorage.removeItem("userProfile");
            throw e;
        }
    };

    useEffect(() => {
        let cancelled = false;

        const boot = async () => {
            const token = localStorage.getItem("access_token");
            if (!token) { setLoading(false); return; }
            try {
                const { data } = await axiosInstance.get("/api/user/me/");
                if (!cancelled) setUser(data);
                localStorage.setItem("userProfile", JSON.stringify(data));
            } catch (e) {
                // not logged in / error fetching user / invalid token
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        boot();

        return () => (cancelled = true);
    }, []);

    const hasGroup = (name) =>
        !!user?.groups?.some((g) => g.toLowerCase() === name.toLowerCase());

    const hasPerm = (perm) => {
        if (!user?.permissions) return false;
        if (perm.includes("*")) {
            const suffix = perm.split("*").pop(); // ".access_crm" 
            return user.permissions.some((p) => p.endsWith(suffix));
        }
        return user.permissions.includes(perm);
    };

    const isSuperuser = !!user?.is_superuser;

    const login = async ({ token }) => {
        localStorage.setItem("access_token", token);
    await refreshMe();
  };

    const logout = async () => {
        try {
            await axiosInstance.post("/api/logout/");
        } catch (_) {
            // ignore errors
        } finally {
            localStorage.removeItem("access_token");
            localStorage.removeItem("userProfile");
            setUser(null);
            window.location.href = "/login";
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, hasGroup, hasPerm, isSuperuser, login, logout, refreshMe }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);