import api from "../api";

export const fetchMessages = (params = {}) => api.get("/messages", { params });
export const fetchMessage = (id) => api.get(`/messages/${id}`);
export const createMessage = (payload) => api.post("/messages", payload);
export const updateMessage = (id, payload) => api.put(`/messages/${id}`, payload);
export const deleteMessage = (id) => api.delete(`/messages/${id}`);
