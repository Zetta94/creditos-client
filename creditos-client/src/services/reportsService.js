import api from "../api";

export const fetchReports = (q) => api.get("/reports", { params: { q } });
export const fetchReport = (id) => api.get(`/reports/${id}`);
export const createReport = (payload) => api.post("/reports", payload);
export const updateReport = (id, payload) => api.put(`/reports/${id}`, payload);
export const deleteReport = (id) => api.delete(`/reports/${id}`);
