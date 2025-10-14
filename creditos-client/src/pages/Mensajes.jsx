import { useState, useMemo } from "react";
import { HiExclamation, HiCheckCircle, HiClock, HiFilter, HiX } from "react-icons/hi";
import { mockMessages, mockClients } from "../mocks/mockData"; // ajustá la ruta según tu estructura

export default function Mensajes() {
    const [filtros, setFiltros] = useState({
        desde: "",
        hasta: "",
        tipo: "TODOS", // PAGO | VENCIMIENTO | IMPAGO | TODOS
        soloImportantes: false,
    });
    const [openFilters, setOpenFilters] = useState(false);

    // === Armamos los mensajes con nombre de cliente ===
    const mensajes = mockMessages.map((m) => {
        const cliente = mockClients.find((c) => c.id === m.clientId);
        return {
            ...m,
            cliente: cliente ? cliente.name : "Cliente desconocido",
        };
    });

    // === Aplicar filtros ===
    const mensajesFiltrados = useMemo(() => {
        return mensajes
            .filter((m) => {
                if (filtros.desde && m.fecha < filtros.desde) return false;
                if (filtros.hasta && m.fecha > filtros.hasta) return false;
                if (filtros.tipo !== "TODOS" && m.tipo !== filtros.tipo) return false;
                if (filtros.soloImportantes && !m.importante) return false;
                return true;
            })
            .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    }, [filtros]);

    const reset = () =>
        setFiltros({ desde: "", hasta: "", tipo: "TODOS", soloImportantes: false });

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-bold sm:text-2xl">Mensajes del sistema</h1>

                <div className="flex items-center gap-2">
                    {/* Toggle filtros (solo mobile) */}
                    <button
                        onClick={() => setOpenFilters((v) => !v)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 sm:hidden"
                        aria-expanded={openFilters}
                    >
                        {openFilters ? <HiX className="h-4 w-4" /> : <HiFilter className="h-4 w-4" />}
                        Filtros
                    </button>

                    <button
                        onClick={reset}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                        Limpiar filtros
                    </button>
                </div>
            </div>

            {/* Filtros móvil */}
            <div
                className={`grid gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:hidden ${openFilters ? "grid" : "hidden"}`}
            >
                <Filters filtros={filtros} setFiltros={setFiltros} />
            </div>

            {/* Filtros desktop */}
            <div className="hidden rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:block">
                <Filters filtros={filtros} setFiltros={setFiltros} />
            </div>

            {/* Lista */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {mensajesFiltrados.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        No hay mensajes con los filtros seleccionados.
                    </div>
                ) : (
                    mensajesFiltrados.map((m) => <MensajeItem key={m.id} m={m} />)
                )}
            </div>
        </div>
    );
}

/* === Subcomponentes === */

function Filters({ filtros, setFiltros }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <div className="grid gap-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">Desde</label>
                <input
                    type="date"
                    value={filtros.desde}
                    onChange={(e) => setFiltros((f) => ({ ...f, desde: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
            </div>

            <div className="grid gap-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">Hasta</label>
                <input
                    type="date"
                    value={filtros.hasta}
                    onChange={(e) => setFiltros((f) => ({ ...f, hasta: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
            </div>

            <div className="grid gap-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">Tipo</label>
                <select
                    value={filtros.tipo}
                    onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                    <option value="TODOS">Todos</option>
                    <option value="PAGO">Pagos recibidos</option>
                    <option value="VENCIMIENTO">Próximo vencimiento</option>
                    <option value="IMPAGO">Cliente en mora</option>
                </select>
            </div>

            {/* Toggle importantes */}
            <div className="sm:col-span-2 flex items-end">
                <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                    <input
                        type="checkbox"
                        checked={filtros.soloImportantes}
                        onChange={(e) =>
                            setFiltros((f) => ({ ...f, soloImportantes: e.target.checked }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                    />
                    Solo importantes
                </label>
            </div>
        </div>
    );
}

function MensajeItem({ m }) {
    const { bg, border, text, chipBg } =
        m.importante
            ? m.tipo === "IMPAGO"
                ? styles.red
                : styles.yellow
            : styles.neutral;

    return (
        <div
            className={`flex items-start justify-between gap-3 rounded-xl border p-4 ${bg} ${border} ${text}`}
        >
            <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5">
                    {m.tipo === "PAGO" && <HiCheckCircle className="h-6 w-6 text-green-500" />}
                    {m.tipo === "VENCIMIENTO" && <HiClock className="h-6 w-6 text-yellow-500" />}
                    {m.tipo === "IMPAGO" && <HiExclamation className="h-6 w-6 text-red-500" />}
                </div>

                <div className="min-w-0">
                    {m.tipo === "PAGO" && (
                        <p className="text-sm">
                            Se registró un pago de{" "}
                            <span className="font-semibold">{m.cliente}</span>.
                        </p>
                    )}
                    {m.tipo === "VENCIMIENTO" && (
                        <p className="text-sm">
                            <span className="font-semibold">{m.cliente}</span> tiene un pago próximo a vencer.
                        </p>
                    )}
                    {m.tipo === "IMPAGO" && (
                        <p className="text-sm">
                            <span className="font-semibold">{m.cliente}</span> no realizó su pago a tiempo.
                        </p>
                    )}
                    <p className="mt-0.5 text-xs opacity-70">
                        {new Date(m.fecha).toLocaleDateString("es-AR")}
                    </p>
                </div>
            </div>

            {m.importante && (
                <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold uppercase text-white ${chipBg}`}>
                    Importante
                </span>
            )}
        </div>
    );
}

/* === Paleta === */
const styles = {
    neutral: {
        bg: "bg-white dark:bg-gray-800",
        border: "border-gray-200 dark:border-gray-700",
        text: "text-gray-800 dark:text-gray-100",
        chipBg: "bg-blue-600",
    },
    yellow: {
        bg: "bg-yellow-50 dark:bg-yellow-900/30",
        border: "border-yellow-200 dark:border-yellow-800",
        text: "text-yellow-800 dark:text-yellow-200",
        chipBg: "bg-yellow-600",
    },
    red: {
        bg: "bg-red-50 dark:bg-red-900/30",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-800 dark:text-red-200",
        chipBg: "bg-red-600",
    },
};
