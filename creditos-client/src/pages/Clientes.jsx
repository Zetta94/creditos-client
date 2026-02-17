// @ts-nocheck
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

const reliabilityOptions = [
    { label: "Todas", value: "todas" },
    { label: "Muy alta", value: "MUYALTA" },
    { label: "Alta", value: "ALTA" },
    { label: "Media", value: "MEDIA" },
    { label: "Baja", value: "BAJA" },
    { label: "Moroso", value: "MOROSO" }
];

const reliabilityLabelMap = {
    MUYALTA: "Muy alta",
    ALTA: "Alta",
    MEDIA: "Media",
    BAJA: "Baja",
    MOROSO: "Moroso"
};

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
            const params = {
                page,
                pageSize
            };

            const search = q.trim();
            if (search) params.q = search;

            if (confianza !== "todas") {
                params.reliability = [confianza];
            }

            if (activo !== "todos") {
                params.status = activo === "si" ? "ACTIVE" : "INACTIVE";
            }

            dispatch(loadClients(params));
        }, 200);
        return () => {
            clearTimeout(timeout);
        };
    }, [dispatch, page, pageSize, q, confianza, activo]);

    useEffect(() => {
        setPage(1);
    }, [q, activo, confianza]);

    const rows = useMemo(() => {
        return list.filter((c) => {
            const status = (c.status || "ACTIVE").toUpperCase();
            const isActive = status === "ACTIVE";
            return activo === "todos" || (activo === "si" ? isActive : !isActive);
        });
    }, [list, activo]);

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
            <div className="grid gap-3 sm:hidden">
                {rows.map((c) => {
                    const status = (c.status || "ACTIVE").toUpperCase();
                    const isActive = status === "ACTIVE";
                    const reliability = (c.reliability || "").toUpperCase();
                    const confianzaLabel = reliabilityLabelMap[reliability] ?? (reliability || "—");
                    return (
                        <article
                            key={c.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {c.name}
                                </h3>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    {confianzaLabel}
                                </span>
                            </div>

                            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                                <p>{c.phone || "—"}</p>
                                {c.alternatePhone ? <p>Alt: {c.alternatePhone}</p> : null}
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-2">
                                <button
                                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                    onClick={() => navigate(`/clientes/${c.id}/editar`)}
                                >
                                    <HiPencilAlt className="h-4 w-4" />
                                    Editar
                                </button>
                                <button
                                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm transition ${isActive
                                        ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25"
                                        : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25"
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
                                    {isActive ? "Eliminar" : "Activar"}
                                </button>
                                <button
                                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 shadow-sm transition hover:bg-sky-100 dark:border-sky-500/50 dark:bg-sky-500/15 dark:text-sky-200 dark:hover:bg-sky-500/25"
                                    onClick={() => navigate(`/clientes/${c.id}`)}
                                >
                                    <HiEye className="h-4 w-4" />
                                    Ver
                                </button>
                            </div>
                        </article>
                    );
                })}
                {!rows.length && !loading && (
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        No hay clientes con esos filtros.
                    </div>
                )}
                {loading && (
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        Cargando...
                    </div>
                )}
            </div>

            <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 shadow-xl dark:border-slate-700 dark:bg-slate-900/80 sm:block">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-white/70 text-slate-500 backdrop-blur-lg dark:bg-slate-900/70 dark:text-slate-200">
                        <tr>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300">Nombre</th>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300">Teléfono</th>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300">Confianza</th>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/80">
                        {rows.map((c) => {
                            const status = (c.status || "ACTIVE").toUpperCase();
                            const isActive = status === "ACTIVE";
                            const reliability = (c.reliability || "").toUpperCase();
                            const confianzaLabel = reliabilityLabelMap[reliability] ?? (reliability || "—");
                            return (
                                <tr key={c.id} className="transition hover:bg-sky-50/40 odd:bg-white/95 even:bg-slate-50/80 dark:odd:bg-slate-900/50 dark:even:bg-slate-900/35 dark:hover:bg-slate-900/55">
                                    <td className="border-x border-slate-100 px-5 py-4 text-center text-slate-700 first:border-l-0 last:border-r-0 dark:border-slate-800 dark:text-slate-100">{c.name}</td>
                                    <td className="border-x border-slate-100 px-5 py-4 text-center text-slate-600 first:border-l-0 last:border-r-0 dark:border-slate-800 dark:text-slate-200">
                                        <div className="font-medium text-slate-700 dark:text-slate-100">{c.phone}</div>
                                        {c.alternatePhone && (
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                Alt: {c.alternatePhone}
                                            </div>
                                        )}
                                    </td>
                                    <td className="border-x border-slate-100 px-5 py-4 text-center text-slate-600 first:border-l-0 last:border-r-0 dark:border-slate-800 dark:text-slate-200">{confianzaLabel}</td>
                                    <td className="border-x border-slate-100 px-5 py-4 text-center first:border-l-0 last:border-r-0 dark:border-slate-800">
                                        <div className="flex flex-wrap justify-center gap-2 text-sm">
                                            <button
                                                className="inline-flex min-w-[118px] items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-500/40 dark:bg-slate-500/15 dark:text-slate-200 dark:hover:bg-slate-500/25"
                                                onClick={() => navigate(`/clientes/${c.id}/editar`)}
                                            >
                                                <HiPencilAlt className="h-4 w-4" />
                                                Editar
                                            </button>
                                            <button
                                                className={`inline-flex min-w-[118px] items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 font-semibold shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 ${isActive
                                                    ? "border-rose-200 bg-white/80 text-rose-600 hover:border-rose-300 hover:bg-rose-50 focus:ring-rose-200 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25"
                                                    : "border-emerald-200 bg-white/80 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 focus:ring-emerald-200 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25"
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
                                                {isActive ? "Eliminar" : "Activar"}
                                            </button>
                                            <button
                                                className="inline-flex min-w-[118px] items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-sky-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20"
                                                onClick={() => navigate(`/clientes/${c.id}`)}
                                            >
                                                <HiEye className="h-4 w-4" />
                                                Ver
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {!rows.length && !loading && (
                            <tr>
                                <td colSpan={4} className="border-x border-slate-200 px-4 py-8 text-center text-gray-500 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-gray-400">
                                    No hay clientes con esos filtros.
                                </td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan={4} className="border-x border-slate-200 px-4 py-8 text-center text-gray-500 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-gray-400">
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
                    {reliabilityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="hidden md:block" />
        </div>
    );
}

