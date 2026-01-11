import api from "../api";

export const fetchDashboardResumen = () => api.get("/dashboard/resumen");
export const fetchDashboardResumenCobrador = () => api.get("/dashboard/resumen/cobrador");
