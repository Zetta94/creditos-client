import api from "../api";

export const fetchReports = (params = {}) => api.get("/reports", { params });
export const fetchReport = (id) => api.get(`/reports/${id}`);
export const createReport = (payload) => api.post("/reports", payload);
export const updateReport = (id, payload) => api.put(`/reports/${id}`, payload);
export const deleteReport = (id) => api.delete(`/reports/${id}`);

export const startReport = () => api.post("/reports/start");
export const finalizeReport = () => api.post("/reports/finalize");
export const fetchWeeklyPayrollPreview = () => api.get("/reports/weekly-payroll/preview");
export const fetchWeeklyPayrollHistory = (params = {}) => api.get("/reports/weekly-payroll/history", { params });
export const generateWeeklyPayroll = () => api.post("/reports/weekly-payroll");
export const fetchMyReports = (params = {}) => api.get("/reports/my", { params });
export const fetchReportsByUser = (userId, params = {}) => api.get(`/reports/user/${userId}`, { params });
