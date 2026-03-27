
import { useEffect, useMemo, useState } from "react";
import { HiCash, HiCheckCircle, HiSwitchHorizontal, HiTrendingUp, HiUserGroup } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { fetchMyReports } from "../services/reportsService";
import Pagination from "../components/Pagination";
import ReportActivityCalendar from "../components/ReportActivityCalendar";

export default function ReportesCobrador() {
    const navigate = useNavigate();
    const [reportes, setReportes] = useState([]);
    const [filtroMes, setFiltroMes] = useState("todos");
    const [filtroDia, setFiltroDia] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportesFiltrados, setReportesFiltrados] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        setLoading(true);
        fetchMyReports({ page: 1, pageSize: 1000 })
            .then(res => {
                const items = Array.isArray(res?.data?.data) ? res.data.data : [];
                setReportes(items);
                setError(null);
            })
            .catch(err => {
                setError("No se pudieron cargar los reportes");
            })
            .finally(() => setLoading(false));
    }, []);

    const mesesDisponibles = useMemo(() => {
        if (!reportes.length) return [];
        const meses = reportes.map((r) =>
            new Date(r.fechaDeReporte).toLocaleString("es-AR", { month: "long" })
        );
        return [...new Set(meses)];
    }, [reportes]);

    useEffect(() => {
        if (!reportes.length) return setReportesFiltrados([]);
        let filtrados = reportes;
        if (filtroMes !== "todos") {
            filtrados = filtrados.filter(
                (r) =>
                    new Date(r.fechaDeReporte).toLocaleString("es-AR", { month: "long" }) ===
                    filtroMes
            );
        }
        if (filtroDia) {
            filtrados = filtrados.filter(
                (r) => r.fechaDeReporte.slice(0, 10) === filtroDia
            );
        }
        filtrados = filtrados.sort(
            (a, b) => new Date(b.fechaDeReporte) - new Date(a.fechaDeReporte)
        );
        setReportesFiltrados(filtrados);
    }, [filtroMes, filtroDia, reportes]);

    useEffect(() => {
        setPage(1);
    }, [filtroMes, filtroDia, reportes.length]);

    const totalItems = reportesFiltrados.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const pageStart = (safePage - 1) * pageSize;
    const reportesPaginados = reportesFiltrados.slice(pageStart, pageStart + pageSize);

    const openReportDetail = (reportId) => {
        navigate(`/cobrador/reportes/${reportId}`);
    };

    const resumenTarjetas = [
        {
            label: "Total efectivo",
            value: `$${reportesFiltrados.reduce((sum, r) => sum + Number(r.efectivo || 0), 0).toLocaleString("es-AR")}`,
            icon: <HiCash className="h-6 w-6 text-emerald-400" />,
        },
        {
            label: "Total MP",
            value: `$${reportesFiltrados.reduce((sum, r) => sum + Number(r.mercadopago || 0), 0).toLocaleString("es-AR")}`,
            icon: <HiCheckCircle className="h-6 w-6 text-sky-400" />,
        },
        {
            label: "Transferencias",
            value: `$${reportesFiltrados.reduce((sum, r) => sum + Number(r.transferencia || 0), 0).toLocaleString("es-AR")}`,
            icon: <HiSwitchHorizontal className="h-6 w-6 text-violet-400" />,
        },
        {
            label: "Total recaudado",
            value: `$${reportesFiltrados.reduce((sum, r) => sum + Number(r.total || 0), 0).toLocaleString("es-AR")}`,
            icon: <HiTrendingUp className="h-6 w-6 text-amber-400" />,
        },
        {
            label: "Clientes visitados",
            value: reportesFiltrados.reduce((sum, r) => sum + Number(r.clientsVisited || 0), 0).toLocaleString("es-AR"),
            icon: <HiUserGroup className="h-6 w-6 text-cyan-400" />,
        },
    ];

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Cargando reportes...</div>;
    }
    if (error) {
        return <div className="p-6 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#08122f] via-[#0b1f55] to-[#112b6d] px-3 py-4 sm:px-4 sm:py-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <div className="rounded-[28px] border border-slate-700/80 bg-slate-900/85 p-4 shadow-[0_22px_50px_-30px_rgba(15,23,42,0.95)] sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-100">
                                Mis reportes
                            </h1>
                            <p className="mt-1 text-sm text-slate-400">Filtros y calendario optimizados para lectura rápida desde celular.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                            <select
                                value={filtroMes}
                                onChange={(e) => setFiltroMes(e.target.value)}
                                className="min-h-11 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-slate-200"
                            >
                                <option value="todos">Todos los meses</option>
                                {mesesDisponibles.map((mes) => (
                                    <option key={mes} value={mes}>
                                        {mes.charAt(0).toUpperCase() + mes.slice(1)}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="date"
                                value={filtroDia}
                                onChange={(e) => setFiltroDia(e.target.value)}
                                className="min-h-11 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-slate-200"
                            />

                            <button
                                onClick={() => {
                                    setFiltroMes("todos");
                                    setFiltroDia("");
                                }}
                                className="min-h-11 rounded-xl border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    </div>
                </div>

                {reportesFiltrados.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {resumenTarjetas.map((item) => (
                            <Card key={item.label} icon={item.icon} label={item.label} value={item.value} />
                        ))}
                    </div>
                )}

                <ReportActivityCalendar
                    reports={reportes}
                    title="Calendario de actividad"
                    darkSurface
                    onReportClick={(report) => openReportDetail(report.id)}
                />

                <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/80 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead className="bg-slate-800/90">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-slate-300">
                                    Fecha
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-300">
                                    Clientes visitados
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-300">
                                    Cobrado en efectivo
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-300">
                                    Cobrado por MP
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-300">
                                    Cobrado por transferencia
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-300">
                                    Total recaudado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {reportesPaginados.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="py-6 text-center text-slate-400"
                                    >
                                        No hay reportes para los filtros seleccionados.
                                    </td>
                                </tr>
                            ) : (
                                reportesPaginados.map((r) => (
                                    <tr
                                        key={r.id}
                                        className="transition hover:bg-slate-800/50"
                                    >
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-200">
                                            {new Date(r.fechaDeReporte).toLocaleDateString("es-AR", {
                                                weekday: "short",
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">
                                            {r.clientsVisited}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-emerald-300">
                                            ${Number(r.efectivo || 0).toLocaleString("es-AR")}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-sky-300">
                                            ${Number(r.mercadopago || 0).toLocaleString("es-AR")}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-violet-300">
                                            ${Number(r.transferencia || 0).toLocaleString("es-AR")}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-100">
                                            ${Number(r.total || 0).toLocaleString("es-AR")}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="sm:hidden space-y-3">
                    {reportesPaginados.length === 0 ? (
                        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-300">
                            No hay reportes para los filtros seleccionados.
                        </div>
                    ) : (
                        reportesPaginados.map((r) => (
                            <button key={r.id} type="button" onClick={() => openReportDetail(r.id)} className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-left shadow-sm transition hover:border-cyan-400/40 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/40">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-100">
                                            {new Date(r.fechaDeReporte).toLocaleDateString("es-AR", {
                                                weekday: "short",
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </p>
                                        <p className="mt-2 text-xs text-slate-400">Clientes visitados: <span className="font-medium text-slate-200">{r.clientsVisited}</span></p>
                                    </div>
                                    <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-100">Detalle</span>
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                    <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-2 text-emerald-300">Efvo. ${Number(r.efectivo || 0).toLocaleString("es-AR")}</div>
                                    <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-2 text-sky-300">MP ${Number(r.mercadopago || 0).toLocaleString("es-AR")}</div>
                                    <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-2 text-violet-300">Transf. ${Number(r.transferencia || 0).toLocaleString("es-AR")}</div>
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-slate-100">Total: ${Number(r.total || 0).toLocaleString("es-AR")}</p>
                                    <span className="text-xs font-medium text-slate-400">Tocar para abrir</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="mt-4">
                    <Pagination
                        page={safePage}
                        pageSize={pageSize}
                        totalItems={totalItems}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setPage(1);
                        }}
                    />
                </div>

            </div>
        </div>
    );
}

/* ===== Tarjeta resumen ===== */
function Card({ icon, label, value }) {
    return (
        <div className="flex min-h-[104px] flex-col justify-between rounded-[24px] border border-slate-700/80 bg-slate-900/85 p-3 shadow-sm sm:p-4 transition">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
                <div className="shrink-0">{icon}</div>
            </div>
            <div className="mt-2 text-right sm:text-left">
                <p className="text-base sm:text-lg font-semibold text-slate-100">
                    {value}
                </p>
            </div>
        </div>
    );
}
