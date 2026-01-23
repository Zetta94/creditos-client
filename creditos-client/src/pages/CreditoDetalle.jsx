
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { HiOutlinePrinter } from "react-icons/hi2";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { fetchCredit } from "../services/creditsService";

const chartLabelFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" });
const currencyFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0
});
const COMPANY_NAME = "El Imperio Créditos";
const CREDIT_TYPE_LABELS = {
    DAILY: "Diario",
    WEEKLY: "Semanal",
    QUINCENAL: "Quincenal",
    MONTHLY: "Mensual",
    ONE_TIME: "Pago único"
};

const CLIENT_RELIABILITY_LABELS = {
    MUYALTA: "Muy alta",
    ALTA: "Alta",
    MEDIA: "Media",
    BAJA: "Baja",
    MOROSO: "Moroso"
};

const CLIENT_RELIABILITY_STYLES = {
    MUYALTA: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700",
    ALTA: "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700",
    MEDIA: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
    BAJA: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700",
    MOROSO: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700"
};

const normalizeToAsciiLower = (value) => {
    if (value === null || value === undefined) return "";
    return value
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
};

const buildDemoSeries = (baseAmount, count = 4) => {
    const now = new Date();
    const reference = baseAmount > 0 ? baseAmount : 10000;
    const series = [];
    for (let i = count; i >= 1; i -= 1) {
        const date = new Date(now);
        date.setMonth(now.getMonth() - i);
        series.push({
            fecha: chartLabelFormatter.format(date),
            monto: Math.round(reference * (0.7 + ((count - i) * 0.1)))
        });
    }
    return series;
};

