import api from "../api";

export const fetchSpecialCredits = (params = {}) => {
    const query = { page: 1, pageSize: 10, ...params };
    return api.get("/special-credits", { params: query });
};

export const createSpecialCredit = (payload) => api.post("/special-credits", payload);
export const fetchSpecialCredit = (id) => api.get(`/special-credits/${id}`);
export const updateSpecialCredit = (id, payload) => api.put(`/special-credits/${id}`, payload);
