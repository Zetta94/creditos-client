import api from "../api";

export const fetchCredits = (params = {}) => {
    const query = { ...params };
    if (!query.page) query.page = 1;
    if (!query.pageSize) query.pageSize = 1000;
    return api.get("/credits", { params: query });
};
export const fetchCredit = (id) => api.get(`/credits/${id}`);
export const createCredit = (payload) => api.post("/credits", payload);
export const updateCredit = (id, payload) => api.put(`/credits/${id}`, payload);
export const deleteCredit = (id) => api.delete(`/credits/${id}`);
