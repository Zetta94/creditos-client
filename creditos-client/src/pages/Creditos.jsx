import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { HiPlus, HiEye, HiSearch, HiFilter } from "react-icons/hi";
import { loadCredits } from "../store/creditsSlice";
import Pagination from "../components/Pagination";

export default function Creditos() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { list: creditos, loading, meta } = useSelector(state => state.credits) || { list: [], loading: false, meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 } };

    // === Estados ===
    const [q, setQ] = useState("");
    const [estado, setEstado] = useState("todos");
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        setPage(meta?.page ?? 1);
        setPageSize(meta?.pageSize ?? 10);
    }, [meta?.page, meta?.pageSize]);

    // Cargar créditos al montar
    useEffect(() => {
        const timeout = setTimeout(() => {
            dispatch(loadCredits({ page, pageSize, q: q.trim() ? q.trim() : undefined }));
        }, 200);
        return () => clearTimeout(timeout);
    }, [dispatch, page, pageSize, q]);

    useEffect(() => {
        setPage(1);
    }, [q, estado]);

    // === Construcción de datos combinados ===
    const creditosMock = useMemo(
        () =>
            creditos.map((cr) => {
                return {
                    id: cr.id,
                    cliente: cr.client?.name || "Cliente desconocido",
                    monto: cr.amount,
                    cuotas: cr.totalInstallments,
                    pagadas: cr.paidInstallments,
                    estado: cr.status,
                    fechaInicio: cr.startDate,
                };
            }),
        [creditos]
    );

    // === Filtrado ===
    const rows = useMemo(() => {
        const qn = q.trim().toLowerCase();
        return creditosMock.filter((c) => {
            const okText = !qn || c.cliente.toLowerCase().includes(qn);
            const okEstado = estado === "todos" || c.estado === estado;
            return okText && okEstado;
        });
    }, [q, estado, creditosMock]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            {/* === Header === */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-bold sm:text-2xl">Créditos</h1>

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Toggle filtros en móvil */}
                    <button
                        onClick={() => setShowFilters((s) => !s)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 sm:hidden"
                        aria-expanded={showFilters}
                    >
                        <HiFilter className="h-4 w-4" />
                        Filtros
                    </button>

                    {/* Nuevo crédito */}
                    <button
                        onClick={() => navigate("/creditos/nuevo")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-[0.98]"
                    >
                        <HiPlus className="h-5 w-5" />
                        Nuevo crédito
                    </button>
                </div>
            </div>

            {/* === Filtros === */}
            <div className="grid gap-3">
                {/* Panel móvil plegable */}
                <div
                    className={`grid gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800 sm:hidden ${showFilters ? "grid" : "hidden"
                        }`}
                >
                    <SearchInput q={q} setQ={setQ} />
                    <EstadoSelect estado={estado} setEstado={setEstado} />
                </div>

                {/* Filtros visibles en desktop */}
                <div className="hidden items-end gap-3 sm:flex">
                    <SearchInput q={q} setQ={setQ} />
                    <EstadoSelect estado={estado} setEstado={setEstado} />
                </div>
            </div>

            {/* ===== MOBILE: Cards ===== */}
            <div className="grid gap-3 sm:hidden">
                {rows.length === 0 ? (
                    <EmptyState onCreate={() => navigate("/creditos/nuevo")} />
                ) : (
                    rows.map((c) => (
                        <CreditoCard
                            key={c.id}
                            data={c}
                            onView={() => navigate(`/creditos/${c.id}`)}
                        />
                    ))
                )}
            </div>

            {/* ===== DESKTOP: Tabla ===== */}
            <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:block">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-50/80 text-gray-600 backdrop-blur dark:bg-gray-800/80 dark:text-gray-300">
                        <tr>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[200px]">
                                Cliente
                            </th>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[140px]">
                                Monto total
                            </th>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[100px]">
                                Cuotas
                            </th>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[160px]">
                                Pagadas
                            </th>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[120px]">
                                Estado
                            </th>
                            <th className="px-4 py-3 text-center font-medium whitespace-nowrap min-w-[140px]">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                                >
                                    No se encontraron créditos.
                                </td>
                            </tr>
                        ) : (
                            rows.map((c) => (
                                <tr
                                    key={c.id}
                                    className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800/70"
                                >
                                    <td className="px-4 py-3 align-middle text-gray-900 dark:text-gray-100">
                                        {c.cliente}
                                    </td>
                                    <td className="px-4 py-3 align-middle text-gray-900 dark:text-gray-100">
                                        ${c.monto.toLocaleString("es-AR")}
                                    </td>
                                    <td className="px-4 py-3 align-middle">{c.cuotas}</td>
                                    <td className="px-4 py-3 align-middle">
                                        <div className="flex items-center gap-2">
                                            <span>
                                                {c.pagadas}/{c.cuotas}
                                            </span>
                                            <Progress value={(c.pagadas / c.cuotas) * 100} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                        <EstadoPill estado={c.estado} />
                                    </td>
                                    <td className="px-4 py-3 text-center align-middle">
                                        <button
                                            onClick={() => navigate(`/creditos/${c.id}`)}
                                            className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-white hover:bg-sky-500"
                                        >
                                            <HiEye className="h-4 w-4" /> Ver
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6">
                <Pagination
                    page={meta?.page ?? page}
                    pageSize={meta?.pageSize ?? pageSize}
                    totalItems={meta?.totalItems ?? creditos.length}
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

/* ===== Subcomponentes ===== */

function SearchInput({ q, setQ }) {
    return (
        <div className="relative w-full sm:max-w-xs">
            <HiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por cliente..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
        </div>
    );
}

function EstadoSelect({ estado, setEstado }) {
    return (
        <div className="grid gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">Estado</label>
            <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
                <option value="todos">Todos</option>
                <option value="PENDING">Pendiente</option>
                <option value="PAID">Pagado</option>
                <option value="OVERDUE">Vencido</option>
            </select>
        </div>
    );
}

function Progress({ value }) {
    return (
        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
                className="h-full bg-blue-600 transition-[width] duration-300 ease-out"
                style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
            />
        </div>
    );
}

function estadoClasses(estado) {
    return {
        PENDING:
            "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
        PAID:
            "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        OVERDUE:
            "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    }[estado];
}

function EstadoPill({ estado }) {
    const label =
        estado === "PENDING"
            ? "Pendiente"
            : estado === "PAID"
                ? "Pagado"
                : "Vencido";
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${estadoClasses(
                estado
            )}`}
        >
            {label}
        </span>
    );
}

function CreditoCard({ data, onView }) {
    const pct = (data.pagadas / data.cuotas) * 100;
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{data.cliente}</div>
                    <div className="text-xs text-gray-500">
                        Inicio: {data.fechaInicio}
                    </div>
                </div>
                <EstadoPill estado={data.estado} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Monto</div>
                <div>${data.monto.toLocaleString("es-AR")}</div>
                <div className="text-gray-500">Cuotas</div>
                <div>{data.cuotas}</div>
                <div className="text-gray-500">Pagadas</div>
                <div className="flex items-center gap-2">
                    {data.pagadas}/{data.cuotas}
                    <Progress value={pct} />
                </div>
            </div>

            <div className="mt-3">
                <button
                    onClick={onView}
                    className="w-full rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
                >
                    <HiEye className="mr-1 inline h-4 w-4" />
                    Ver
                </button>
            </div>
        </div>
    );
}

function EmptyState({ onCreate }) {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No se encontraron créditos.{" "}
            <button
                onClick={onCreate}
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
                Crear nuevo
            </button>
        </div>
    );
}
