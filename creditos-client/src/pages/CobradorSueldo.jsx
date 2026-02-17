import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { HiCurrencyDollar, HiTrendingUp, HiCalendar, HiDocumentText } from "react-icons/hi";
import {
    fetchWeeklyPayrollPreview,
    fetchWeeklyPayrollHistory,
    generateWeeklyPayroll
} from "../services/reportsService";
import toast from "react-hot-toast";
import Pagination from "../components/Pagination";

const salaryTypeLabels = {
    N_A: "Sin definir",
    DIARIO: "Diario",
    SEMANAL: "Semanal",
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
    const [resumenPreview, setResumenPreview] = useState(null);
    const [historialResumenes, setHistorialResumenes] = useState([]);
    const [generandoResumen, setGenerandoResumen] = useState(false);
    const [resumenSemanal, setResumenSemanal] = useState(null);
    const [detallePage, setDetallePage] = useState(1);
    const [detallePageSize, setDetallePageSize] = useState(5);
    const [historialPage, setHistorialPage] = useState(1);
    const [historialPageSize, setHistorialPageSize] = useState(4);

    useEffect(() => {
        if (!cobrador?.id) return;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [previewRes, historyRes] = await Promise.all([
                    fetchWeeklyPayrollPreview(),
                    fetchWeeklyPayrollHistory({ weeks: 10 }),
                ]);
                setResumenPreview(previewRes?.data ?? null);
                setHistorialResumenes(Array.isArray(historyRes?.data?.data) ? historyRes.data.data : []);
            } catch (err) {
                console.error(err);
                setResumenPreview(null);
                setHistorialResumenes([]);
                setError("No se pudo obtener el resumen semanal.");
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

    const salarioBaseSemanal = Number(resumenPreview?.weeklySalary ?? cobrador.salary) || 0;
    const porcentajeComision = Number(resumenPreview?.commissionRatePercent ?? cobrador.comisions) || 0;
    const salaryTypeKey = (cobrador.salaryType || "N_A").toUpperCase();
    const salaryTypeLabel = salaryTypeLabels[salaryTypeKey] || salaryTypeLabels.N_A;

    const creditosConComision = useMemo(() => {
        const items = Array.isArray(resumenPreview?.items) ? resumenPreview.items : [];
        return items.map((item) => {
            const amount = Number(item.amount || 0);
            const comision = Number(item.commission || 0);
            return {
                ...item,
                amount,
                comision,
                producto: item.product || "Credito",
                cliente: item.clientName || "Cliente sin nombre",
            };
        });
    }, [resumenPreview]);

    const totalPagosSemana = useMemo(
        () => Number(resumenPreview?.totalCollected || 0),
        [resumenPreview]
    );
    const totalComisionSemana = useMemo(
        () => Number(resumenPreview?.totalCommission ?? 0),
        [resumenPreview]
    );
    const totalSemana = salarioBaseSemanal + totalComisionSemana;
    const esSabado = new Date().getDay() === 6;
    const historialParaMostrar = useMemo(
        () => historialResumenes.filter((h) => (h?.weeklySalary || 0) > 0 || (h?.totalCommission || 0) > 0 || (h?.items?.length || 0) > 0),
        [historialResumenes]
    );

    useEffect(() => {
        setDetallePage(1);
    }, [creditosConComision.length]);

    useEffect(() => {
        setHistorialPage(1);
    }, [historialParaMostrar.length]);

    const detalleTotalPages = Math.max(1, Math.ceil(creditosConComision.length / detallePageSize));
    const detallePageSafe = Math.min(detallePage, detalleTotalPages);
    const detalleInicio = (detallePageSafe - 1) * detallePageSize;
    const detallePaginado = creditosConComision.slice(detalleInicio, detalleInicio + detallePageSize);

    const historialTotalPages = Math.max(1, Math.ceil(historialParaMostrar.length / historialPageSize));
    const historialPageSafe = Math.min(historialPage, historialTotalPages);
    const historialInicio = (historialPageSafe - 1) * historialPageSize;
    const historialPaginado = historialParaMostrar.slice(historialInicio, historialInicio + historialPageSize);

    const generarResumenPago = async () => {
        setGenerandoResumen(true);
        try {
            const { data } = await generateWeeklyPayroll();
            setResumenSemanal(data);
            if (data?.alreadyGenerated) {
                toast("El resumen de esta semana ya fue generado.", { icon: "ℹ️" });
            } else {
                toast.success("Resumen semanal generado y enviado a Mensajes para el administrador.");
            }
        } catch (err) {
            const msg = err?.response?.data?.error || "No se pudo generar el resumen semanal.";
            toast.error(msg);
        } finally {
            setGenerandoResumen(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-3 sm:p-6 dark:from-slate-900 dark:to-slate-950">
            <div className="mx-auto w-full max-w-6xl">
            <div className="mb-4 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/90 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Sueldo semanal de {cobrador.name}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Tipo de salario: {salaryTypeLabel}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Dia de cobro: <span className="font-semibold">SABADO</span>
                    </p>
                </div>
                <button
                    type="button"
                    onClick={generarResumenPago}
                    disabled={!esSabado || generandoResumen}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <HiDocumentText className="h-4 w-4" />
                    {generandoResumen ? "Generando..." : "Generar resumen semanal"}
                </button>
            </div>
            </div>

            {!esSabado && (
                <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                    El resumen para pago al administrador solo se genera los sabados.
                </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm text-slate-500 dark:text-slate-400">Sueldo semanal</h3>
                        <HiCurrencyDollar className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        ${salarioBaseSemanal.toLocaleString("es-AR")}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm text-slate-500 dark:text-slate-400">Comision semanal</h3>
                        <HiTrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        ${totalComisionSemana.toLocaleString("es-AR")}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {porcentajeComision}% por credito creado
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm text-slate-500 dark:text-slate-400">Total cobrado semana</h3>
                        <HiCalendar className="h-5 w-5 text-purple-500" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        ${totalPagosSemana.toLocaleString("es-AR")}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm text-slate-500 dark:text-slate-400">Total a pagar (sabado)</h3>
                        <HiCalendar className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        ${totalSemana.toLocaleString("es-AR")}
                    </p>
                </div>
            </div>

            {resumenSemanal && (
                <div className="mt-5 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200">
                    {resumenSemanal.alreadyGenerated
                        ? "Resumen semanal ya existente. El administrador ya lo tiene en Mensajes."
                        : "Resumen semanal generado correctamente. El administrador puede verlo en Mensajes para pagarte."}
                </div>
            )}

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
                <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Detalle semanal por credito creado (comision unica por credito/producto)
                </h2>

                {loading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cargando pagos...</p>
                ) : error ? (
                    <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                ) : creditosConComision.length > 0 ? (
                    <>
                        <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Fecha</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Cliente</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Credito/Producto</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Monto cobrado</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Comision</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {detallePaginado.map((item) => (
                                        <tr key={item.creditId}>
                                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                {new Date(item.date).toLocaleDateString("es-AR")}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{item.cliente}</td>
                                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{item.producto}</td>
                                            <td className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                ${item.amount.toLocaleString("es-AR")}
                                            </td>
                                            <td className="px-4 py-2 text-sm font-semibold text-green-600 dark:text-green-400">
                                                ${item.comision.toLocaleString("es-AR")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="sm:hidden space-y-3">
                            {detallePaginado.map((item) => (
                                <div key={item.creditId} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(item.date).toLocaleDateString("es-AR")}</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.cliente}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.producto}</p>
                                    <div className="mt-1 text-sm">
                                        <p className="text-gray-700 dark:text-gray-300">Monto credito: <span className="font-semibold">${item.amount.toLocaleString("es-AR")}</span></p>
                                        <p className="text-green-600 dark:text-green-400">Comision: <span className="font-semibold">${item.comision.toLocaleString("es-AR")}</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <Pagination
                                page={detallePageSafe}
                                pageSize={detallePageSize}
                                totalItems={creditosConComision.length}
                                totalPages={detalleTotalPages}
                                onPageChange={setDetallePage}
                                onPageSizeChange={(size) => {
                                    setDetallePageSize(size);
                                    setDetallePage(1);
                                }}
                                pageSizeOptions={[5, 10, 20]}
                            />
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No se registraron creditos creados esta semana.</p>
                )}
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
                <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Resumenes anteriores de pago
                </h2>
                {loading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cargando historial...</p>
                ) : historialParaMostrar.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No hay resumenes historicos para mostrar.</p>
                ) : (
                    <div className="space-y-3">
                        {historialPaginado.map((item) => (
                            <div key={item.payrollKey} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        Semana del {new Date(item.weekStart).toLocaleDateString("es-AR")} al {new Date(item.weekEnd).toLocaleDateString("es-AR")}
                                    </p>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.generated
                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                        }`}>
                                        {item.generated ? "Generado" : "No generado"}
                                    </span>
                                </div>
                                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Sueldo: <span className="font-semibold">${Number(item.weeklySalary || 0).toLocaleString("es-AR")}</span>
                                    </p>
                                    <p className="text-green-700 dark:text-green-300">
                                        Comision: <span className="font-semibold">${Number(item.totalCommission || 0).toLocaleString("es-AR")}</span>
                                    </p>
                                    <p className="text-blue-700 dark:text-blue-300">
                                        Total: <span className="font-semibold">${Number(item.weeklyPayout || 0).toLocaleString("es-AR")}</span>
                                    </p>
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Creditos con comision en la semana: {Array.isArray(item.items) ? item.items.length : 0}
                                </p>
                            </div>
                        ))}
                        <Pagination
                            page={historialPageSafe}
                            pageSize={historialPageSize}
                            totalItems={historialParaMostrar.length}
                            totalPages={historialTotalPages}
                            onPageChange={setHistorialPage}
                            onPageSizeChange={(size) => {
                                setHistorialPageSize(size);
                                setHistorialPage(1);
                            }}
                            pageSizeOptions={[4, 8, 12]}
                        />
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}
