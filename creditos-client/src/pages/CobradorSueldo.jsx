import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { HiCurrencyDollar, HiTrendingUp, HiCalendar } from "react-icons/hi";
import { fetchMyPayments } from "../services/paymentsService";

const salaryTypeLabels = {
    N_A: "Sin definir",
    DIARIO: "Diario",
    SEMANAL: "Semanal",
    QUINCENAL: "Quincenal",
    MENSUAL: "Mensual",
};

export default function SueldoCobrador() {
    const authUser = useSelector((state) => state.auth.user);
    const storedUser = useMemo(() => {
        if (authUser) return null;
        const raw = localStorage.getItem("user");
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }, [authUser]);

    const cobrador = authUser || storedUser;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagosSemana, setPagosSemana] = useState([]);

    useEffect(() => {
        if (!cobrador?.id) return;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const to = new Date();
                to.setHours(23, 59, 59, 999);
                const from = new Date(to);
                from.setDate(from.getDate() - 6);
                from.setHours(0, 0, 0, 0);

                const { data } = await fetchMyPayments({
                    from: from.toISOString(),
                    to: to.toISOString(),
                });

                setPagosSemana(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                setPagosSemana([]);
                setError("No se pudieron obtener los pagos de la semana.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [cobrador?.id]);

    const role = (cobrador?.role || "").toLowerCase();
    const esCobrador = role === "cobrador" || role === "employee";

    if (!esCobrador) {
        return (
            <div className="p-6 text-center text-red-400">
                No tienes permiso para acceder a esta vista.
            </div>
        );
    }

    const salarioBase = Number(cobrador.salary) || 0;
    const porcentajeComision = Number(cobrador.comisions) || 0;
    const totalPagosSemana = useMemo(
        () => pagosSemana.reduce((acc, pago) => acc + (Number(pago.amount) || 0), 0),
        [pagosSemana]
    );
    const comision = (totalPagosSemana * porcentajeComision) / 100;
    const totalSemana = salarioBase + comision;
    const salaryTypeKey = (cobrador.salaryType || "N_A").toUpperCase();
    const salaryTypeLabel = salaryTypeLabels[salaryTypeKey] || salaryTypeLabels.N_A;

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Sueldo semanal de {cobrador.name}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Tipo de salario: {salaryTypeLabel}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-5 shadow dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm text-gray-500 dark:text-gray-400">Sueldo base</h3>
                        <HiCurrencyDollar className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        ${salarioBase.toLocaleString("es-AR")}
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
                        {porcentajeComision}% sobre pagos de la semana
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

            <div className="mt-8">
                <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Pagos registrados esta semana
                </h2>

                {loading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cargando pagos...</p>
                ) : error ? (
                    <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                ) : pagosSemana.length > 0 ? (
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
                                {pagosSemana.map((pago) => (
                                    <tr key={pago.id}>
                                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                            {new Date(pago.date).toLocaleDateString("es-AR")}
                                        </td>
                                        <td className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            ${Number(pago.amount || 0).toLocaleString("es-AR")}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                            {pago.note || "-"}
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
