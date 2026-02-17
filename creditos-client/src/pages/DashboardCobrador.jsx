import { useState, useEffect, useCallback } from "react";
import {
    HiPlay,
    HiStop,
    HiCash,
    HiCreditCard,
    HiCalendar,
    HiClipboardList,
} from "react-icons/hi";
import Toast from "../components/Toast.jsx";
import { fetchDashboardResumenCobrador } from "../services/dashboardService";
import { useDispatch } from "react-redux";
import { setTrayectoActivo as setTrayectoActivoAction } from "../store/trayectoSlice";

export default function DashboardCobrador() {
    const dispatch = useDispatch();
    const [trayectoActivo, setTrayectoActivoState] = useState(false);
    const [loadingTrayecto, setLoadingTrayecto] = useState(true);
    const [toast, setToast] = useState(null);
    const [resumen, setResumen] = useState({
        mercadopago: 0,
        efectivo: 0,
        pagosDiarios: 0,
        pagosSemanales: 0,
        pagosQuincenales: 0,
        pagosMensuales: 0,
        totalCobrado: 0,
        clientesVisitados: 0,
        asignaciones: 0,
        reporteGenerado: false,
        trayectoActivo: false,
    });
    const [loadingResumen, setLoadingResumen] = useState(true);
    const [errorResumen, setErrorResumen] = useState(null);

    const applyResumenData = useCallback((data) => {
        setResumen({
            mercadopago: data.mercadopago ?? 0,
            efectivo: data.efectivo ?? 0,
            pagosDiarios: data.pagosDiarios ?? 0,
            pagosSemanales: data.pagosSemanales ?? 0,
            pagosQuincenales: data.pagosQuincenales ?? 0,
            pagosMensuales: data.pagosMensuales ?? 0,
            totalCobrado: data.totalCobrado ?? ((data.mercadopago ?? 0) + (data.efectivo ?? 0)),
            clientesVisitados: data.clientesVisitados ?? 0,
            asignaciones: data.asignaciones ?? 0,
            reporteGenerado: Boolean(data.reporteGenerado),
            trayectoActivo: Boolean(data.trayectoActivo),
        });
        const activo = Boolean(data.trayectoActivo);
        setTrayectoActivoState(activo);
        dispatch(setTrayectoActivoAction(activo));
        setLoadingTrayecto(false);
        setErrorResumen(null);
    }, [dispatch]);

    const getResumen = useCallback(async () => {
        const response = await fetchDashboardResumenCobrador();
        return response.data || {};
    }, []);

    const reloadResumen = useCallback(async (options = { showLoader: true }) => {
        if (options.showLoader) setLoadingResumen(true);
        try {
            const data = await getResumen();
            applyResumenData(data);
            return data;
        } catch (err) {
            setErrorResumen("No se pudo cargar el resumen del cobrador.");
            throw err;
        } finally {
            if (options.showLoader) setLoadingResumen(false);
        }
    }, [getResumen, applyResumenData]);

    useEffect(() => {
        let active = true;
        setLoadingResumen(true);
        getResumen()
            .then((data) => {
                if (!active) return;
                applyResumenData(data);
            })
            .catch(() => {
                if (!active) return;
                setErrorResumen("No se pudo cargar el resumen del cobrador.");
            })
            .finally(() => {
                if (!active) return;
                setLoadingResumen(false);
            });

        return () => {
            active = false;
        };
    }, [getResumen, applyResumenData]);

    useEffect(() => {
        let mounted = true;
        async function checkTrayecto() {
            try {
                const { fetchMyReports } = await import("../services/reportsService");
                const res = await fetchMyReports();
                const reportes = Array.isArray(res?.data?.data) ? res.data.data : [];
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const existeHoy = reportes.find((r) => {
                    const fecha = new Date(r.fechaDeReporte);
                    fecha.setHours(0, 0, 0, 0);
                    return fecha.getTime() === hoy.getTime() && !r.finalized;
                });
                if (mounted) {
                    const estaActivo = Boolean(existeHoy);
                    setTrayectoActivoState(estaActivo);
                    dispatch(setTrayectoActivoAction(estaActivo));
                }
            } catch (err) {
                if (mounted) {
                    setTrayectoActivoState(false);
                    dispatch(setTrayectoActivoAction(false));
                }
            }
        }
        checkTrayecto();
        return () => { mounted = false; };
    }, [dispatch]);

    async function confirmarInicio() {
        setToast({
            message: "Deseas iniciar el trayecto del dia?",
            type: "info",
            confirm: true,
            onConfirm: async () => {
                try {
                    setLoadingTrayecto(true);
                    await import("../services/reportsService").then((m) => m.startReport());
                    setTrayectoActivoState(true);
                    dispatch(setTrayectoActivoAction(true));
                    setToast({ message: "Trayecto iniciado correctamente.", type: "success" });
                    await reloadResumen({ showLoader: false }).catch(() => undefined);
                } catch (err) {
                    setToast({ message: "Error iniciando trayecto.", type: "error" });
                } finally {
                    setLoadingTrayecto(false);
                }
            },
        });
    }

    async function confirmarFinalizacion() {
        setToast({
            message: "Deseas finalizar el dia y enviar el resumen?",
            type: "error",
            confirm: true,
            onConfirm: async () => {
                try {
                    setLoadingTrayecto(true);
                    await import("../services/reportsService").then((m) => m.finalizeReport());
                    setTrayectoActivoState(false);
                    dispatch(setTrayectoActivoAction(false));
                    setToast({ message: "Reporte finalizado. El administrador podra verlo en Usuarios > Reportes.", type: "info" });
                    await reloadResumen({ showLoader: false }).catch(() => undefined);
                } catch (err) {
                    setToast({ message: "Error enviando resumen.", type: "error" });
                } finally {
                    setLoadingTrayecto(false);
                }
            },
        });
    }

    const formatCurrency = (value) =>
        new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
        }).format(value ?? 0);

    const formatNumber = (value) => new Intl.NumberFormat("es-AR").format(value ?? 0);

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-3 py-4 sm:px-6 sm:py-6 dark:from-slate-900 dark:to-slate-950">
            <div className="mx-auto w-full max-w-6xl space-y-5">
                <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 sm:p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Jornada</p>
                            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">Panel del Cobrador</h1>
                        </div>
                        <div className="w-full md:w-auto">
                            {loadingTrayecto ? (
                                <button disabled className="flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-gray-400 px-6 py-3 text-sm sm:text-base font-medium text-white opacity-60 cursor-not-allowed">
                                    Cargando estado...
                                </button>
                            ) : !trayectoActivo ? (
                                <button
                                    onClick={confirmarInicio}
                                    className="flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm sm:text-base font-medium text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                                >
                                    <HiPlay className="h-5 w-5" /> Iniciar trayecto
                                </button>
                            ) : (
                                <button
                                    onClick={confirmarFinalizacion}
                                    className="flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm sm:text-base font-medium text-white hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
                                >
                                    <HiStop className="h-5 w-5" /> Finalizar dia
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {errorResumen ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                        {errorResumen}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <Indicador icon={<HiCreditCard className="h-5 w-5 text-blue-500" />} label="Cobrado por MP" valor={loadingResumen ? "Cargando..." : formatCurrency(resumen.mercadopago)} />
                        <Indicador icon={<HiCash className="h-5 w-5 text-emerald-500" />} label="Cobrado en Efectivo" valor={loadingResumen ? "Cargando..." : formatCurrency(resumen.efectivo)} />
                        <Indicador icon={<HiClipboardList className="h-5 w-5 text-amber-500" />} label="Pagos diarios" valor={loadingResumen ? "Cargando..." : formatNumber(resumen.pagosDiarios)} />
                        <Indicador icon={<HiCalendar className="h-5 w-5 text-violet-500" />} label="Pagos semanales" valor={loadingResumen ? "Cargando..." : formatNumber(resumen.pagosSemanales)} />
                        <Indicador icon={<HiCalendar className="h-5 w-5 text-indigo-500" />} label="Pagos quincenales" valor={loadingResumen ? "Cargando..." : formatNumber(resumen.pagosQuincenales)} />
                        <Indicador icon={<HiCalendar className="h-5 w-5 text-rose-500" />} label="Pagos mensuales" valor={loadingResumen ? "Cargando..." : formatNumber(resumen.pagosMensuales)} />
                    </div>
                )}

                {!loadingResumen && !errorResumen && (
                    <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 lg:grid-cols-4">
                        <DatoResumen label="Total cobrado hoy" value={formatCurrency(resumen.totalCobrado)} />
                        <DatoResumen label="Clientes visitados" value={formatNumber(resumen.clientesVisitados)} />
                        <DatoResumen label="Asignaciones activas" value={formatNumber(resumen.asignaciones)} />
                        <DatoResumen
                            label="Estado del trayecto"
                            value={resumen.trayectoActivo ? "En curso" : resumen.reporteGenerado ? "Finalizado" : "Pendiente"}
                        />
                    </div>
                )}

            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    confirm={toast.confirm}
                    onConfirm={toast.onConfirm}
                    onCancel={() => setToast(null)}
                    onClose={() => setToast(null)}
                />
            )}
        </main>
    );
}

function Indicador({ icon, label, valor }) {
    return (
        <div className="flex min-h-[96px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-4">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                <div className="shrink-0">{icon}</div>
            </div>
            <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">{valor}</p>
        </div>
    );
}

function DatoResumen({ label, value }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">{value}</p>
        </div>
    );
}

