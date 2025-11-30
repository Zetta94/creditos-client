import api from "../api";

export const fetchAssignments = () => api.get("/assignments");
export const fetchAssignment = (id) => api.get(`/assignments/${id}`);
export const createAssignment = (payload) => api.post("/assignments", payload);
export const updateAssignment = (id, payload) => api.put(`/assignments/${id}`, payload);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`);
