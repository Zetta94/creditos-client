import React from "react";
import { mockUsers, mockPayments } from "../mocks/mockData.js";
import { HiCurrencyDollar, HiTrendingUp, HiCalendar } from "react-icons/hi";

export default function SueldoCobrador() {
    const userId = localStorage.getItem("userId");
    const cobrador = mockUsers.find((u) => u.id === userId);

    if (!cobrador || cobrador.role !== "COBRADOR") {
        return (
            <div className="p-6 text-center text-red-400">
                No tienes permiso para acceder a esta vista.
            </div>
        );
    }

    // === Calcular datos ===
    const pagosDelCobrador = mockPayments.filter((p) => p.employeeId === cobrador.id);

    // Filtrar solo los pagos de la última semana
    const hoy = new Date();
    const haceUnaSemana = new Date();
    haceUnaSemana.setDate(hoy.getDate() - 7);

    const pagosSemana = pagosDelCobrador.filter(
        (p) => new Date(p.date) >= haceUnaSemana && new Date(p.date) <= hoy
    );

    const totalPagosSemana = pagosSemana.reduce((acc, p) => acc + p.amount, 0);
    const comision = (totalPagosSemana * (cobrador.comisions || 0)) / 100;
    const totalSemana = cobrador.salary + comision;

    return (
        <div className="p-6">
            {/* === Header === */}
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Sueldo semanal de {cobrador.name}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Tipo de salario: {cobrador.salaryType}
                    </p>
                </div>
            </div>

            {/* === Cards resumen === */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-5 shadow dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm text-gray-500 dark:text-gray-400">Sueldo base</h3>
                        <HiCurrencyDollar className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        ${cobrador.salary.toLocaleString("es-AR")}
                    </p>
                </div>

                <div className="rounded-xl bg-white p-5 shadow dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm text-gray-500 dark:text-gray-400">Comisión</h3>
                        <HiTrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        ${comision.toLocaleString("es-AR")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {cobrador.comisions}% sobre pagos de la semana
                    </p>
                </div>

                <div className="rounded-xl bg-white p-5 shadow dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm text-gray-500 dark:text-gray-400">Total semanal</h3>
                        <HiCalendar className="h-5 w-5 text-purple-500" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        ${totalSemana.toLocaleString("es-AR")}
                    </p>
                </div>
            </div>

            {/* === Tabla de pagos === */}
            <div className="mt-8">
                <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Pagos registrados esta semana
                </h2>

                {pagosSemana.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                                        Monto
                                    </th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                                        Nota
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {pagosSemana.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                            {new Date(p.date).toLocaleDateString("es-AR")}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 font-semibold">
                                            ${p.amount.toLocaleString("es-AR")}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                            {p.note}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No se registraron pagos esta semana.
                    </p>
                )}
            </div>
        </div>
    );
}
