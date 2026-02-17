import { useMemo, useState, useEffect } from "react";
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
import { fetchDashboardResumen } from "../services/dashboardService";
import { fetchMessages } from "../services/messagesService";
import MessageCard from "../components/messages/MessageCard";

const ingresosPorDia = [
    { fecha: "Lun", monto: 22000 },
    { fecha: "Mar", monto: 27500 },
    { fecha: "MiÃ©", monto: 31000 },
    { fecha: "Jue", monto: 28000 },
    { fecha: "Vie", monto: 36000 },
];

const clientesPorConfianza = [
    { tipo: "Alta", valor: 40 },
    { tipo: "Media", valor: 30 },
    { tipo: "Baja", valor: 10 },
    { tipo: "Morosos", valor: 20 },
];

const COLORS = ["#10b981", "#3b82f6", "#fbbf24", "#ef4444"];

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

export default function HomeDashboard() {
    const navigate = useNavigate();
    const [range, setRange] = useState("Semana"); // estÃ©tica: selector simple
    const [resumen, setResumen] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(true);
    const [messagesError, setMessagesError] = useState(null);

    useEffect(() => {
        setLoading(true);
        fetchDashboardResumen()
            .then(res => {
                setResumen(res.data);
                setError(null);
            })
            .catch(() => setError("No se pudo cargar el resumen"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let active = true;
        setMessagesLoading(true);
        fetchMessages()
            .then(res => {
                if (!active) return;
                const data = Array.isArray(res.data?.data)
                    ? res.data.data
                    : Array.isArray(res.data)
                        ? res.data
                        : [];
                setMessages(data.slice(0, 6));
                setMessagesError(null);
            })
            .catch(() => {
                if (!active) return;
                setMessagesError("No se pudieron cargar los mensajes.");
            })
            .finally(() => {
                if (!active) return;
                setMessagesLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const totalClientes = useMemo(
        () => clientesPorConfianza.reduce((acc, c) => acc + c.valor, 0),
        []
    );

    if (loading) return <div className="text-center py-10 text-gray-500">Cargando resumen...</div>;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
    if (!resumen) return null;

    const currencyFormatter = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
    const pagosHoyFormatted = currencyFormatter.format(resumen.pagosHoy ?? 0);

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <h1 className="text-xl font-bold sm:text-2xl">Resumen general</h1>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => navigate("/creditos/nuevo")}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:ring-2 focus:ring-blue-400"
                    >
                        + Nuevo crÃ©dito
                    </button>
                    <button
                        onClick={() => navigate("/clientes/nuevo")}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                        + Nuevo cliente
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    icon={<HiCash className="h-8 w-8 text-green-500" />}
                    label="CrÃ©ditos activos"
                    value={resumen.creditosActivos}
                />
                <KpiCard
                    icon={<HiCurrencyDollar className="h-8 w-8 text-blue-500" />}
                    label="Pagos de hoy"
                    value={pagosHoyFormatted}
                />
                <KpiCard
                    icon={<HiUsers className="h-8 w-8 text-purple-500" />}
                    label="Usuarios activos"
                    value={resumen.usuarios}
                />
                <KpiCard
                    icon={<HiExclamation className="h-8 w-8 text-red-500" />}
                    label="Clientes deudores"
                    value={resumen.clientesDeudores}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Ingresos</h2>
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

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-3 text-lg font-semibold">DistribuciÃ³n de clientes</h2>
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
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Detalle financiero</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Explora el detalle mensual y anual en la vista dedicada.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate("/finanzas/detalle")}
                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                        Ir al detalle
                    </button>
                </div>
            </section>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold">Mensajes importantes</h2>
                {messagesLoading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cargando mensajes...</p>
                ) : messagesError ? (
                    <p className="text-sm text-red-500 dark:text-red-400">{messagesError}</p>
                ) : messages.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No hay mensajes urgentes.</p>
                ) : (
                    <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {messages.map((m) => (
                            <li key={m.id}>
                                <MessageCard message={m} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

