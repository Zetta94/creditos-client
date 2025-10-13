import { useState } from "react";
import {
    HiPlay,
    HiStop,
    HiCash,
    HiCreditCard,
    HiCalendar,
    HiClipboardList,
} from "react-icons/hi";
import Toast from "../components/Toast.jsx";

export default function DashboardCobrador() {
    const [trayectoActivo, setTrayectoActivo] = useState(false);
    const [toast, setToast] = useState(null);
    const [notas] = useState([
        "Recordar pasar por Av. Libertad 1023 antes de las 15hs.",
        "Cliente Laura Gómez pidió reenviar comprobante MP.",
        "Verificar dirección de Carlos Díaz (domicilio cambiado).",
    ]);

    const totales = {
        mp: 18500,
        efectivo: 22500,
        diarios: 20,
        semanales: 12,
        mensuales: 1,
    };

    // === Confirmaciones con toast ===
    function confirmarInicio() {
        setToast({
            message: "¿Deseás iniciar el trayecto del día?",
            type: "info",
            confirm: true,
            onConfirm: () => {
                setTrayectoActivo(true);
                setToast({
                    message: "Trayecto iniciado correctamente.",
                    type: "success",
                });
                console.log("🟢 Trayecto iniciado. Mensaje enviado al administrador.");
            },
        });
    }

    function confirmarFinalizacion() {
        setToast({
            message: "¿Deseás finalizar el día y enviar el resumen?",
            type: "error",
            confirm: true,
            onConfirm: () => {
                setTrayectoActivo(false);
                setToast({
                    message: "Resumen enviado al administrador.",
                    type: "info",
                });
                console.log("🔴 Día finalizado. Resumen enviado al administrador.");
            },
        });
    }

    return (
        <main className="p-4 sm:p-6 lg:p-8 space-y-8">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Panel del Cobrador
            </h1>

            {/* ===== INDICADORES ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <Indicador icon={<HiCreditCard className="h-6 w-6 text-blue-500" />} label="Cobrado por MP" valor={`$${totales.mp.toLocaleString("es-AR")}`} />
                <Indicador icon={<HiCash className="h-6 w-6 text-green-500" />} label="Cobrado en Efectivo" valor={`$${totales.efectivo.toLocaleString("es-AR")}`} />
                <Indicador icon={<HiClipboardList className="h-6 w-6 text-yellow-500" />} label="Pagos diarios" valor={`${totales.diarios.toLocaleString("es-AR")}`} />
                <Indicador icon={<HiCalendar className="h-6 w-6 text-purple-500" />} label="Pagos semanales" valor={`${totales.semanales.toLocaleString("es-AR")}`} />
                <Indicador icon={<HiCalendar className="h-6 w-6 text-red-500" />} label="Pagos mensuales" valor={`${totales.mensuales.toLocaleString("es-AR")}`} />
            </div>

            {/* ===== BOTONES ===== */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                {!trayectoActivo ? (
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
