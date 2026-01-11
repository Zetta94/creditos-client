
import { useEffect, useMemo, useState } from "react";
import { HiCalendar, HiCash, HiCheckCircle, HiSwitchHorizontal, HiTrendingUp, HiUserGroup } from "react-icons/hi";
import { fetchMyReports } from "../services/reportsService";

export default function ReportesCobrador() {
    const [reportes, setReportes] = useState([]);
    const [filtroMes, setFiltroMes] = useState("todos");
    const [filtroDia, setFiltroDia] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportesFiltrados, setReportesFiltrados] = useState([]);

    useEffect(() => {
        setLoading(true);
        fetchMyReports()
            .then(res => {
                setReportes(res.data || []);
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
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Mis reportes
                </h1>

                {/* Filtros */}
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={filtroMes}
                        onChange={(e) => setFiltroMes(e.target.value)}
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
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
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    />

                    <button
                        onClick={() => {
                            setFiltroMes("todos");
                            setFiltroDia("");
                        }}
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                        Limpiar filtros
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800/80">
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
                        {reportesFiltrados.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="text-center py-6 text-gray-500 dark:text-gray-400"
                                >
                                    No hay reportes para los filtros seleccionados.
                                </td>
                            </tr>
                        ) : (
                            reportesFiltrados.map((r) => (
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

            {/* Resumen general */}
            {reportesFiltrados.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mt-6">
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
    );
}

/* ===== Tarjeta resumen ===== */
function Card({ icon, label, value }) {
    return (
        <div className="flex items-center justify-between sm:justify-start sm:gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md dark:border-gray-700 dark:bg-gray-800 transition">
            <div className="shrink-0">{icon}</div>
            <div className="text-right sm:text-left">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {value}
                </p>
            </div>
        </div>
    );
}
