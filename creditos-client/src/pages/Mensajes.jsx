import { useEffect, useState } from "react";
import {
    HiFilter,
    HiX,
} from "react-icons/hi";
import { fetchMessages } from "../services/messagesService";
import Pagination from "../components/Pagination";
import MessageCard from "../components/messages/MessageCard";

const TYPE_OPTIONS = [
    { value: "TODOS", label: "Todos" },
    { value: "PAGO", label: "Pagos recibidos" },
    { value: "VENCIMIENTO", label: "Próximos vencimientos" },
    { value: "IMPAGO", label: "Clientes en mora" },
    { value: "TRAYECTO_INICIADO", label: "Trayectos iniciados" },
    { value: "TRAYECTO_FINALIZADO", label: "Trayectos finalizados" },
];

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
    const { desde, hasta, tipo, soloImportantes } = filtros;

    useEffect(() => {
        let active = true;
        setLoading(true);
        const params = {
            page,
            pageSize,
            ...(tipo !== "TODOS" ? { tipo } : {}),
            ...(desde ? { desde } : {}),
            ...(hasta ? { hasta } : {}),
            ...(soloImportantes ? { importante: true } : {})
        };

        fetchMessages(params)
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
    }, [page, pageSize, desde, hasta, tipo, soloImportantes]);

    useEffect(() => {
        setPage(meta.page ?? 1);
        setPageSize(meta.pageSize ?? 10);
    }, [meta.page, meta.pageSize]);

    useEffect(() => {
        setPage(1);
    }, [desde, hasta, tipo, soloImportantes]);

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
            <div className="grid grid-cols-1 gap-3">
                {loading ? (
                    <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        Cargando mensajes...
                    </div>
                ) : error ? (
                    <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                        {error}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        No hay mensajes con los filtros seleccionados.
                    </div>
                ) : (
                    messages.map((m) => <MensajeItem key={m.id} m={m} />)
                )}
            </div>

            <div className="mt-6">
                <Pagination
                    page={meta.page ?? page}
                    pageSize={meta.pageSize ?? pageSize}
                    totalItems={meta.totalItems ?? messages.length}
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
                    disabled={filtros.soloImportantes}
                    className={`h-10 w-full rounded-lg border bg-white px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:bg-gray-900 dark:text-gray-100 ${filtros.soloImportantes ? "border-dashed border-gray-300 text-gray-400 dark:border-gray-700 dark:text-gray-500" : "border-gray-300 dark:border-gray-700"}`}
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
                            setFiltros((f) => ({
                                ...f,
                                soloImportantes: e.target.checked,
                                tipo: e.target.checked ? "TODOS" : f.tipo
                            }))
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
    return <MessageCard message={m} />;
}
