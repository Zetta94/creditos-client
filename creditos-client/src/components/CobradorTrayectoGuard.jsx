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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060b1d] flex items-center justify-center p-8"
                 style={{ backgroundImage: "radial-gradient(circle at 50% -20%, #1a2b5a 0%, #060b1d 80%)" }}>
                <div className="flex flex-col items-center gap-4 animate-fade-in text-center">
                    <div className="h-10 w-10 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin shadow-lg shadow-blue-500/20" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verificando Acceso</p>
                </div>
            </div>
        );
    }
    if (requireActive && !activo) {
        return <Navigate to="/cobrador/dashboard" state={{ from: location }} replace />;
    }
    return children;
}
