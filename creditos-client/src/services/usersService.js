import api from "../api";

export const fetchUsers = (params = {}) => api.get("/users", { params });
export const fetchUser = (id) => api.get(`/users/${id}`);
export const createUser = (payload) => api.post("/users", payload);
export const updateUser = (id, payload) => api.put(`/users/${id}`, payload);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Aliases compatibility with existing slices
export const listUsers = fetchUsers;
export const getUser = fetchUser;
