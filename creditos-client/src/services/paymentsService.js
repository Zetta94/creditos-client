import api from "../api";

export const fetchPayments = (params) => {
    const query = typeof params === "string" ? { q: params } : params;
    return api.get("/payments", { params: query });
};
export const fetchPayment = (id) => api.get(`/payments/${id}`);
export const createPayment = (payload) => api.post("/payments", payload);
export const updatePayment = (id, payload) => api.put(`/payments/${id}`, payload);
export const deletePayment = (id) => api.delete(`/payments/${id}`);
export const fetchMyPayments = (params = {}) => api.get("/payments", { params: { scope: "mine", ...params } });
