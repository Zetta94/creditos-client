import api from "../api";

export const fetchDashboardResumen = () => api.get("/dashboard/resumen");
export const fetchDashboardResumenCobrador = () => api.get("/dashboard/resumen/cobrador");
export const fetchDashboardFinancialSummary = () => api.get("/dashboard/resumen/financiero");
export const fetchDashboardFinancialDetail = (params = {}) =>
    api.get("/dashboard/resumen/financiero/detalle", { params });
