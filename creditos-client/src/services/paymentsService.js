import api from "../api";

export const fetchPayments = (q) => api.get("/payments", { params: { q } });
export const fetchPayment = (id) => api.get(`/payments/${id}`);
export const createPayment = (payload) => api.post("/payments", payload);
export const updatePayment = (id, payload) => api.put(`/payments/${id}`, payload);
export const deletePayment = (id) => api.delete(`/payments/${id}`);
