
import { useEffect, useMemo, useState } from "react";
import { HiCash, HiCheckCircle, HiSwitchHorizontal, HiTrendingUp, HiUserGroup } from "react-icons/hi";
import { fetchMyReports } from "../services/reportsService";
import Pagination from "../components/Pagination";

export default function ReportesCobrador() {
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
        fetchMyReports()
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

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Cargando reportes...</div>;
    }
    if (error) {
        return <div className="p-6 text-center text-red-500">{error}</div>;
    }
    if (!reportes.length) {
        return <div className="p-6 text-center text-gray-500">No hay reportes registrados.</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#08122f] to-[#0b1f55] px-3 py-4 sm:px-4 sm:py-6">
            <div className="mx-auto max-w-6xl space-y-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-100">
                    Mis reportes
                </h1>

                <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                    <select
                        value={filtroMes}
                        onChange={(e) => setFiltroMes(e.target.value)}
                        className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-slate-200"
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
                        className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-slate-200"
                    />

                    <button
                        onClick={() => {
                            setFiltroMes("todos");
                            setFiltroDia("");
                        }}
                        className="rounded-xl border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
                    >
                        Limpiar filtros
                    </button>
                </div>
            </div>
            </div>

            <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/80 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-slate-800/90">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                                Fecha
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                                Clientes visitados
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                                Cobrado en efectivo
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                                Cobrado por MP
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                                Cobrado por transferencia
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                                Total recaudado
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {reportesPaginados.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="text-center py-6 text-gray-500 dark:text-gray-400"
                                >
                                    No hay reportes para los filtros seleccionados.
                                </td>
                            </tr>
                        ) : (
                            reportesPaginados.map((r) => (
                                <tr
                                    key={r.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                                >
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                                        {new Date(r.fechaDeReporte).toLocaleDateString("es-AR", {
                                            weekday: "short",
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {r.clientsVisited}
                                    </td>
                                    <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">
                                        ${Number(r.efectivo || 0).toLocaleString("es-AR")}
                                    </td>
                                    <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-medium">
                                        ${Number(r.mercadopago || 0).toLocaleString("es-AR")}
                                    </td>
                                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400 font-medium">
                                        ${Number(r.transferencia || 0).toLocaleString("es-AR")}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
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
                        <div key={r.id} className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-sm">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {new Date(r.fechaDeReporte).toLocaleDateString("es-AR", {
                                    weekday: "short",
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </p>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Clientes visitados: <span className="font-medium">{r.clientsVisited}</span></p>
                            <p className="text-xs text-green-600 dark:text-green-400">Efectivo: ${Number(r.efectivo || 0).toLocaleString("es-AR")}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">MP: ${Number(r.mercadopago || 0).toLocaleString("es-AR")}</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400">Transferencia: ${Number(r.transferencia || 0).toLocaleString("es-AR")}</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">Total: ${Number(r.total || 0).toLocaleString("es-AR")}</p>
                        </div>
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

            {reportesFiltrados.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 mt-6">
                    <Card
                        icon={<HiCash className="h-6 w-6 text-green-500" />}
                        label="Total efectivo"
                        value={`$${reportesFiltrados
                            .reduce((sum, r) => sum + Number(r.efectivo || 0), 0)
                            .toLocaleString("es-AR")}`}
                    />
                    <Card
                        icon={<HiCheckCircle className="h-6 w-6 text-blue-500" />}
                        label="Total MP"
                        value={`$${reportesFiltrados
                            .reduce((sum, r) => sum + Number(r.mercadopago || 0), 0)
                            .toLocaleString("es-AR")}`}
                    />
                    <Card
                        icon={<HiSwitchHorizontal className="h-6 w-6 text-purple-500" />}
                        label="Total transferencia"
                        value={`$${reportesFiltrados
                            .reduce((sum, r) => sum + Number(r.transferencia || 0), 0)
                            .toLocaleString("es-AR")}`}
                    />
                    <Card
                        icon={<HiTrendingUp className="h-6 w-6 text-amber-500" />}
                        label="Total recaudado"
                        value={`$${reportesFiltrados
                            .reduce((sum, r) => sum + Number(r.total || 0), 0)
                            .toLocaleString("es-AR")}`}
                    />
                    <Card
                        icon={<HiUserGroup className="h-6 w-6 text-sky-500" />}
                        label="Clientes visitados"
                        value={reportesFiltrados
                            .reduce((sum, r) => sum + Number(r.clientsVisited || 0), 0)
                            .toLocaleString("es-AR")}
                    />
                </div>
            )}
        </div>
        </div>
    );
}

/* ===== Tarjeta resumen ===== */
function Card({ icon, label, value }) {
    return (
        <div className="flex min-h-[96px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-4 transition">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                <div className="shrink-0">{icon}</div>
            </div>
            <div className="mt-2 text-right sm:text-left">
                <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {value}
                </p>
            </div>
        </div>
    );
}
