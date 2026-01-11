import api from "../api";

export const fetchCredits = (params = {}) => api.get("/credits", { params });
export const fetchCredit = (id) => api.get(`/credits/${id}`);
export const createCredit = (payload) => api.post("/credits", payload);
export const updateCredit = (id, payload) => api.put(`/credits/${id}`, payload);
export const deleteCredit = (id) => api.delete(`/credits/${id}`);
