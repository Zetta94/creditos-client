import api from "../api";

export const fetchSpecialCredits = (params = {}) => {
    const query = { page: 1, pageSize: 10, ...params };
    return api.get("/special-credits", { params: query });
};

export const createSpecialCredit = (payload) => api.post("/special-credits", payload);
