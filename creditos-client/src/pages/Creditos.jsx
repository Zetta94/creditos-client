import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { HiPlus, HiEye, HiSearch, HiFilter, HiBan } from "react-icons/hi";
import { loadCredits } from "../store/creditsSlice";
import Pagination from "../components/Pagination";

const CREDIT_TYPE_OPTIONS = [
    { value: "todos", label: "Todos" },
    { value: "ONE_TIME", label: "Pago único" },
    { value: "DAILY", label: "Diario" },
    { value: "WEEKLY", label: "Semanal" },
    { value: "QUINCENAL", label: "Quincenal" },
    { value: "MONTHLY", label: "Mensual" }
];

export default function Creditos() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { list: creditos, loading, meta } = useSelector(state => state.credits) || { list: [], loading: false, meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 } };

    // === Estados ===
    const [q, setQ] = useState("");
    const [estado, setEstado] = useState("todos");
    const [tipo, setTipo] = useState("todos");
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
            const params = { page, pageSize };
            const search = q.trim();
            if (search) params.q = search;
            if (estado !== "todos") params.status = estado;
            if (tipo !== "todos") params.type = tipo;
            dispatch(loadCredits(params));
        }, 200);
        return () => clearTimeout(timeout);
    }, [dispatch, page, pageSize, q, estado, tipo]);

    useEffect(() => {
        setPage(1);
    }, [q, estado, tipo]);

    // === Construcción de datos combinados ===
    const creditosMock = useMemo(
        () =>
            creditos.map((cr, index) => {
                const monto = Number(cr.amount) || 0;
                const totalInstallments = Number(cr.totalInstallments || 0);
                const paidInstallments = Number(cr.paidInstallments || 0);
                const safeTotal = totalInstallments > 0 ? totalInstallments : 1;
                const progress = Math.min(100, Math.max(0, (paidInstallments / safeTotal) * 100));
                const key = cr.id || `temp-${cr.clientId || ""}-${cr.startDate || index}`;
                return {
                    id: cr.id,
                    key,
                    cliente: cr.client?.name || "Cliente desconocido",
                    documento: cr.client?.document || "",
                    telefono: cr.client?.phone || "",
                    telefonoAlternativo: cr.client?.alternatePhone || "",
                    monto,
                    cuotas: totalInstallments,
                    pagadas: paidInstallments,
                    estado: cr.status,
                    fechaInicio: cr.startDate,
                    progress,
                    progressLabel: `${paidInstallments}/${totalInstallments || 0}`
                };
            }),
        [creditos]
    );

    // === Filtrado ===
    const rows = useMemo(() => creditosMock, [creditosMock]);
    const canCancelCredit = (credit) => credit.estado !== "PAID";

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
                    <TipoSelect tipo={tipo} setTipo={setTipo} />
                </div>

                {/* Filtros visibles en desktop */}
                <div className="hidden items-end gap-3 sm:flex">
                    <SearchInput q={q} setQ={setQ} />
                    <EstadoSelect estado={estado} setEstado={setEstado} />
                    <TipoSelect tipo={tipo} setTipo={setTipo} />
                </div>
            </div>

            {/* ===== MOBILE: Cards ===== */}
            <div className="grid gap-3 sm:hidden">
                {rows.length === 0 ? (
                    <EmptyState onCreate={() => navigate("/creditos/nuevo")} />
                ) : (
                    rows.map((c) => (
                        <CreditoCard
                            key={c.key}
                            data={c}
                            onView={() => navigate(`/creditos/${c.id}`)}
                            onCancel={() => navigate(`/creditos/${c.id}/cancelar`)}
                            canCancel={canCancelCredit(c)}
                        />
                    ))
                )}
            </div>

            {/* ===== DESKTOP: Tabla ===== */}
            <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white shadow-lg dark:border-slate-700/60 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-900 sm:block">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-white/70 text-slate-500 backdrop-blur-lg dark:bg-slate-900/70 dark:text-slate-200">
                        <tr>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[200px]">
                                Cliente
                            </th>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[140px]">
                                Monto total
                            </th>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[100px]">
                                Cuotas
                            </th>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[160px]">
                                Pagadas
                            </th>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[120px]">
                                Estado
                            </th>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[220px]">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800">
                        {rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="border-x border-slate-200 px-4 py-8 text-center text-gray-500 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-gray-400"
                                >
                                    No se encontraron créditos.
                                </td>
                            </tr>
                        ) : (
                            rows.map((c) => (
                                <tr
                                    key={c.key}
                                    className="transition hover:bg-sky-50/40 odd:bg-white/95 even:bg-slate-50/80 dark:odd:bg-slate-900/55 dark:even:bg-slate-900/35 dark:hover:bg-slate-900"
                                >
                                    <td className="border-x border-slate-100 px-5 py-4 text-center align-middle text-slate-700 first:border-l-0 last:border-r-0 dark:border-slate-800 dark:text-slate-100">
                                        {c.cliente}
                                    </td>
                                    <td className="border-x border-slate-100 px-5 py-4 text-center align-middle text-slate-700 first:border-l-0 last:border-r-0 dark:border-slate-800 dark:text-slate-100">
                                        ${c.monto.toLocaleString("es-AR")}
                                    </td>
                                    <td className="border-x border-slate-100 px-5 py-4 text-center align-middle text-slate-600 first:border-l-0 last:border-r-0 dark:border-slate-800 dark:text-slate-200">{c.cuotas}</td>
                                    <td className="border-x border-slate-100 px-5 py-4 text-center align-middle first:border-l-0 last:border-r-0 dark:border-slate-800">
                                        <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-200">
                                            <span className="font-medium">{c.progressLabel}</span>
                                            <Progress value={c.progress} />
                                        </div>
                                    </td>
                                    <td className="border-x border-slate-100 px-5 py-4 text-center align-middle first:border-l-0 last:border-r-0 dark:border-slate-800">
                                        <EstadoPill estado={c.estado} />
                                    </td>
                                    <td className="border-x border-slate-100 px-5 py-4 text-center align-middle first:border-l-0 last:border-r-0 dark:border-slate-800">
                                        <div className="flex justify-center gap-2 text-sm">
                                            <button
                                                onClick={() => navigate(`/creditos/${c.id}`)}
                                                className="inline-flex min-w-[118px] items-center justify-center gap-1.5 rounded-full border border-sky-200 bg-white/80 px-3 py-1.5 font-semibold text-sky-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-sky-500/50 dark:bg-sky-500/15 dark:text-sky-200 dark:hover:bg-sky-500/25"
                                            >
                                                <HiEye className="h-4 w-4" /> Ver
                                            </button>
                                            {canCancelCredit(c) ? (
                                                <button
                                                    onClick={() => navigate(`/creditos/${c.id}/cancelar`)}
                                                    className="inline-flex min-w-[118px] items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-white/80 px-3 py-1.5 font-semibold text-rose-600 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25"
                                                >
                                                    <HiBan className="h-4 w-4" /> Cancelar
                                                </button>
                                            ) : (
                                                <span className="inline-flex min-w-[118px] items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200">
                                                    Cancelado
                                                </span>
                                            )}
                                        </div>
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
                placeholder="Buscar por cliente, documento o teléfono..."
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

function TipoSelect({ tipo, setTipo }) {
    return (
        <div className="grid gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">Tipo</label>
            <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
                {CREDIT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
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
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
        PAID:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
        OVERDUE:
            "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
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
            className={`inline-flex min-w-[110px] items-center justify-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold tracking-wide ${estadoClasses(
                estado
            )}`}
        >
            {label}
        </span>
    );
}

function CreditoCard({ data, onView, onCancel, canCancel = true }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-4 shadow-lg dark:border-slate-700/60 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-900">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{data.cliente}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Inicio: {data.fechaInicio}
                    </div>
                </div>
                <EstadoPill estado={data.estado} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Monto</div>
                <div className="font-medium text-slate-700 dark:text-slate-100">${data.monto.toLocaleString("es-AR")}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Cuotas</div>
                <div className="font-medium text-slate-700 dark:text-slate-100">{data.cuotas}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Pagadas</div>
                <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-100">
                    {data.progressLabel}
                    <Progress value={data.progress} />
                </div>
            </div>

            <div className="mt-4 flex gap-2">
                <button
                    onClick={onView}
                    className="flex-1 min-w-[118px] rounded-full border border-sky-200 bg-white/80 px-3 py-2 text-sm font-semibold text-sky-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-sky-500/50 dark:bg-sky-500/15 dark:text-sky-200 dark:hover:bg-sky-500/25"
                >
                    <span className="inline-flex items-center gap-1">
                        <HiEye className="h-4 w-4" />
                        Ver
                    </span>
                </button>
                {canCancel ? (
                    <button
                        onClick={onCancel}
                        className="flex-1 min-w-[118px] rounded-full border border-rose-200 bg-white/80 px-3 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25"
                    >
                        <span className="inline-flex items-center gap-1">
                            <HiBan className="h-4 w-4" />
                            Cancelar
                        </span>
                    </button>
                ) : (
                    <span className="flex-1 min-w-[118px] rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-700 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200">
                        Cancelado
                    </span>
                )}
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
