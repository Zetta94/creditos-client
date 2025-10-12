import { useMemo, useState } from "react";
import { HiUsers, HiCurrencyDollar, HiExclamation, HiCash } from "react-icons/hi";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";

/* === Mock data (sin cambios de fondo) === */
const resumenMock = { creditosActivos: 54, pagosHoy: 18, usuarios: 5, clientesDeudores: 7 };

const ingresosPorDia = [
    { fecha: "Lun", monto: 22000 },
    { fecha: "Mar", monto: 27500 },
    { fecha: "Mié", monto: 31000 },
    { fecha: "Jue", monto: 28000 },
    { fecha: "Vie", monto: 36000 },
];

const clientesPorConfianza = [
    { tipo: "Alta", valor: 40 },
    { tipo: "Media", valor: 30 },
    { tipo: "Baja", valor: 10 },
    { tipo: "Morosos", valor: 20 },
];

const mensajesImportantes = [
    { id: 1, tipo: "VENCIMIENTO", cliente: "Juan Pérez", fecha: "2025-10-11" },
    { id: 2, tipo: "IMPAGO", cliente: "Laura Gómez", fecha: "2025-10-10" },
    { id: 3, tipo: "VENCIMIENTO", cliente: "Carlos Díaz", fecha: "2025-10-09" },
];

const COLORS = ["#10b981", "#3b82f6", "#fbbf24", "#ef4444"];

export default function HomeDashboard() {
    const navigate = useNavigate();
    const [range, setRange] = useState("Semana"); // estética: selector simple

    const totalClientes = useMemo(
        () => clientesPorConfianza.reduce((acc, c) => acc + c.valor, 0),
        []
    );

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            {/* ===== Header + acciones rápidas (opcional) ===== */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <h1 className="text-xl font-bold sm:text-2xl">Resumen general</h1>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => navigate("/creditos/nuevo")}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:ring-2 focus:ring-blue-400"
                    >
                        + Nuevo crédito
                    </button>
                    <button
                        onClick={() => navigate("/clientes/nuevo")}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                        + Nuevo cliente
                    </button>
                </div>
            </div>

            {/* ===== KPIs ===== */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    icon={<HiCash className="h-8 w-8 text-green-500" />}
                    label="Créditos activos"
                    value={resumenMock.creditosActivos}
                />
                <KpiCard
                    icon={<HiCurrencyDollar className="h-8 w-8 text-blue-500" />}
                    label="Pagos de hoy"
                    value={resumenMock.pagosHoy}
                />
                <KpiCard icon={<HiUsers className="h-8 w-8 text-purple-500" />} label="Usuarios activos" value={resumenMock.usuarios} />
                <KpiCard
                    icon={<HiExclamation className="h-8 w-8 text-red-500" />}
                    label="Clientes deudores"
                    value={resumenMock.clientesDeudores}
                />
            </div>

            {/* ===== Gráficos ===== */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* LineChart de ingresos */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Ingresos</h2>
                        {/* selector simple (estético) */}
                        <div className="flex gap-1 rounded-lg border border-gray-200 p-1 dark:border-gray-700">
                            {["Hoy", "Semana", "Mes"].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    className={[
                                        "rounded-md px-2 py-1 text-xs",
                                        range === r
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                                    ].join(" ")}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={ingresosPorDia}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis dataKey="fecha" stroke="#aaa" />
                                <YAxis stroke="#aaa" />
                                <Tooltip />
                                <Line type="monotone" dataKey="monto" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* PieChart de confianza */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-3 text-lg font-semibold">Distribución de clientes</h2>
                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={clientesPorConfianza}
                                    dataKey="valor"
                                    nameKey="tipo"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({ tipo, valor }) =>
                                        `${tipo}: ${Math.round((valor / totalClientes) * 100)}%`
                                    }
                                >
                                    {clientesPorConfianza.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Leyenda simple */}
                    <ul className="mt-3 flex flex-wrap gap-3 text-sm">
                        {clientesPorConfianza.map((c, i) => (
                            <li key={c.tipo} className="flex items-center gap-2">
                                <span
                                    className="inline-block h-3 w-3 rounded-sm"
                                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                                <span className="text-gray-700 dark:text-gray-200">
                                    {c.tipo} ({Math.round((c.valor / totalClientes) * 100)}%)
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* ===== Panel de actividad ===== */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold">Mensajes importantes</h2>
                {mensajesImportantes.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No hay mensajes urgentes.</p>
                ) : (
                    <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {mensajesImportantes.map((m) => (
                            <li
                                key={m.id}
                                className={[
                                    "flex items-start justify-between gap-3 rounded-lg border p-3",
                                    m.tipo === "IMPAGO"
                                        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                                        : "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
                                ].join(" ")}
                            >
                                <div>
                                    {m.tipo === "IMPAGO" ? (
                                        <p>
                                            ⚠️ <b>{m.cliente}</b> no realizó su pago.
                                        </p>
                                    ) : (
                                        <p>
                                            ⏰ <b>{m.cliente}</b> tiene un pago próximo a vencer.
                                        </p>
                                    )}
                                    <p className="text-xs opacity-70">{m.fecha}</p>
                                </div>
                                <span className="rounded px-2 py-1 text-xs uppercase text-white"
                                    style={{ backgroundColor: m.tipo === "IMPAGO" ? "#dc2626" : "#d97706" }}
                                >
                                    Importante
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

/* ===== Subcomponentes ===== */

function KpiCard({ icon, label, value }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="shrink-0">{icon}</div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
            </div>
        </div>
    );
}
