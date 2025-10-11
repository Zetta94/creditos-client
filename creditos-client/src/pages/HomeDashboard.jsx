import { useMemo } from "react";
import { HiUsers, HiCurrencyDollar, HiExclamation, HiCash } from "react-icons/hi";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

const resumenMock = {
    creditosActivos: 54,
    pagosHoy: 18,
    usuarios: 5,
    clientesDeudores: 7,
};

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
    const totalClientes = useMemo(
        () => clientesPorConfianza.reduce((acc, c) => acc + c.valor, 0),
        []
    );

    return (
        <div className="p-6 space-y-6">
            {/* -------- METRICAS RAPIDAS -------- */}
            <h1 className="text-2xl font-bold mb-4">Resumen general</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-3 border border-gray-700">
                    <HiCash className="h-8 w-8 text-green-400" />
                    <div>
                        <p className="text-sm text-gray-400">Créditos activos</p>
                        <p className="text-2xl font-semibold">{resumenMock.creditosActivos}</p>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-3 border border-gray-700">
                    <HiCurrencyDollar className="h-8 w-8 text-blue-400" />
                    <div>
                        <p className="text-sm text-gray-400">Pagos de hoy</p>
                        <p className="text-2xl font-semibold">{resumenMock.pagosHoy}</p>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-3 border border-gray-700">
                    <HiUsers className="h-8 w-8 text-purple-400" />
                    <div>
                        <p className="text-sm text-gray-400">Usuarios activos</p>
                        <p className="text-2xl font-semibold">{resumenMock.usuarios}</p>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-3 border border-gray-700">
                    <HiExclamation className="h-8 w-8 text-red-400" />
                    <div>
                        <p className="text-sm text-gray-400">Clientes deudores</p>
                        <p className="text-2xl font-semibold">{resumenMock.clientesDeudores}</p>
                    </div>
                </div>
            </div>

            {/* -------- GRAFICOS -------- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LineChart de ingresos */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                    <h2 className="text-lg font-semibold mb-3">Ingresos semanales</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={ingresosPorDia}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="fecha" stroke="#aaa" />
                            <YAxis stroke="#aaa" />
                            <Tooltip />
                            <Line type="monotone" dataKey="monto" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* PieChart de confianza */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                    <h2 className="text-lg font-semibold mb-3">Distribución de clientes</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={clientesPorConfianza}
                                dataKey="valor"
                                nameKey="tipo"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ tipo, valor }) => `${tipo}: ${Math.round((valor / totalClientes) * 100)}%`}
                            >
                                {clientesPorConfianza.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* -------- PANEL DE ACTIVIDAD -------- */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <h2 className="text-lg font-semibold mb-4">Mensajes importantes</h2>
                {mensajesImportantes.length === 0 ? (
                    <p className="text-gray-400 text-sm">No hay mensajes urgentes.</p>
                ) : (
                    <ul className="space-y-2">
                        {mensajesImportantes.map((m) => (
                            <li
                                key={m.id}
                                className={`p-3 rounded-lg border flex justify-between ${m.tipo === "IMPAGO"
                                    ? "bg-red-900/40 border-red-700 text-red-300"
                                    : "bg-yellow-900/40 border-yellow-700 text-yellow-200"
                                    }`}
                            >
                                <div>
                                    {m.tipo === "IMPAGO" ? (
                                        <p>⚠️ <b>{m.cliente}</b> no realizó su pago.</p>
                                    ) : (
                                        <p>⏰ <b>{m.cliente}</b> tiene un pago próximo a vencer.</p>
                                    )}
                                    <p className="text-xs text-gray-400">{m.fecha}</p>
                                </div>
                                <span className="text-xs uppercase bg-red-600/70 text-white px-2 py-1 rounded">
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
