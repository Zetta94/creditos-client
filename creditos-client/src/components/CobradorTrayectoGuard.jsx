import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { fetchMyReports } from "../services/reportsService";
import { useDispatch } from "react-redux";
import { setTrayectoActivo } from "../store/trayectoSlice";

export default function CobradorTrayectoGuard({ children, requireActive = true }) {
    const [loading, setLoading] = useState(true);
    const [activo, setActivo] = useState(false);
    const location = useLocation();
    const dispatch = useDispatch();

    useEffect(() => {
        let mounted = true;
        async function check() {
            setLoading(true);
            try {
                const res = await fetchMyReports();
                const reportes = Array.isArray(res?.data?.data) ? res.data.data : [];
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const existeHoy = reportes.find(r => {
                    const fecha = new Date(r.fechaDeReporte);
                    fecha.setHours(0, 0, 0, 0);
                    return fecha.getTime() === hoy.getTime() && !r.finalized;
                });
                if (mounted) {
                    const estaActivo = Boolean(existeHoy);
                    setActivo(estaActivo);
                    dispatch(setTrayectoActivo(estaActivo));
                }
            } catch {
                if (mounted) {
                    setActivo(false);
                    dispatch(setTrayectoActivo(false));
                }
            } finally {
                if (mounted) setLoading(false);
            }
        }
        check();
        return () => { mounted = false; };
    }, [dispatch]);

    if (loading) return <div className="p-8 text-center text-gray-500">Verificando acceso...</div>;
    if (requireActive && !activo) {
        return <Navigate to="/cobrador/dashboard" state={{ from: location }} replace />;
    }
    return children;
}
