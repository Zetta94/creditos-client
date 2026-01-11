
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { fetchCredit } from "../services/creditsService";

export default function CreditoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [credito, setCredito] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        fetchCredit(id)
            .then(res => {
                setCredito(res.data);
                setError(null);
            })
            .catch(() => {
                setError("No se pudo cargar el crédito");
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return <div className="mx-auto max-w-5xl px-4 py-6 text-gray-500">Cargando crédito...</div>;
    }
    if (error || !credito) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-6 text-red-400">
                {error || "Crédito no encontrado."}
                <button
                    onClick={() => navigate("/creditos")}
                    className="ml-4 rounded-md bg-gray-700 px-3 py-2 hover:bg-gray-600 text-white"
                >
                    Volver
                </button>
            </div>
        );
    }

    const cliente = credito.client;
    const cobrador = credito.user;
    const pagosCredito = credito.payments || [];
    const progreso = credito.totalInstallments ? Math.round((credito.paidInstallments / credito.totalInstallments) * 100) : 0;
    const chartData = pagosCredito.length > 0
        ? pagosCredito.map((p) => ({
            fecha: new Date(p.date).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short",
            }),
            monto: p.amount,
        }))
        : [{ fecha: "Sin pagos", monto: 0 }];

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
            {/* === HEADER MODERNO === */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 shadow-sm dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* IZQUIERDA */}
                    <div className="space-y-1.5">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            Crédito de{" "}
                            <span className="text-blue-700 dark:text-blue-400">
                                {cliente?.name || "Cliente desconocido"}
                            </span>
                        </h1>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium text-gray-800 dark:text-gray-200">Cobrador:</span>{" "}
                            {cobrador?.name || "Sin asignar"}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
                                </svg>
                                Inicio: {new Date(credito.startDate).toLocaleDateString("es-AR")}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Vencimiento: {new Date(credito.dueDate).toLocaleDateString("es-AR")}
                            </span>
                        </div>
                    </div>

                    {/* DERECHA */}
                    <div className="flex flex-col items-end gap-2">
                        <EstadoPill estado={credito.status} />
                    </div>
                </div>

            </div>


            {/* === KPIs === */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard
                    label="Monto total"
                    value={`$${credito.amount.toLocaleString("es-AR")}`}
                />
                <KpiCard
                    label="Cuotas"
                    value={`${credito.paidInstallments}/${credito.totalInstallments}`}
                />
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Progreso</p>
                    <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                            className="h-full bg-blue-600"
                            style={{ width: `${progreso}%` }}
                        />
                    </div>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {progreso}% pagado
                    </p>
                </div>
            </div>

            {/* === HISTORIAL Y CHART === */}
            <section className="grid gap-4 lg:grid-cols-2">
                {/* === Historial de pagos === */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-3 text-lg font-semibold">Historial de pagos</h2>

                    {/* Mobile: Cards */}
                    <div className="grid gap-2 sm:hidden">
                        {pagosCredito.length > 0 ? (
                            pagosCredito.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                                >
                                    <span className="text-gray-500">
                                        {new Date(p.date).toLocaleDateString("es-AR")}
                                    </span>
                                    <span className="font-medium">
                                        ${p.amount.toLocaleString("es-AR")}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm">Sin pagos registrados.</p>
                        )}
                    </div>

                    {/* Desktop: Tabla */}
                    <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full text-left text-sm">
                            <thead className="text-gray-500">
                                <tr>
                                    <th className="py-2 pr-3 font-medium">Fecha</th>
                                    <th className="py-2 font-medium">Monto</th>
                                    <th className="py-2 font-medium">Nota</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {pagosCredito.length > 0 ? (
                                    pagosCredito.map((p) => (
                                        <tr key={p.id}>
                                            <td className="py-2 pr-3">
                                                {new Date(p.date).toLocaleDateString("es-AR")}
                                            </td>
                                            <td className="py-2">
                                                ${p.amount.toLocaleString("es-AR")}
                                            </td>
                                            <td className="py-2 text-gray-500">{p.note}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="py-3 text-center text-gray-500">
                                            Sin pagos registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* === Gráfico === */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-3 text-lg font-semibold">Pagos por fecha</h2>
                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis dataKey="fecha" stroke="#aaa" />
                                <YAxis stroke="#aaa" />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="monto"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* === BOTONES === */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                    onClick={() => navigate("/creditos")}
                    className="w-full sm:w-auto rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                    Volver
                </button>
                <button
                    onClick={() => navigate(`/creditos/${id}/cancelar`)}
                    className="w-full sm:w-auto rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                    Cancelar crédito
                </button>
            </div>
        </div>
    );
}

/* === Subcomponentes UI === */
function estadoClasses(estado) {
    return {
        PENDING:
            "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
        PAID:
            "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        OVERDUE:
            "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    }[estado];
}

function EstadoPill({ estado }) {
    const label =
        estado === "PENDING"
            ? "Pendiente"
            : estado === "PAID"
                ? "Pagado"
                : "Vencido";
    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${estadoClasses(
                estado
            )}`}
        >
            {label}
        </span>
    );
}

function KpiCard({ label, value }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {value}
            </p>
        </div>
    );
}
