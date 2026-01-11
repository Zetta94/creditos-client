import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { fetchMyReports } from "../services/reportsService";

export default function CobradorTrayectoGuard({ children }) {
    const [loading, setLoading] = useState(true);
    const [activo, setActivo] = useState(false);
    const location = useLocation();

    useEffect(() => {
        let mounted = true;
        async function check() {
            setLoading(true);
            try {
                const res = await fetchMyReports();
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const existeHoy = res.data?.find(r => {
                    const fecha = new Date(r.fechaDeReporte);
                    fecha.setHours(0, 0, 0, 0);
                    return fecha.getTime() === hoy.getTime();
                });
                if (mounted) setActivo(!!existeHoy);
            } catch {
                if (mounted) setActivo(false);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        check();
        return () => { mounted = false; };
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Verificando acceso...</div>;
    if (!activo) return <Navigate to="/cobrador/dashboard" state={{ from: location }} replace />;
    return children;
}
