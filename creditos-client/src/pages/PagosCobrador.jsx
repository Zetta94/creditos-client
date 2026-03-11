import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi";
import { fetchAssignmentsEnriched } from "../services/assignmentsService";

const CREDIT_TYPE_TO_FILTER = {
    DAILY: "diario",
    WEEKLY: "semanal",
    QUINCENAL: "quincenal",
    MONTHLY: "mensual",
    ONE_TIME: "mensual",
};

const isCreditFinalized = (credit) => {
    if (!credit) return true;
    if (String(credit.status || "").toUpperCase() === "PAID") return true;

    const totalInstallments = Number(credit.totalInstallments ?? 0);
    const paidInstallments = Number(credit.paidInstallments ?? 0);
    if (totalInstallments > 0 && paidInstallments >= totalInstallments) return true;

    const totalAmount = Number(credit.amount ?? 0);
    const installmentAmount = Number(
        credit.installmentAmount ?? (totalInstallments > 0 ? totalAmount / totalInstallments : 0)
    );
    const receivedAmount = Number(credit.receivedAmount ?? 0);

    if (totalInstallments > 0 && installmentAmount > 0) {
        const paidInstallmentsByAmount = Math.floor(receivedAmount / installmentAmount);
        return paidInstallmentsByAmount >= totalInstallments;
    }

    if (totalInstallments <= 0 && totalAmount > 0 && receivedAmount >= totalAmount) return true;

    return false;
};

