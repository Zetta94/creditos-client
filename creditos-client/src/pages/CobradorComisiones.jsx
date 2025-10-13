import React from "react";
import { mockUsers, mockPayments } from "../mocks/mockData.js";
import { HiTrendingUp, HiCalendar } from "react-icons/hi";

export default function ComisionesCobrador() {
    const userId = localStorage.getItem("userId");
    const cobrador = mockUsers.find((u) => u.id === userId);

    if (!cobrador || cobrador.role !== "COBRADOR") {
        return (
            <div className="p-6 text-center text-red-400">
                No tienes permiso para acceder a esta vista.
            </div>
        );
    }

    const pagosDelCobrador = mockPayments.filter((p) => p.employeeId === cobrador.id);

    // === Agrupar pagos por periodo ===
    const agruparPorPeriodo = (pagos, modo = "semanal") => {
        const grupos = {};

        pagos.forEach((pago) => {
            const fecha = new Date(pago.date);
            let clave = "";

            if (modo === "mensual") {
                clave = `${fecha.getFullYear()}-${(fecha.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}`;
            } else if (modo === "quincenal") {
                const quincena = fecha.getDate() <= 15 ? "1Q" : "2Q";
                clave = `${fecha.getFullYear()}-${(fecha.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}-${quincena}`;
            } else {
                const primerDia = new Date(fecha);
                primerDia.setDate(fecha.getDate() - fecha.getDay());
                clave = primerDia.toISOString().slice(0, 10);
            }

            if (!grupos[clave]) grupos[clave] = [];
            grupos[clave].push(pago);
        });

        return Object.entries(grupos)
            .map(([periodo, pagos]) => {
                const totalPagos = pagos.reduce((acc, p) => acc + p.amount, 0);
                const comision = (totalPagos * cobrador.comisions) / 100;

                return {
                    periodo,
                    cantidadPagos: pagos.length,
                    totalCobrado: totalPagos,
                    comision,
                };
            })
            .sort((a, b) => (a.periodo < b.periodo ? 1 : -1));
    };

    const [modo, setModo] = React.useState("semanal");
    const comisiones = agruparPorPeriodo(pagosDelCobrador, modo);

    return (
        <div className="p-4 sm:p-6">
            {/* === Header === */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Historial de comisiones
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Cobrador: {cobrador.name} — {cobrador.comisions}% de comisión
                    </p>
                </div>

                <div>
                    <select
                        value={modo}
                        onChange={(e) => setModo(e.target.value)}
                        className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                        <option value="semanal">Semanal</option>
                        <option value="quincenal">Quincenal</option>
                        <option value="mensual">Mensual</option>
                    </select>
                </div>
            </div>

            {/* === Responsive view === */}
            {comisiones.length > 0 ? (
                <>
                    {/* 💻 Tabla (solo visible en pantallas grandes) */}
                    <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-1">
                                            <HiCalendar className="h-4 w-4" />
                                            Periodo
                                        </div>
                                    </th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                                        Pagos registrados
                                    </th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                                        Total cobrado
                                    </th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                                        Comisión generada
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {comisiones.map((c) => (
                                    <tr key={c.periodo}>
                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 font-medium">
                                            {c.periodo}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                                            {c.cantidadPagos}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                            ${c.totalCobrado.toLocaleString("es-AR")}
                                        </td>
                                        <td className="px-4 py-2 text-sm font-semibold text-green-500 dark:text-green-400">
                                            +${c.comision.toLocaleString("es-AR")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 📱 Vista móvil (cards individuales) */}
                    <div className="sm:hidden space-y-4">
                        {comisiones.map((c) => (
                            <div
                                key={c.periodo}
                                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <HiCalendar className="h-5 w-5 text-blue-500" />
                                        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {c.periodo}
                                        </h2>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {c.cantidadPagos} pagos
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    Total cobrado:{" "}
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                        ${c.totalCobrado.toLocaleString("es-AR")}
                                    </span>
                                </div>
                                <div className="text-sm text-green-600 dark:text-green-400">
                                    Comisión:{" "}
                                    <span className="font-semibold">
                                        +${c.comision.toLocaleString("es-AR")}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hay registros de pagos para calcular comisiones.
                </p>
            )}
        </div>
    );
}
