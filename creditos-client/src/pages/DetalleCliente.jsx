import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchClient } from "../services/clientsService";
import { fetchCredits } from "../services/creditsService";
import { fetchAssignments } from "../services/assignmentsService";

const CREDIT_TYPE_LABELS = {
    DAILY: "Diario",
    WEEKLY: "Semanal",
    QUINCENAL: "Quincenal",
    MONTHLY: "Mensual",
    ONE_TIME: "Unico",
};

export default function ClienteDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [cliente, setCliente] = useState(null);
    const [creditos, setCreditos] = useState([]);
    const [assignmentsByCollector, setAssignmentsByCollector] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;
        async function loadData() {
            setLoading(true);
            setError(null);
            try {
                const [clienteRes, creditosRes, assignmentsRes] = await Promise.all([
                    fetchClient(id),
                    fetchCredits({ page: 1, pageSize: 200, clientId: id }),
                    fetchAssignments({ page: 1, pageSize: 500 })
                ]);

                if (!active) return;

                setCliente(clienteRes.data ?? null);
                const contratos = Array.isArray(creditosRes.data?.data)
                    ? creditosRes.data.data.filter((cr) => cr.clientId === id)
                    : [];
                setCreditos(contratos);

                const assignments = Array.isArray(assignmentsRes.data?.data)
                    ? assignmentsRes.data.data.filter((a) => a?.clienteId === id)
                    : [];
                const byCollector = assignments.reduce((acc, item) => {
                    if (item?.cobradorId) acc[item.cobradorId] = item;
                    return acc;
                }, {});
                setAssignmentsByCollector(byCollector);
            } catch (err) {
                console.error("No se pudo cargar el detalle de cliente", err);
                if (!active) return;
                setError("No se pudo cargar la información del cliente.");
                setCliente(null);
                setCreditos([]);
                setAssignmentsByCollector({});
            } finally {
                if (active) setLoading(false);
            }
        }

        loadData();
        return () => {
            active = false;
        };
    }, [id]);

    const creditosOrdenados = useMemo(() => {
        return [...creditos].sort((a, b) => {
            const endB = new Date(b.createdAt || b.startDate || 0).getTime();
            const endA = new Date(a.createdAt || a.startDate || 0).getTime();
            return endB - endA;
        });
    }, [creditos]);

    if (loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400">
                Cargando cliente...
            </div>
        );
    }

    if (error || !cliente) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                <p className="mb-4 text-red-400">{error || "Cliente no encontrado."}</p>
                <button
                    onClick={() => {
                        if (window.history.length > 2) {
                            navigate(-1);
                        } else {
                            navigate("/clientes");
                        }
                    }}
                    className="rounded-lg bg-gray-700 px-4 py-2 hover:bg-gray-600 text-white"
                >
                    Volver
                </button>
            </div>
        );
    }

    const reliability = (cliente.reliability || "").toUpperCase();
    const reliabilityLabel = reliability === "MUYALTA"
        ? "Muy alta"
        : reliability === "ALTA"
            ? "Alta"
            : reliability === "MOROSO" || reliability === "BAJA"
                ? "Baja"
                : "Media";
    const status = (cliente.status || "ACTIVE").toUpperCase();
    const statusLabel = status === "ACTIVE" ? "Activo" : "Inactivo";
    const birthDateLabel = cliente.birthDate ? new Date(cliente.birthDate).toLocaleDateString("es-AR") : null;

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate("/clientes");
        }
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="truncate text-xl font-bold sm:text-2xl">{cliente.name}</h1>
                    <p className="text-sm text-gray-300">
                        {cliente.phone}
                        {cliente.alternatePhone && (
                            <span> • Alt: {cliente.alternatePhone}</span>
                        )}
                        {" "}• DNI: {cliente.document}
                    </p>
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                        <span>Estado:</span>
                        <StatusBadge status={status} label={statusLabel} />
                    </p>
                    {birthDateLabel && (
                        <p className="text-sm text-gray-400">
                            Fecha de nacimiento: {birthDateLabel}
                        </p>
                    )}
                    <p className="text-sm text-gray-400">
                        {cliente.address} - {cliente.city}, {cliente.province}
                    </p>
                    <p className="text-sm text-gray-400">
                        Confianza:{" "}
                        <span className="font-semibold capitalize">{reliabilityLabel}</span>
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <button
                        onClick={() => navigate(`/clientes/${cliente.id}/editar`)}
                        className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 sm:w-auto"
                    >
                        Editar cliente
                    </button>
                    <button
                        onClick={handleBack}
                        className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 sm:w-auto"
                    >
                        Volver
                    </button>
                </div>
            </div>

            {/* Créditos */}
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold">Créditos del cliente</h2>
                    <button
                        onClick={() => navigate("/creditos/nuevo")}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-auto"
                    >
                        + Nuevo crédito
                    </button>
                </div>

                {/* Lista MOBILE */}
                <div className="grid gap-3 sm:hidden">
                    {creditosOrdenados.length === 0 ? (
                        <CardEmpty />
                    ) : (
                        creditosOrdenados.map((cr) => (
                            <CreditoCard
                                key={cr.id}
                                cr={cr}
                                assignmentsByCollector={assignmentsByCollector}
                                onView={() => navigate(`/creditos/${cr.id}`)}
                            />
                        ))
                    )}
                </div>

                {/* Tabla DESKTOP */}
                <div className="hidden rounded-lg border border-gray-200 dark:border-gray-700 sm:block">
                    <table className="w-full table-fixed text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-gray-50/80 text-gray-600 backdrop-blur dark:bg-gray-800/80 dark:text-gray-300">
                            <tr>
                                <th className="w-[16%] px-3 py-3 font-medium">Proximo cobro (ruta)</th>
                                <th className="w-[14%] px-3 py-3 font-medium">Tipo</th>
                                <th className="w-[16%] px-3 py-3 font-medium">Monto</th>
                                <th className="w-[10%] px-3 py-3 font-medium">Cuotas</th>
                                <th className="w-[20%] px-3 py-3 font-medium">Pagadas</th>
                                <th className="w-[12%] px-3 py-3 font-medium">Estado</th>
                                <th className="w-[12%] px-3 py-3 text-center font-medium">Accion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {creditosOrdenados.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        Sin créditos para este cliente.
                                    </td>
                                </tr>
                            ) : (
                                creditosOrdenados.map((cr) => (
                                    (() => {
                                        const totalInstallments = Number(cr.totalInstallments || 0);
                                        const rawPaidInstallments = Number(cr.paidInstallments || 0);
                                        const isPaidStatus = String(cr.status || "").toUpperCase() === "PAID";
                                        const paidInstallmentsDisplay = isPaidStatus && totalInstallments > 0
                                            ? totalInstallments
                                            : rawPaidInstallments;
                                        const progressValue = totalInstallments > 0
                                            ? (paidInstallmentsDisplay / totalInstallments) * 100
                                            : 0;
                                        return (
                                    <tr
                                        key={cr.id}
                                        className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800/70"
                                    >
                                        <td className="px-3 py-3 align-middle">
                                            <div className="flex flex-col">
                                                <span>{formatNextVisitDate(cr, assignmentsByCollector)}</span>
                                                <span className="text-[11px] text-gray-400">
                                                    {formatNextInstallmentLabel(cr)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 align-middle">
                                            {CREDIT_TYPE_LABELS[String(cr.type || "").toUpperCase()] || "-"}
                                        </td>
                                        <td className="px-3 py-3 align-middle whitespace-nowrap">
                                            ${formatCurrency(cr.amount)}
                                        </td>
                                        <td className="px-3 py-3 align-middle">
                                            {Number(cr.totalInstallments || 0)}
                                        </td>
                                        <td className="px-3 py-3 align-middle">
                                            <div className="flex items-center gap-2">
                                                <span className="whitespace-nowrap text-xs lg:text-sm">
                                                    {paidInstallmentsDisplay}/{totalInstallments}
                                                </span>
                                                <Progress value={progressValue} />
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 align-middle">
                                            <EstadoPill estado={cr.status} />
                                        </td>
                                        <td className="px-3 py-3 text-center align-middle">
                                            <button
                                                onClick={() => navigate(`/creditos/${cr.id}`)}
                                                className="rounded-md bg-sky-600 px-2.5 py-2 text-xs text-white hover:bg-sky-500 lg:px-3 lg:text-sm"
                                            >
                                                Ver
                                            </button>
                                        </td>
                                    </tr>
                                        );
                                    })()
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

/* ===== Subcomponentes UI ===== */

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

function StatusBadge({ status, label }) {
    const isActive = status === "ACTIVE";
    const classes = isActive
        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";

    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${classes}`}>
            {label}
        </span>
    );
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

const formatCurrency = (value) => Number(value || 0).toLocaleString("es-AR");

function Progress({ value }) {
    return (
        <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 lg:w-24">
            <div
                className="h-full bg-blue-600 transition-[width] duration-300 ease-out"
                style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
            />
        </div>
    );
}

function CreditoCard({ cr, assignmentsByCollector, onView }) {
    const amountLabel = formatCurrency(cr.amount);
    const installments = Number(cr.totalInstallments || 0);
    const rawPaid = Number(cr.paidInstallments || 0);
    const paid = String(cr.status || "").toUpperCase() === "PAID" && installments > 0 ? installments : rawPaid;
    const progress = installments > 0 ? (paid / installments) * 100 : 0;
    const nextInstallmentDate = formatNextVisitDate(cr, assignmentsByCollector);
    const nextInstallmentLabel = formatNextInstallmentLabel(cr);
    const creditType = CREDIT_TYPE_LABELS[String(cr.type || "").toUpperCase()] || "-";
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                    <div className="text-sm font-semibold">Proximo cobro (ruta): {nextInstallmentDate}</div>
                    <div className="text-xs text-gray-400">{nextInstallmentLabel}</div>
                </div>
                <EstadoPill estado={cr.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Tipo</div>
                <div>{creditType}</div>
                <div className="text-gray-500">Monto</div>
                <div>${amountLabel}</div>
                <div className="text-gray-500">Cuotas</div>
                <div>{installments}</div>
                <div className="text-gray-500">Pagadas</div>
                <div className="flex items-center gap-2">
                    {paid}/{installments}
                    <Progress value={progress} />
                </div>
            </div>

            <div className="mt-3">
                <button
                    onClick={onView}
                    className="w-full rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
                >
                    Ver crédito
                </button>
            </div>
        </div>
    );
}

function CardEmpty() {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Sin créditos para este cliente.
        </div>
    );
}

function formatNextVisitDate(credit, assignmentsByCollector = {}) {
    const collectorId = credit?.userId;
    const assignment = collectorId ? assignmentsByCollector?.[collectorId] : null;
    const nextVisitDate = assignment?.nextVisitDate ? new Date(assignment.nextVisitDate) : null;
    if (!nextVisitDate || Number.isNaN(nextVisitDate.getTime())) return "-";
    return nextVisitDate.toLocaleDateString("es-AR");
}

function formatNextInstallmentLabel(credit) {
    const nextInstallment = Number(credit?.nextInstallmentToCharge || 0);
    const totalInstallments = Number(credit?.totalInstallments || 0);
    if (nextInstallment <= 0) return "Sin próxima cuota";
    if (totalInstallments > 0) return `Cuota ${nextInstallment} de ${totalInstallments}`;
    return `Cuota ${nextInstallment}`;
}