export default function ClientesAsignadosCobrador({ cobradorId }) {
    const [tipo, setTipo] = useState("todos");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ page: 1, pageSize: 20, totalItems: 0, totalPages: 1 });
    const [clientesHoy, setClientesHoy] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    useEffect(() => {
        cargarClientes(tipo, page, search);
    }, [tipo, cobradorId, page, search]);

    async function cargarClientes(filtro, currentPage = 1, searchText = "") {
        setLoading(true);
        try {
            const hoy = new Date();
            hoy.setHours(23, 59, 59, 999);
            const storedUser = localStorage.getItem("user");
            const currentUser = storedUser ? JSON.parse(storedUser) : null;
            const id = cobradorId || currentUser?.id;
            if (!id) {
                setClientesHoy([]);
                return;
            }

            const params = { cobradorId: id };
            if (searchText) params.q = searchText;

            const response = await fetchAssignmentsEnriched({ page: 1, pageSize: 1000, dueOnly: true, ...params });
            const enriched = response.data?.data ?? [];
            const clientesDisponibles = [];

            for (const asig of enriched) {
                const cliente = asig.client;
                const credit = asig.credit;
                if (!credit) continue;
                if (isCreditFinalized(credit)) continue;

                const tipoCredito = CREDIT_TYPE_TO_FILTER[String(credit.type || "").toUpperCase()] || asig.tipoPago?.toLowerCase() || "mensual";
                const filtroCoincide = filtro === "todos" || tipoCredito === filtro;
                if (!filtroCoincide) continue;

                const pendingSinceDate = asig.pendingSince ? new Date(asig.pendingSince) : null;
                const nextVisitDate = asig.nextVisitDate ? new Date(asig.nextVisitDate) : null;
                const venceHoy = Boolean(
                    (nextVisitDate && nextVisitDate <= hoy) ||
                    (pendingSinceDate && pendingSinceDate <= hoy)
                );

                const cuotaActual = credit.paidInstallments + 1;
                const cuotasRestantes = credit.totalInstallments - credit.paidInstallments;
                const pendingAmount = asig.pendingAmount ?? credit.installmentAmount ?? 0;
                const pendingOccurrences = asig.effectiveOccurrences ?? 1;
                const pendingDates = Array.isArray(asig.pendingDates) ? asig.pendingDates : [];
                const pendingSince = asig.pendingSince || asig.nextVisitDate;
                const pendingDatesFormatted = pendingDates.map((d) => new Date(d).toLocaleDateString("es-AR"));
                const estaHabilitadoHoy = Boolean(
                    (nextVisitDate && nextVisitDate <= hoy) ||
                    (pendingSinceDate && pendingSinceDate <= hoy)
                );

                if (!estaHabilitadoHoy) continue;

                const item = {
                    assignmentId: asig.id,
                    ...cliente,
                    creditoId: credit.id,
                    monto: credit.installmentAmount,
                    estado: credit.status,
                    tipoPago: tipoCredito,
                    cuotaActual,
                    cuotasRestantes,
                    totalCuotas: credit.totalInstallments,
                    paidToday: !!asig.paidToday,
                    lastPayment: asig.lastPayment || null,
                    venceHoy,
                    orden: asig.orden,
                    pendingAmount,
                    pendingOccurrences,
                    pendingDates,
                    pendingDatesFormatted,
                    pendingSince,
                    nextVisitDate: asig.nextVisitDate,
                    disponibleHoy: true
                };

                clientesDisponibles.push(item);
            }

            const pageSize = 20;
            const totalItems = clientesDisponibles.length;
            const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
            const safePage = Math.min(Math.max(1, currentPage), totalPages);
            const startIndex = (safePage - 1) * pageSize;
            const paginatedItems = clientesDisponibles.slice(startIndex, startIndex + pageSize);

            setClientesHoy(paginatedItems);
            setMeta({
                page: safePage,
                pageSize,
                totalItems,
                totalPages
            });
            setError(null);
        } catch (err) {
            const status = err?.response?.status;
            setError(status === 403 ? "No tenes permisos para ver estas asignaciones." : "Ocurrio un error al cargar los clientes.");
            setClientesHoy([]);
            setMeta({ page: 1, pageSize: 20, totalItems: 0, totalPages: 1 });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#08122f] to-[#0b1f55] px-3 py-4 sm:px-4 sm:py-6">
            <div className="mx-auto max-w-5xl space-y-4">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-sm">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
                        Cobros del dia
                    </h1>
                    <p className="mt-1 text-sm text-slate-300">
                        Solo se muestran clientes habilitados para hoy.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                    {["todos", "diario", "semanal", "quincenal", "mensual"].map((f) => (
                        <button
                            key={f}
                            onClick={() => {
                                setTipo(f);
                                setPage(1);
                            }}
                            className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium transition sm:w-auto ${tipo === f
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-slate-900/80 text-slate-200 hover:bg-slate-700"
                                }`}
                        >
                            {f === "todos" ? "Todos" : `${f[0].toUpperCase()}${f.slice(1)}`}
                        </button>
                    ))}
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                        Buscar cliente para cobrar hoy
                    </label>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Nombre, documento o telefono"
                        className="w-full rounded-xl border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/20"
                    />
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 shadow-sm">
                <div className="border-b border-slate-700 p-4">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-100">
                        Cobros a realizar hoy ({meta.totalItems})
                    </h2>
                </div>

                {loading ? (
                    <p className="p-4 text-gray-500 dark:text-gray-400">Cargando clientes...</p>
                ) : error ? (
                    <p className="p-4 text-red-500 dark:text-red-400">{error}</p>
                ) : clientesHoy.length === 0 ? (
                    <p className="p-4 text-gray-500 dark:text-gray-400">No hay pagos programados para hoy.</p>
                ) : (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {clientesHoy.map((c) => (
                            <li key={c.creditoId} className="flex flex-col gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                <div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                {c.orden ? `${c.orden}. ` : ""}{c.name}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {c.address || "Sin direccion"}
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-300">
                                            {String(c.tipoPago || "-")}
                                        </span>
                                    </div>

                                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-300 sm:grid-cols-3">
                                        <div className="rounded-lg bg-slate-800/70 px-3 py-2">
                                            <p className="text-xs text-slate-400">Monto cuota</p>
                                            <p className="font-semibold text-slate-100">${Number(c.monto || 0).toLocaleString("es-AR")}</p>
                                        </div>
                                        <div className="rounded-lg bg-slate-800/70 px-3 py-2">
                                            <p className="text-xs text-slate-400">Cuota actual</p>
                                            <p className="font-semibold text-slate-100">{c.cuotaActual}/{c.totalCuotas}</p>
                                        </div>
                                        <div className="rounded-lg bg-slate-800/70 px-3 py-2">
                                            <p className="text-xs text-slate-400">Ultimo pago</p>
                                            <p className="font-semibold text-slate-100">{c.lastPayment ? new Date(c.lastPayment).toLocaleDateString("es-AR") : "Sin pagos"}</p>
                                        </div>
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {c.paidToday ? (
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Cobrado hoy</span>
                                        ) : c.venceHoy ? (
                                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Vence hoy</span>
                                        ) : null}
                                        {String(c.estado || "").toUpperCase() === "OVERDUE" && (
                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Atrasado</span>
                                        )}
                                    </div>
                                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                                        <p>
                                            Pendiente estimado: <span className="font-semibold">${Number(c.pendingAmount || 0).toLocaleString("es-AR")}</span>
                                            {c.pendingOccurrences > 1 && ` (${c.pendingOccurrences} cuotas)`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 sm:items-center pt-1">
                                    <button
                                        onClick={() => navigate(`/cobrador/pagos/${c.creditoId}`, {
                                            state: {
                                                pendingInfo: {
                                                    pendingAmount: c.pendingAmount,
                                                    pendingOccurrences: c.pendingOccurrences,
                                                    pendingDates: c.pendingDates,
                                                    pendingSince: c.pendingSince
                                                }
                                            }
                                        })}
                                        disabled={c.paidToday}
                                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none w-full sm:w-auto ${c.paidToday ? "bg-gray-400 text-white cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-500 shadow-sm"}`}
                                    >
                                        {c.paidToday ? "Ya cobrado" : "Cobrar"}
                                        <HiArrowRight className="h-4 w-4" />
                                    </button>

                                    {!c.paidToday && (
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/cobrador/pagos/${c.creditoId}/reprogramar`, {
                                                state: {
                                                    assignmentId: c.assignmentId,
                                                    clientName: c.name
                                                }
                                            })}
                                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 w-full sm:w-auto"
                                        >
                                            No pude cobrar
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                {!loading && !error && meta.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-700 px-4 py-3 text-sm text-slate-300">
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={meta.page <= 1}
                            className={`rounded-lg px-3 py-1.5 ${meta.page <= 1 ? "cursor-not-allowed bg-slate-700 text-slate-500" : "bg-slate-700 hover:bg-slate-600 text-white"}`}
                        >
                            Anterior
                        </button>
                        <span>
                            Pagina {meta.page} de {meta.totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.min(meta.totalPages, prev + 1))}
                            disabled={meta.page >= meta.totalPages}
                            className={`rounded-lg px-3 py-1.5 ${meta.page >= meta.totalPages ? "cursor-not-allowed bg-slate-700 text-slate-500" : "bg-slate-700 hover:bg-slate-600 text-white"}`}
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}
