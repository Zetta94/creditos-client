import { useParams, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const creditosMock = [
    {
        id: "cr1",
        cliente: "Juan Pérez",
        monto: 100000,
        cuotas: 10,
        pagadas: 6,
        estado: "PENDING",
        fechaInicio: "2025-06-10",
        pagos: [
            { mes: "Jun", monto: 10000 },
            { mes: "Jul", monto: 10000 },
            { mes: "Ago", monto: 10000 },
            { mes: "Sep", monto: 10000 },
            { mes: "Oct", monto: 10000 },
            { mes: "Nov", monto: 10000 },
        ],
    },
];

export default function CreditoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();

    const credito = creditosMock.find((c) => c.id === id);
    if (!credito) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 text-red-400">
                Crédito no encontrado.
                <button onClick={() => navigate("/creditos")} className="ml-4 rounded-md bg-gray-700 px-3 py-2 hover:bg-gray-600">
                    Volver
                </button>
            </div>
        );
    }

    const progreso = Math.round((credito.pagadas / credito.cuotas) * 100);

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold sm:text-2xl">Crédito de {credito.cliente}</h1>
                    <p className="text-sm text-gray-400">Inicio: {credito.fechaInicio}</p>
                </div>
                <EstadoPill estado={credito.estado} />
            </div>

            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard label="Monto total" value={`$${credito.monto.toLocaleString("es-AR")}`} />
                <KpiCard label="Cuotas" value={`${credito.pagadas}/${credito.cuotas}`} />
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Progreso</p>
                    <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div className="h-full bg-blue-600" style={{ width: `${progreso}%` }} />
                    </div>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{progreso}% pagado</p>
                </div>
            </div>

            {/* Historial de pagos + chart */}
            <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-3 text-lg font-semibold">Historial de pagos</h2>

                    {/* Lista/cards en móvil */}
                    <div className="grid gap-2 sm:hidden">
                        {credito.pagos.map((p, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
                                <span className="text-gray-500">{p.mes}</span>
                                <span className="font-medium">${p.monto.toLocaleString("es-AR")}</span>
                            </div>
                        ))}
                    </div>

                    {/* Tabla en desktop */}
                    <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full text-left text-sm">
                            <thead className="text-gray-500">
                                <tr>
                                    <th className="py-2 pr-3 font-medium">Mes</th>
                                    <th className="py-2 font-medium">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {credito.pagos.map((p, i) => (
                                    <tr key={i}>
                                        <td className="py-2 pr-3">{p.mes}</td>
                                        <td className="py-2">${p.monto.toLocaleString("es-AR")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Chart */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-3 text-lg font-semibold">Pagos por mes</h2>
                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={credito.pagos}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis dataKey="mes" stroke="#aaa" />
                                <YAxis stroke="#aaa" />
                                <Tooltip />
                                <Line type="monotone" dataKey="monto" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button onClick={() => navigate("/creditos")} className="w-full rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 sm:w-auto">
                    Volver
                </button>
                <button onClick={() => alert("Acción estética: registrar pago")} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-auto">
                    Registrar pago
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
    const label = estado === "PENDING" ? "Pendiente" : estado === "PAID" ? "Pagado" : "Vencido";
    return (
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${estadoClasses(estado)}`}>
            {label}
        </span>
    );
}

function KpiCard({ label, value }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    );
}
