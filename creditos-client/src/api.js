import axios from "axios";

const isLocalHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const baseURL = isLocalHost
    ? import.meta.env.VITE_API_URL || "http://localhost:3000/api"
    : "/api";
const api = axios.create({ baseURL });

const isPublicAuthPath = (url = "") => {
    const normalized = url.toLowerCase();
    return (
        normalized.includes("/auth/login") ||
        normalized.includes("/auth/request-reset") ||
        normalized.includes("/auth/reset-password")
    );
};

api.interceptors.request.use(config => {
    const token = localStorage.getItem("token");
    const url = config?.url || "";

    if (!isPublicAuthPath(url) && token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers.Authorization) {
        delete config.headers.Authorization;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const requestUrl = String(error?.config?.url || "").toLowerCase();
        const isAuthCurrent = requestUrl.includes("/auth/current");

        if (status === 401 && !isAuthCurrent) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("role");
        }
        return Promise.reject(error);
    }
);

export default api;
