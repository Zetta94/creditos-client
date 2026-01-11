import { useEffect, useMemo, useState } from "react";
import {
    HiExclamation,
    HiCheckCircle,
    HiClock,
    HiFilter,
    HiFlag,
    HiLocationMarker,
    HiX,
} from "react-icons/hi";
import { fetchMessages } from "../services/messagesService";
import Pagination from "../components/Pagination";

const TYPE_OPTIONS = [
    { value: "TODOS", label: "Todos" },
    { value: "PAGO", label: "Pagos recibidos" },
    { value: "VENCIMIENTO", label: "Próximos vencimientos" },
    { value: "IMPAGO", label: "Clientes en mora" },
    { value: "TRAYECTO_INICIADO", label: "Trayectos iniciados" },
    { value: "TRAYECTO_FINALIZADO", label: "Trayectos finalizados" },
];

const PALETTE = {
    neutral: {
        bg: "bg-white dark:bg-gray-800",
        border: "border-gray-200 dark:border-gray-700",
        text: "text-gray-800 dark:text-gray-100",
        chip: "bg-blue-600",
        icon: "text-gray-500 dark:text-gray-300",
    },
    warning: {
        bg: "bg-amber-50 dark:bg-amber-900/30",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-800 dark:text-amber-200",
        chip: "bg-amber-600",
        icon: "text-amber-500 dark:text-amber-300",
    },
    danger: {
        bg: "bg-red-50 dark:bg-red-900/30",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-800 dark:text-red-200",
        chip: "bg-red-600",
        icon: "text-red-500 dark:text-red-300",
    },
    info: {
        bg: "bg-blue-50 dark:bg-blue-900/30",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-800 dark:text-blue-200",
        chip: "bg-blue-600",
        icon: "text-blue-500 dark:text-blue-300",
    },
    success: {
        bg: "bg-emerald-50 dark:bg-emerald-900/30",
        border: "border-emerald-200 dark:border-emerald-800",
        text: "text-emerald-800 dark:text-emerald-200",
        chip: "bg-emerald-600",
        icon: "text-emerald-500 dark:text-emerald-300",
    },
};

const MESSAGE_META = {
    PAGO: { palette: "success", icon: HiCheckCircle },
    VENCIMIENTO: { palette: "warning", icon: HiClock },
    IMPAGO: { palette: "danger", icon: HiExclamation },
    TRAYECTO_INICIADO: { palette: "info", icon: HiLocationMarker },
    TRAYECTO_FINALIZADO: { palette: "success", icon: HiFlag },
    DEFAULT: { palette: "neutral", icon: HiExclamation },
};

function normalizarMensajes(items) {
    return (Array.isArray(items) ? items : []).map((item) => {
        const fechaDate = item.fecha ? new Date(item.fecha) : null;
        return {
            ...item,
            clienteNombre: item.client?.name ?? null,
            fechaDate: fechaDate instanceof Date && !Number.isNaN(fechaDate.getTime()) ? fechaDate : null,
        };
    });
}

function formatDateTime(value) {
    if (!value) return "";
    return `${value.toLocaleDateString("es-AR")} ${value.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
    })}`;
}

export default function Mensajes() {
    const [filtros, setFiltros] = useState({
        desde: "",
        hasta: "",
        tipo: "TODOS", // PAGO | VENCIMIENTO | IMPAGO | TODOS
        soloImportantes: false,
    });
    const [openFilters, setOpenFilters] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);
    const [meta, setMeta] = useState({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        let active = true;
        setLoading(true);
        fetchMessages({ page, pageSize })
            .then((res) => {
                if (!active) return;
                setMessages(normalizarMensajes(res.data?.data));
                setMeta(res.data?.meta || { page: 1, pageSize, totalItems: 0, totalPages: 1 });
                setError(null);
            })
            .catch(() => {
                if (!active) return;
                setError("No se pudieron cargar los mensajes.");
            })
            .finally(() => {
                if (!active) return;
                setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [page, pageSize]);

    useEffect(() => {
        setPage(meta.page ?? 1);
        setPageSize(meta.pageSize ?? 10);
    }, [meta.page, meta.pageSize]);

    useEffect(() => {
        setPage(1);
    }, [filtros.desde, filtros.hasta, filtros.tipo, filtros.soloImportantes]);

    const mensajesFiltrados = useMemo(() => {
        if (loading || error) return [];

        const desdeDate = filtros.desde ? new Date(filtros.desde) : null;
        const hastaDate = filtros.hasta ? new Date(filtros.hasta) : null;
        if (hastaDate) {
            hastaDate.setHours(23, 59, 59, 999);
        }

        return messages
            .filter((m) => {
                if (desdeDate && m.fechaDate && m.fechaDate < desdeDate) return false;
                if (hastaDate && m.fechaDate && m.fechaDate > hastaDate) return false;
                if (filtros.tipo !== "TODOS" && m.tipo !== filtros.tipo) return false;
                if (filtros.soloImportantes && !m.importante) return false;
                return true;
            })
            .sort((a, b) => {
                const aTime = a.fechaDate ? a.fechaDate.getTime() : 0;
                const bTime = b.fechaDate ? b.fechaDate.getTime() : 0;
                return bTime - aTime;
            });
    }, [messages, filtros, loading, error]);

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
                {loading ? (
                    <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        Cargando mensajes...
                    </div>
                ) : error ? (
                    <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                        {error}
                    </div>
                ) : mensajesFiltrados.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        No hay mensajes con los filtros seleccionados.
                    </div>
                ) : (
                    mensajesFiltrados.map((m) => <MensajeItem key={m.id} m={m} />)
                )}
            </div>

            <div className="mt-6">
                <Pagination
                    page={meta.page ?? page}
                    pageSize={meta.pageSize ?? pageSize}
                    totalItems={meta.totalItems ?? mensajesFiltrados.length}
                    totalPages={meta.totalPages ?? 1}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                    }}
                />
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
                    {TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
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
    const meta = MESSAGE_META[m.tipo] || MESSAGE_META.DEFAULT;
    const palette = PALETTE[meta.palette] || PALETTE.neutral;
    const Icon = meta.icon;

    return (
        <div
            className={`flex items-start justify-between gap-3 rounded-xl border p-4 ${palette.bg} ${palette.border} ${palette.text}`}
        >
            <div className="flex min-w-0 items-start gap-3">
                <div className={`mt-0.5 ${palette.icon}`}>
                    <Icon className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                    <p className="text-sm">
                        {m.contenido}
                    </p>
                    {m.clienteNombre && (
                        <p className="mt-1 text-xs opacity-75">Cliente: {m.clienteNombre}</p>
                    )}
                    <p className="mt-0.5 text-xs opacity-70">{formatDateTime(m.fechaDate)}</p>
                </div>
            </div>

            {m.importante && (
                <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold uppercase text-white ${palette.chip}`}>
                    Importante
                </span>
            )}
        </div>
    );
}
