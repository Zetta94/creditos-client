import api from "../api";

// acepta un objeto params para pasarlo como query params al endpoint
export const fetchAssignments = (params = {}) => api.get("/assignments", { params });
export const fetchAssignmentsEnriched = (params = {}) => api.get("/assignments/enriched", { params });
export const fetchUpcomingStarts = (params = {}) => api.get("/assignments/upcoming-starts", { params });
export const fetchAssignment = (id) => api.get(`/assignments/${id}`);
export const createAssignment = (payload) => api.post("/assignments", payload);
export const updateAssignment = (id, payload) => api.put(`/assignments/${id}`, payload);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`);
export const reorderAssignments = (assignments) => api.post("/assignments/reorder/batch", { assignments });
export const postponeAssignment = (id) => api.post(`/assignments/${id}/postpone`);