export default function CreditoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [credito, setCredito] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const pageSize = 5;
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        fetchCredit(id)
            .then(res => {
                setCredito(res.data);
                setError(null);
            })
            .catch(() => {
                setError("No se pudo cargar el crédito");
            })
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        setPage(1);
    }, [id]);

    useEffect(() => {
        const length = credito?.payments?.length || 0;
        const total = Math.max(1, Math.ceil(length / pageSize));
        setPage((prev) => Math.min(prev, total));
    }, [credito?.payments?.length, pageSize]);

    if (loading) {
        return <div className="mx-auto max-w-5xl px-4 py-6 text-gray-500">Cargando crédito...</div>;
    }
    const handleGoBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate("/creditos");
        }
    };

    if (error || !credito) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-6 text-red-400">
                {error || "Crédito no encontrado."}
                <button
                    onClick={handleGoBack}
                    className="ml-4 rounded-md bg-gray-700 px-3 py-2 hover:bg-gray-600 text-white"
                >
                    Volver
                </button>
            </div>
        );
    }

    const cliente = credito.client;
    const cobrador = credito.user;
    const pagosCredito = Array.isArray(credito.payments) ? credito.payments : [];
    const progreso = credito.totalInstallments ? Math.round((credito.paidInstallments / credito.totalInstallments) * 100) : 0;
    const pagosOrdenados = [...pagosCredito].sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalPages = Math.ceil(pagosOrdenados.length / pageSize) || 1;
    const currentPage = Math.min(page, totalPages);
    const sliceStart = (currentPage - 1) * pageSize;
    const currentPayments = pagosOrdenados.slice(sliceStart, sliceStart + pageSize);
    const showPagination = pagosOrdenados.length > pageSize;
    const chartPayments = [...pagosCredito].sort((a, b) => new Date(a.date) - new Date(b.date));
    const chartBase = chartPayments.map((p) => {
        const amountValue = Number(p.amount);
        const monto = Number.isNaN(amountValue) ? 0 : amountValue;
        return {
            fecha: chartLabelFormatter.format(new Date(p.date)),
            monto
        };
    });
    const fallbackBaseAmount = Number(credito.installmentAmount) || (credito.totalInstallments ? Number(credito.amount) / credito.totalInstallments : 0);
    const chartData = chartBase.length === 0
        ? buildDemoSeries(fallbackBaseAmount)
        : chartBase.length === 1
            ? [...buildDemoSeries(fallbackBaseAmount, 3), chartBase[0]]
            : chartBase;

    const cuotasCompletadas = credito.totalInstallments && credito.paidInstallments >= credito.totalInstallments;
    const creditoFinalizado = credito.status === "PAID" || cuotasCompletadas;

    const totalPagado = pagosCredito.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const baseAmount = Math.max(Number(credito.amount) || 0, 0);
    const installmentAmount = Number(credito.installmentAmount) || 0;
    const cuotasTotales = Number(credito.totalInstallments) || 0;
    const cuotasPagadas = Number(credito.paidInstallments) || 0;
    let saldoObjetivo = cuotasTotales && installmentAmount
        ? cuotasTotales * installmentAmount
        : baseAmount;
    let saldoPendiente = Math.max(saldoObjetivo - totalPagado, 0);
    const cuotasRestantes = cuotasTotales ? Math.max(cuotasTotales - cuotasPagadas, 0) : null;
    const startDateLabel = credito.startDate ? new Date(credito.startDate).toLocaleDateString("es-AR") : "—";
    const dueDateLabel = credito.dueDate ? new Date(credito.dueDate).toLocaleDateString("es-AR") : "—";
    const expenses = Array.isArray(credito.expenses) ? credito.expenses : [];
    const specialCredit = credito?.specialCredit || null;
    const specialCreditName = typeof specialCredit?.name === "string" && specialCredit.name.trim().length > 0
        ? specialCredit.name
        : null;
    const hasSpecialCredit = Boolean(specialCreditName);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    const hasExpenses = expenses.length > 0;
    const creditTypeLabel = CREDIT_TYPE_LABELS[credito.type] ?? credito.type ?? "—";
    const receivedAmount = Number(credito.receivedAmount) || 0;
    const rawNextInstallment = Number(credito.nextInstallmentToCharge) || 0;
    const nextInstallmentLabel = rawNextInstallment > 0 ? `Cuota ${rawNextInstallment}` : "—";
    const toNumberOrNull = (value) => {
        if (value === null || value === undefined) return null;
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : null;
    };

    const interestCandidates = [
        credito?.interestPercentage,
        credito?.interestRate,
        credito?.interest,
        credito?.interes,
        credito?.interest_percent,
        credito?.interestPercent,
        credito?.specialCredit?.interestPercentage,
        credito?.specialCredit?.interestRate,
        credito?.specialCredit?.interest
    ];
    const interestPercentageValue = interestCandidates
        .map((candidate) => toNumberOrNull(candidate))
        .find((value) => value !== null);

    const totalFromInterest = interestPercentageValue !== undefined
        ? baseAmount + (baseAmount * interestPercentageValue) / 100
        : null;
    const totalFromInstallments = installmentAmount && cuotasTotales
        ? installmentAmount * cuotasTotales
        : null;

    let totalCreditAmount = totalFromInterest ?? totalFromInstallments ?? baseAmount;
    if (totalCreditAmount < baseAmount) {
        totalCreditAmount = baseAmount;
    }

    const interestAmount = Math.max(totalCreditAmount - baseAmount, 0);
    const derivedInterestPercentage = interestPercentageValue ?? (
        baseAmount > 0 && totalCreditAmount > baseAmount
            ? (interestAmount / baseAmount) * 100
            : null
    );

    const interestPercentageLabel = typeof derivedInterestPercentage === "number"
        ? `${derivedInterestPercentage.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`
        : null;
    const totalCreditAmountLabel = interestPercentageLabel
        ? `${currencyFormatter.format(totalCreditAmount)} (${interestPercentageLabel})`
        : currencyFormatter.format(totalCreditAmount);

    if (!(cuotasTotales && installmentAmount)) {
        saldoObjetivo = totalCreditAmount;
        saldoPendiente = Math.max(totalCreditAmount - totalPagado, 0);
    }

    const netAfterExpenses = Math.max(totalCreditAmount - totalExpenses, 0);
    const expenseTypeSummary = Array.from(
        new Set(
            expenses
                .map((expense) => expense?.specialCredit?.name || expense?.description || null)
                .filter(Boolean)
        )
    );

    const reliabilityCode = typeof cliente?.reliability === "string" ? cliente.reliability.toUpperCase() : null;
    const clientReliabilityLabel = reliabilityCode ? CLIENT_RELIABILITY_LABELS[reliabilityCode] ?? reliabilityCode : null;
    const clientReliabilityClass = reliabilityCode ? CLIENT_RELIABILITY_STYLES[reliabilityCode] ?? CLIENT_RELIABILITY_STYLES.MEDIA : null;

    const calculateNextInstallmentDate = () => {
        if (rawNextInstallment <= 0) return null;
        if (!credito.startDate) return credito.dueDate ? new Date(credito.dueDate) : null;

        const baseDate = new Date(credito.startDate);
        if (Number.isNaN(baseDate.getTime())) return credito.dueDate ? new Date(credito.dueDate) : null;

        const nextIndex = Math.max(rawNextInstallment, 1) - 1;
        const date = new Date(baseDate);

        switch (credito.type) {
            case "DAILY":
                date.setDate(date.getDate() + nextIndex);
                break;
            case "WEEKLY":
                date.setDate(date.getDate() + nextIndex * 7);
                break;
            case "QUINCENAL":
                date.setDate(date.getDate() + nextIndex * 15);
                break;
            case "MONTHLY":
                date.setMonth(date.getMonth() + nextIndex);
                break;
            case "ONE_TIME":
                if (credito.dueDate) {
                    const due = new Date(credito.dueDate);
                    if (!Number.isNaN(due.getTime())) return due;
                }
                break;
            default:
                break;
        }

        if (credito.type !== "ONE_TIME" && credito.dueDate) {
            const due = new Date(credito.dueDate);
            if (!Number.isNaN(due.getTime()) && date > due) {
                return due;
            }
        }

        return date;
    };

    const nextInstallmentDate = calculateNextInstallmentDate();
    const nextInstallmentDateLabel = nextInstallmentDate && !Number.isNaN(nextInstallmentDate.getTime())
        ? nextInstallmentDate.toLocaleDateString("es-AR")
        : credito.dueDate
            ? new Date(credito.dueDate).toLocaleDateString("es-AR")
            : "—";

    const commissionFieldNames = [
        "commissionAmount",
        "commission",
        "commissionValue",
        "commissionFee",
        "commission_fee",
        "comision",
        "comisionMonto",
        "comisionAmount",
        "comisionLibre"
    ];
    const explicitCommissionAmount = commissionFieldNames
        .map((field) => toNumberOrNull(credito?.[field]))
        .find((value) => value !== null && value > 0);

    const commissionExpenses = expenses.filter((expense) => {
        const descriptorSource = `${expense?.description ?? ""} ${expense?.category ?? ""} ${expense?.specialCredit?.name ?? ""} ${expense?.notes ?? ""}`;
        const descriptor = normalizeToAsciiLower(descriptorSource);
        return descriptor.includes("comision") || descriptor.includes("commission");
    });

    const totalCommissionFromExpenses = commissionExpenses.reduce(
        (sum, expense) => sum + (Number(expense.amount) || 0),
        0
    );

    const commissionAmount = explicitCommissionAmount ?? (totalCommissionFromExpenses > 0 ? totalCommissionFromExpenses : null);
    const hasCommission = typeof commissionAmount === "number" && commissionAmount > 0;

    const rawCommissionRecipients = [
        ...commissionExpenses.map((expense) => expense?.specialCredit?.name || expense?.description || null),
        ...commissionExpenses.map((expense) => expense?.notes || null),
        credito?.commissionReceiver,
        credito?.commissionRecipient,
        credito?.commissionReceiverName,
        credito?.commissionAssignedTo,
        credito?.commissionAssignedToName,
        credito?.commissionDestination,
        credito?.commissionDestinationName,
        credito?.comisionDestinatario,
        credito?.comisionCobrador
    ];

    if (credito?.commissionUser) {
        const commissionUser = credito.commissionUser;
        if (typeof commissionUser === "string") {
            rawCommissionRecipients.push(commissionUser);
        } else if (typeof commissionUser === "object" && commissionUser?.name) {
            rawCommissionRecipients.push(commissionUser.name);
        }
    }

    const commissionRecipients = rawCommissionRecipients.reduce((acc, value) => {
        if (!value) return acc;
        if (typeof value === "string") {
            const trimmed = value.trim();
            if (!trimmed) return acc;

            const normalized = normalizeToAsciiLower(trimmed);
            if (normalized.includes("comision cobrador")) {
                const parts = trimmed.split(/[-:]/);
                if (parts.length > 1) {
                    const possibleName = parts.slice(1).join(" ").trim();
                    if (possibleName) {
                        acc.push(possibleName);
                        return acc;
                    }
                }
            }

            acc.push(trimmed);
            return acc;
        }
        if (typeof value === "object") {
            if (value?.name) acc.push(value.name);
            else if (value?.fullName) acc.push(value.fullName);
        }
        return acc;
    }, []);

    const commissionRecipientsUnique = Array.from(new Set(commissionRecipients));

    if (hasCommission && commissionRecipientsUnique.length === 0 && cobrador?.name) {
        commissionRecipientsUnique.push(cobrador.name);
    }

    const commissionRecipientsLabel = commissionRecipientsUnique.join(", ");
    const commissionDisplay = hasCommission
        ? `${currencyFormatter.format(commissionAmount)}${commissionRecipientsLabel ? ` · ${commissionRecipientsLabel}` : ""}`
        : null;

    const handleDownloadPdf = () => {
        if (!credito) return;

        const doc = new jsPDF();
        const leftMargin = 14;
        let cursorY = 16;

        const formatDate = (value) => {
            if (!value) return "-";
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("es-AR");
        };

        const formatCurrency = (value) => {
            const numericValue = Number(value);
            if (!Number.isFinite(numericValue)) return "—";
            return currencyFormatter.format(Math.max(numericValue, 0));
        };

        doc.setFontSize(18);
        doc.text(COMPANY_NAME, leftMargin, cursorY);
        cursorY += 8;

        doc.setFontSize(14);
        doc.text("Resumen de crédito", leftMargin, cursorY);
        cursorY += 7;

        doc.setFontSize(12);
        doc.text(`Cliente: ${cliente?.name || "-"}`, leftMargin, cursorY);
        cursorY += 6;
        if (cliente?.document) {
            doc.text(`Documento: ${cliente.document}`, leftMargin, cursorY);
            cursorY += 6;
        }
        if (cliente?.address) {
            doc.text(`Dirección: ${cliente.address}`, leftMargin, cursorY);
            cursorY += 6;
        }
        doc.text(`Cobrador: ${cobrador?.name || "-"}`, leftMargin, cursorY);
        cursorY += 6;
        doc.text(`Contacto cobrador: ${cobrador?.email || "-"}`, leftMargin, cursorY);
        cursorY += 8;

        const summaryRows = [
            ["Tipo de crédito", creditTypeLabel]
        ];

        if (hasSpecialCredit) {
            summaryRows.push(["Crédito especial", specialCreditName]);
        }

        if (clientReliabilityLabel) {
            summaryRows.push(["Perfil cliente", clientReliabilityLabel]);
        }

        summaryRows.push([
            "Monto base",
            formatCurrency(baseAmount)
        ]);

        summaryRows.push([
            "Monto total del plan",
            formatCurrency(totalCreditAmount)
        ]);

        if (installmentAmount) {
            summaryRows.push(["Cuota estimada", formatCurrency(installmentAmount)]);
        }

        summaryRows.push([
            "Cuotas pagadas",
            `${cuotasPagadas}/${cuotasTotales || "-"}`
        ]);

        if (cuotasRestantes !== null) {
            summaryRows.push(["Cuotas restantes", String(cuotasRestantes)]);
        }

        summaryRows.push(["Saldo pagado", formatCurrency(totalPagado)]);
        summaryRows.push(["Saldo pendiente", formatCurrency(saldoPendiente)]);
        summaryRows.push(["Monto recibido", formatCurrency(receivedAmount)]);

        if (nextInstallmentLabel && nextInstallmentLabel !== "—") {
            summaryRows.push(["Próxima cuota", nextInstallmentLabel]);
        }

        if (nextInstallmentDateLabel && nextInstallmentDateLabel !== "—") {
            summaryRows.push(["Próxima cuota (fecha)", nextInstallmentDateLabel]);
        }

        summaryRows.push(["Total gastos", formatCurrency(totalExpenses)]);
        summaryRows.push(["Neto post gastos", formatCurrency(netAfterExpenses)]);

        summaryRows.push([
            "Comisión",
            hasCommission
                ? `${formatCurrency(commissionAmount)}${commissionRecipientsLabel ? ` · ${commissionRecipientsLabel}` : ""}`
                : "—"
        ]);

        summaryRows.push([
            "Estado",
            credito.status === "PAID"
                ? "Pagado"
                : credito.status === "OVERDUE"
                    ? "Vencido"
                    : "Pendiente"
        ]);

        summaryRows.push(["Inicio", formatDate(credito.startDate)]);

        if (credito.dueDate) {
            summaryRows.push(["Vencimiento", formatDate(credito.dueDate)]);
        }

        summaryRows.push(["Generado", new Date().toLocaleDateString("es-AR")]);

        autoTable(doc, {
            startY: cursorY,
            head: [["Detalle", "Valor"]],
            body: summaryRows,
            styles: { fontSize: 11 },
            headStyles: { fillColor: [59, 130, 246] }
        });

        cursorY = (doc.lastAutoTable?.finalY || cursorY) + 8;

        if (hasExpenses) {
            autoTable(doc, {
                startY: cursorY,
                head: [["Gasto", "Monto", "Categoría"]],
                body: expenses.map((expense) => [
                    expense.description,
                    formatCurrency(expense.amount),
                    expense?.specialCredit?.name || "—"
                ]),
                styles: { fontSize: 10 },
                headStyles: { fillColor: [16, 185, 129] },
                columnStyles: {
                    0: { cellWidth: 80 }
                }
            });

            cursorY = (doc.lastAutoTable?.finalY || cursorY) + 8;
        }

        if (pagosOrdenados.length > 0) {
            autoTable(doc, {
                startY: cursorY,
                head: [["Fecha", "Monto", "Nota"]],
                body: pagosOrdenados.map((payment) => [
                    formatDate(payment.date),
                    currencyFormatter.format(Number(payment.amount) || 0),
                    payment.note || "-"
                ]),
                styles: { fontSize: 10 },
                headStyles: { fillColor: [37, 99, 235] },
                columnStyles: {
                    2: { cellWidth: 80 }
                }
            });
        }

        doc.save(`credito-${id}.pdf`);
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
            {/* === HEADER MODERNO === */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 shadow-sm dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* IZQUIERDA */}
                    <div className="space-y-1.5">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            Crédito de{" "}
                            <span className="text-blue-700 dark:text-blue-400">
                                {cliente?.name || "Cliente desconocido"}
                            </span>
                            {clientReliabilityLabel && (
                                <span className="ml-3 align-middle">
                                    <ReliabilityPill label={clientReliabilityLabel} intentClass={clientReliabilityClass} />
                                </span>
                            )}
                        </h1>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium text-gray-800 dark:text-gray-200">Cobrador:</span>{" "}
                            {cobrador?.name || "Sin asignar"}
                        </p>

                        {hasSpecialCredit && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium text-gray-800 dark:text-gray-200">Crédito especial:</span>{" "}
                                {specialCreditName}
                            </p>
                        )}

                        {hasCommission && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium text-gray-800 dark:text-gray-200">Comisión:</span>{" "}
                                {commissionDisplay}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
                                </svg>
                                Inicio: {startDateLabel}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Vencimiento: {dueDateLabel}
                            </span>
                        </div>
                    </div>

                    {/* DERECHA */}
                    <div className="flex flex-col items-end gap-2">
                        <button
                            onClick={handleDownloadPdf}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        >
                            <HiOutlinePrinter className="h-4 w-4" />
                            Descargar PDF
                        </button>
                        <EstadoPill estado={credito.status} />
                    </div>
                </div>

            </div>


            {/* === KPIs === */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard
                    label="Monto total"
                    value={totalCreditAmountLabel}
                />
                <KpiCard
                    label="Cuotas"
                    value={`${credito.paidInstallments}/${credito.totalInstallments || "-"}`}
                />
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Progreso</p>
                    <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                            className="h-full bg-blue-600"
                            style={{ width: `${progreso}%` }}
                        />
                    </div>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {progreso}% pagado
                    </p>
                </div>
                <KpiCard label="Tipo de crédito" value={creditTypeLabel} />
                {hasSpecialCredit && (
                    <KpiCard label="Crédito especial" value={specialCreditName} />
                )}
                <KpiCard label="Monto recibido" value={currencyFormatter.format(receivedAmount)} />
                <KpiCard
                    label="Próxima cuota"
                    value={
                        nextInstallmentLabel !== "—"
                            ? `${nextInstallmentLabel}${nextInstallmentDateLabel ? ` · ${nextInstallmentDateLabel}` : ""}`
                            : nextInstallmentDateLabel
                    }
                />
                <KpiCard label="Total gastos" value={currencyFormatter.format(totalExpenses)} />
                <KpiCard label="Neto post gastos" value={currencyFormatter.format(netAfterExpenses)} />
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Gastos asociados</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {hasExpenses
                                ? `Registramos ${expenses.length} gasto${expenses.length > 1 ? "s" : ""}${expenseTypeSummary.length ? ` (${expenseTypeSummary.join(", ")})` : ""}.`
                                : "Este crédito no tiene gastos registrados."}
                        </p>
                    </div>
                    {hasExpenses && (
                        <div className="rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Total: {currencyFormatter.format(totalExpenses)}
                        </div>
                    )}
                </div>

                {hasExpenses ? (
                    <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                                <tr>
                                    <th className="px-4 py-2 font-medium">Gasto</th>
                                    <th className="px-4 py-2 font-medium">Monto</th>
                                    <th className="px-4 py-2 font-medium">Categoría</th>
                                    <th className="px-4 py-2 font-medium">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {expenses.map((expense) => {
                                    const incurredLabel = expense?.incurredOn
                                        ? new Date(expense.incurredOn).toLocaleDateString("es-AR")
                                        : "—";
                                    const categoryLabel = expense?.specialCredit?.name || "—";
                                    return (
                                        <tr key={expense.id ?? expense.tempId} className="bg-white dark:bg-gray-900">
                                            <td className="px-4 py-2 text-gray-800 dark:text-gray-100">{expense.description}</td>
                                            <td className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100">
                                                {currencyFormatter.format(Number(expense.amount) || 0)}
                                            </td>
                                            <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{categoryLabel}</td>
                                            <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{incurredLabel}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="flex items-center justify-end gap-6 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                            <span>Total gastos: {currencyFormatter.format(totalExpenses)}</span>
                            <span>Neto post gastos: {currencyFormatter.format(netAfterExpenses)}</span>
                        </div>
                    </div>
                ) : (
                    <p className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                        Agregá gastos desde la pantalla de alta para verlos reflejados aquí.
                    </p>
                )}
            </section>

            {/* === HISTORIAL Y CHART === */}
            <section className="grid gap-4 lg:grid-cols-2">
                {/* === Historial de pagos === */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-3 text-lg font-semibold">Historial de pagos</h2>

                    {/* Mobile: Cards */}
                    <div className="grid gap-2 sm:hidden">
                        {pagosOrdenados.length > 0 ? (
                            currentPayments.map((p) => {
                                const amountValue = Number(p.amount);
                                const monto = Number.isNaN(amountValue) ? 0 : amountValue;
                                const fecha = new Date(p.date).toLocaleDateString("es-AR");
                                return (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                                    >
                                        <span className="text-gray-500">
                                            {fecha}
                                        </span>
                                        <span className="font-medium">
                                            ${monto.toLocaleString("es-AR")}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-500 text-sm">Sin pagos registrados.</p>
                        )}
                    </div>

                    {/* Desktop: Tabla */}
                    <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full text-left text-sm">
                            <thead className="text-gray-500">
                                <tr>
                                    <th className="py-2 pr-3 font-medium">Fecha</th>
                                    <th className="py-2 font-medium">Monto</th>
                                    <th className="py-2 font-medium">Nota</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {pagosOrdenados.length > 0 ? (
                                    currentPayments.map((p) => {
                                        const amountValue = Number(p.amount);
                                        const monto = Number.isNaN(amountValue) ? 0 : amountValue;
                                        const fecha = new Date(p.date).toLocaleDateString("es-AR");
                                        return (
                                            <tr key={p.id}>
                                                <td className="py-2 pr-3">{fecha}</td>
                                                <td className="py-2">
                                                    ${monto.toLocaleString("es-AR")}
                                                </td>
                                                <td className="py-2 text-gray-500">{p.note || "-"}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="py-3 text-center text-gray-500">
                                            Sin pagos registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {showPagination && (
                        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className={`rounded-md px-3 py-1 font-medium border transition ${currentPage === 1
                                    ? "cursor-not-allowed border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500"
                                    : "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"}`}
                            >
                                Anterior
                            </button>
                            <span>
                                Página {currentPage} de {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className={`rounded-md px-3 py-1 font-medium border transition ${currentPage === totalPages
                                    ? "cursor-not-allowed border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500"
                                    : "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"}`}
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>

                {/* === Gráfico === */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-3 text-lg font-semibold">Pagos por fecha</h2>
                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis dataKey="fecha" stroke="#aaa" />
                                <YAxis stroke="#aaa" />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="monto"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* === BOTONES === */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                    onClick={handleGoBack}
                    className="w-full sm:w-auto rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                    Volver
                </button>
                {!creditoFinalizado && (
                    <button
                        onClick={() => navigate(`/creditos/${id}/cancelar`)}
                        className="w-full sm:w-auto rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                        Cancelar crédito
                    </button>
                )}
            </div>
        </div>
    );
}

/* === Subcomponentes UI === */
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
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${estadoClasses(
                estado
            )}`}
        >
            {label}
        </span>
    );
}

function ReliabilityPill({ label, intentClass }) {
    const classes = intentClass || CLIENT_RELIABILITY_STYLES.MEDIA;
    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${classes}`}>
            {label}
        </span>
    );
}

function KpiCard({ label, value }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {value}
            </p>
        </div>
    );
}
