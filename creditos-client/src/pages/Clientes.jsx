import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    HiPencilAlt,
    HiEye,
    HiUserAdd,
    HiUserRemove,
    HiPlus,
    HiFilter,
    HiX,
    HiSearch,
} from "react-icons/hi";
import { loadClients, removeClient } from "../store/clientsSlice";
import Pagination from "../components/Pagination";

export default function Clientes() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { list, loading, meta } = useSelector(state => state.clients) || { list: [], loading: false, meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 } };

    const [q, setQ] = useState("");
    const [activo, setActivo] = useState("todos");
    const [confianza, setConfianza] = useState("todas");
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        setPage(meta?.page ?? 1);
        setPageSize(meta?.pageSize ?? 10);
    }, [meta?.page, meta?.pageSize]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            dispatch(loadClients({ page, pageSize, q: q.trim() ? q.trim() : undefined }));
        }, 200);
        return () => {
            clearTimeout(timeout);
        };
    }, [dispatch, page, pageSize, q]);

    useEffect(() => {
        setPage(1);
    }, [q, activo, confianza]);

    const rows = useMemo(() => {
        const qn = q.trim().toLowerCase();
        return list.filter((c) => {
            const matchesText =
                !qn ||
                c.name?.toLowerCase().includes(qn) ||
                c.phone?.toLowerCase().includes(qn) ||
                c.document?.toLowerCase().includes(qn);
            const isActive = c.activo ?? true;
            const matchesActivo = activo === "todos" || (activo === "si" ? isActive : !isActive);
            const reliability = (c.reliability || "").toUpperCase();
            const confianzaLabel = reliability === "ALTA" ? "Alta" : reliability === "MOROSO" ? "Baja" : "Media";
            const matchesConf = confianza === "todas" || confianza === confianzaLabel;
            return matchesText && matchesActivo && matchesConf;
        });
    }, [list, q, activo, confianza]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-bold sm:text-2xl">Clientes</h1>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowFilters((s) => !s)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 sm:hidden"
                        aria-expanded={showFilters}
                        title="Mostrar filtros"
                    >
                        {showFilters ? <HiX className="h-4 w-4" /> : <HiFilter className="h-4 w-4" />}
                        Filtros
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/clientes/nuevo")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-[0.98]"
                    >
                        <HiPlus className="h-4 w-4" />
                        Agregar cliente
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="mb-4 grid gap-3 sm:mb-6">
                <div
                    id="filters-panel"
                    className={`grid gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800 sm:hidden ${showFilters ? "grid" : "hidden"}`}
                >
                    <SearchInput q={q} setQ={setQ} />
                    <FiltersRow
                        activo={activo}
                        setActivo={setActivo}
                        confianza={confianza}
                        setConfianza={setConfianza}
                    />
                </div>

                <div className="hidden items-end gap-3 sm:flex">
                    <SearchInput q={q} setQ={setQ} />
                    <FiltersRow
                        activo={activo}
                        setActivo={setActivo}
                        confianza={confianza}
                        setConfianza={setConfianza}
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:block">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-50/80 text-gray-600 backdrop-blur dark:bg-gray-800/80 dark:text-gray-300">
                        <tr>
                            <th className="px-4 py-3 font-medium">Nombre</th>
                            <th className="px-4 py-3 font-medium">Teléfono</th>
                            <th className="px-4 py-3 font-medium">Activo</th>
                            <th className="px-4 py-3 font-medium">Confianza</th>
                            <th className="px-4 py-3 font-medium">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {rows.map((c) => {
                            const isActive = c.activo ?? true;
                            const reliability = (c.reliability || "").toUpperCase();
                            const confianzaLabel = reliability === "ALTA" ? "Alta" : reliability === "MOROSO" ? "Baja" : "Media";
                            return (
                                <tr key={c.id} className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/70">
                                    <td className="px-4 py-3">{c.name}</td>
                                    <td className="px-4 py-3">{c.phone}</td>
                                    <td className="px-4 py-3">
                                        <StatusPill ok={isActive} okText="Activo" badText="Inactivo" />
                                    </td>
                                    <td className="px-4 py-3">{confianzaLabel}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                className="rounded-md bg-gray-100 p-2 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                                onClick={() => navigate(`/clientes/${c.id}/editar`)}
                                            >
                                                <HiPencilAlt className="h-4 w-4" />
                                            </button>
                                            <button
                                                className={`rounded-md p-2 ${isActive
                                                    ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-700 dark:text-white dark:hover:bg-red-600"
                                                    : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-700 dark:text-white dark:hover:bg-green-600"
                                                    }`}
                                                onClick={async () => {
                                                    const ok = window.confirm("¿Seguro que deseas eliminar este cliente?");
                                                    if (!ok) return;
                                                    try {
                                                        await dispatch(removeClient(c.id)).unwrap();
                                                        navigate("/clientes", { replace: true });
                                                    } catch (error) {
                                                        console.error("No se pudo eliminar el cliente", error);
                                                    }
                                                }}
                                            >
                                                {isActive ? <HiUserRemove className="h-4 w-4" /> : <HiUserAdd className="h-4 w-4" />}
                                            </button>
                                            <button
                                                className="rounded-md bg-sky-100 p-2 text-sky-700 hover:bg-sky-200 dark:bg-sky-700 dark:text-white dark:hover:bg-sky-600"
                                                onClick={() => navigate(`/clientes/${c.id}`)}
                                            >
                                                <HiEye className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {!loading && rows.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No hay clientes con esos filtros.
                                </td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    Cargando...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4">
                <Pagination
                    page={meta?.page ?? page}
                    pageSize={meta?.pageSize ?? pageSize}
                    totalItems={meta?.totalItems ?? rows.length}
                    totalPages={meta?.totalPages ?? 1}
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

/* === Subcomponentes (JS puro) === */

function SearchInput({ q, setQ }) {
    return (
        <div className="relative w-full sm:max-w-xs">
            <HiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, teléfono o documento..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
        </div>
    );
}

function FiltersRow({ activo, setActivo, confianza, setConfianza }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <div className="grid gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Activo</label>
                <select
                    value={activo}
                    onChange={(e) => setActivo(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                    <option value="todos">Todos</option>
                    <option value="si">Activos</option>
                    <option value="no">Inactivos</option>
                </select>
            </div>

            <div className="grid gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Confianza</label>
                <select
                    value={confianza}
                    onChange={(e) => setConfianza(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                    <option value="todas">Todas</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                </select>
            </div>

            <div className="hidden md:block" />
        </div>
    );
}

function StatusPill({ ok, okText, badText }) {
    return (
        <span
            className={[
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border",
                ok
                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                    : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
            ].join(" ")}
        >
            <span className={`h-2 w-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />
            {ok ? okText : badText}
        </span>
    );
}
