import api from "../api";

export const login = (creds) => api.post("/auth/login", creds);
export const fetchCurrentUser = () => api.get("/auth/current", { params: { _t: Date.now() } });
export const logoutRemote = () => Promise.resolve();
