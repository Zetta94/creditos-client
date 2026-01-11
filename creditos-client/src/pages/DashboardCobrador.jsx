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

export default function DashboardCobrador() {
    const [trayectoActivo, setTrayectoActivo] = useState(false);
    const [loadingTrayecto, setLoadingTrayecto] = useState(true);
    const [toast, setToast] = useState(null);
    const [resumen, setResumen] = useState({
        mercadopago: 0,
        efectivo: 0,
        pagosDiarios: 0,
        pagosSemanales: 0,
        pagosMensuales: 0,
        totalCobrado: 0,
        clientesVisitados: 0,
        asignaciones: 0,
        reporteGenerado: false,
        trayectoActivo: false,
    });
    const [loadingResumen, setLoadingResumen] = useState(true);
    const [errorResumen, setErrorResumen] = useState(null);
    const [notas] = useState([
        "Recordar pasar por Av. Libertad 1023 antes de las 15hs.",
        "Cliente Laura Gómez pidió reenviar comprobante MP.",
        "Verificar dirección de Carlos Díaz (domicilio cambiado).",
    ]);

    const applyResumenData = useCallback((data) => {
        setResumen({
            mercadopago: data.mercadopago ?? 0,
            efectivo: data.efectivo ?? 0,
            pagosDiarios: data.pagosDiarios ?? 0,
            pagosSemanales: data.pagosSemanales ?? 0,
            pagosMensuales: data.pagosMensuales ?? 0,
            totalCobrado: data.totalCobrado ?? ((data.mercadopago ?? 0) + (data.efectivo ?? 0)),
            clientesVisitados: data.clientesVisitados ?? 0,
            asignaciones: data.asignaciones ?? 0,
            reporteGenerado: Boolean(data.reporteGenerado),
            trayectoActivo: Boolean(data.trayectoActivo),
        });
        setTrayectoActivo(Boolean(data.trayectoActivo));
        setLoadingTrayecto(false);
        setErrorResumen(null);
    }, []);

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
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const existeHoy = res.data?.find(r => {
                    const fecha = new Date(r.fechaDeReporte);
                    fecha.setHours(0, 0, 0, 0);
                    return fecha.getTime() === hoy.getTime() && !r.finalized;
                });
                if (mounted) setTrayectoActivo(Boolean(existeHoy));
            } catch (err) {
                if (mounted) setTrayectoActivo(false);
            }
        }
        checkTrayecto();
        return () => { mounted = false; };
    }, []);
    async function confirmarInicio() {
        setToast({
            message: "¿Deseás iniciar el trayecto del día?",
            type: "info",
            confirm: true,
            onConfirm: async () => {
                try {
                    setLoadingTrayecto(true);
                    const res = await import("../services/reportsService").then(m => m.startReport());
                    setTrayectoActivo(true);
                    setToast({ message: "Trayecto iniciado correctamente.", type: "success" });
                    console.log("🟢 Trayecto iniciado.", res?.data || "");
                    await reloadResumen({ showLoader: false }).catch(() => undefined);
                } catch (err) {
                    setToast({ message: "Error iniciando trayecto.", type: "error" });
                    console.error(err);
                } finally {
                    setLoadingTrayecto(false);
                }
            },
        });
    }

    async function confirmarFinalizacion() {
        setToast({
            message: "¿Deseás finalizar el día y enviar el resumen?",
            type: "error",
            confirm: true,
            onConfirm: async () => {
                try {
                    setLoadingTrayecto(true);
                    const res = await import("../services/reportsService").then(m => m.finalizeReport());
                    setTrayectoActivo(false);
                    setToast({ message: "Reporte finalizado. El administrador podrá verlo en Usuarios > Reportes.", type: "info" });
                    console.log("🔴 Día finalizado. Resumen finalizado:", res?.data || "");
                    await reloadResumen({ showLoader: false }).catch(() => undefined);
                } catch (err) {
                    setToast({ message: "Error enviando resumen.", type: "error" });
                    console.error(err);
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
        <main className="p-4 sm:p-6 lg:p-8 space-y-8">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Panel del Cobrador
            </h1>

            {/* ===== INDICADORES ===== */}
            {errorResumen ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                    {errorResumen}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    <Indicador
                        icon={<HiCreditCard className="h-6 w-6 text-blue-500" />}
                        label="Cobrado por MP"
                        valor={loadingResumen ? "Cargando..." : formatCurrency(resumen.mercadopago)}
                    />
                    <Indicador
                        icon={<HiCash className="h-6 w-6 text-green-500" />}
                        label="Cobrado en Efectivo"
                        valor={loadingResumen ? "Cargando..." : formatCurrency(resumen.efectivo)}
                    />
                    <Indicador
                        icon={<HiClipboardList className="h-6 w-6 text-yellow-500" />}
                        label="Pagos diarios"
                        valor={loadingResumen ? "Cargando..." : formatNumber(resumen.pagosDiarios)}
                    />
                    <Indicador
                        icon={<HiCalendar className="h-6 w-6 text-purple-500" />}
                        label="Pagos semanales"
                        valor={loadingResumen ? "Cargando..." : formatNumber(resumen.pagosSemanales)}
                    />
                    <Indicador
                        icon={<HiCalendar className="h-6 w-6 text-red-500" />}
                        label="Pagos mensuales"
                        valor={loadingResumen ? "Cargando..." : formatNumber(resumen.pagosMensuales)}
                    />
                </div>
            )}

            {!loadingResumen && !errorResumen && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DatoResumen label="Total cobrado hoy" value={formatCurrency(resumen.totalCobrado)} />
                    <DatoResumen label="Clientes visitados" value={formatNumber(resumen.clientesVisitados)} />
                    <DatoResumen label="Asignaciones activas" value={formatNumber(resumen.asignaciones)} />
                    <DatoResumen
                        label="Estado del trayecto"
                        value={
                            resumen.trayectoActivo
                                ? "En curso"
                                : resumen.reporteGenerado
                                    ? "Finalizado"
                                    : "Pendiente"
                        }
                    />
                </div>
            )}

            {/* ===== BOTONES ===== */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                {loadingTrayecto ? (
                    <button disabled className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-gray-400 px-6 py-3 text-sm sm:text-base font-medium text-white opacity-60 cursor-not-allowed">
                        Cargando estado...
                    </button>
                ) : !trayectoActivo ? (
                    <button
                        onClick={confirmarInicio}
                        className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm sm:text-base font-medium text-white hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    >
                        <HiPlay className="h-5 w-5" /> Iniciar trayecto
                    </button>
                ) : (
                    <button
                        onClick={confirmarFinalizacion}
                        className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm sm:text-base font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                    >
                        <HiStop className="h-5 w-5" /> Finalizar día
                    </button>
                )}
            </div>

            {/* ===== NOTAS ADICIONALES ===== */}
            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                    Notas adicionales
                </h2>

                {notas.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No hay notas pendientes.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {notas.map((nota, i) => (
                            <li
                                key={i}
                                className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300"
                            >
                                • {nota}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* ===== TOAST ===== */}
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

/* ===== Subcomponente: Indicador ===== */
function Indicador({ icon, label, valor }) {
    return (
        <div className="flex items-center justify-between sm:justify-start sm:gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md dark:border-gray-700 dark:bg-gray-800 transition">
            <div className="shrink-0">{icon}</div>
            <div className="text-right sm:text-left">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {valor}
                </p>
            </div>
        </div>
    );
}

function DatoResumen({ label, value }) {
    return (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    );
}
