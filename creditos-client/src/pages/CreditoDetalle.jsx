
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

const computeScheduledDueDate = (baseDate, totalInstallments, type) => {
    if (!baseDate || !totalInstallments || Number(totalInstallments) <= 0) return null;

    const due = new Date(baseDate);
    if (Number.isNaN(due.getTime())) return null;

    const total = Math.max(0, Number(totalInstallments) || 0);
    switch (type) {
        case "ONE_TIME":
            break;
        case "DAILY":
            due.setDate(due.getDate() + total);
            break;
        case "WEEKLY":
            due.setDate(due.getDate() + total * 7);
            break;
        case "QUINCENAL":
            due.setDate(due.getDate() + total * 15);
            break;
        case "MONTHLY":
        default:
            due.setMonth(due.getMonth() + total);
            break;
    }

    return due;
};

const resolveDisplayDueDate = (credit) => {
    const scheduledDueDate = computeScheduledDueDate(
        credit?.firstPaymentDate ?? credit?.startDate,
        credit?.totalInstallments,
        credit?.type
    );

    if (!credit?.dueDate) return scheduledDueDate;

    const storedDueDate = new Date(credit.dueDate);
    if (Number.isNaN(storedDueDate.getTime())) return scheduledDueDate;

    if (!scheduledDueDate) return storedDueDate;

    return storedDueDate.getTime() < scheduledDueDate.getTime()
        ? storedDueDate
        : scheduledDueDate;
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
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "120px", borderRadius: "16px" }} />)}
            </div>
        );
    }
    const handleGoBack = () => {
        navigate("/creditos");
    };

    if (error || !credito) {
        return (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <p style={{ color: "var(--ios-red)", fontSize: "16px", marginBottom: "16px" }}>{error || "Crédito no encontrado."}</p>
                <button onClick={handleGoBack} style={{ padding: "11px 22px", borderRadius: "12px", background: "var(--ios-fill)", border: "none", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>Volver</button>
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

    const receivedAmount = Number(credito.receivedAmount) || 0;
    const totalPagadoFromPayments = pagosCredito.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const totalPagado = Math.max(totalPagadoFromPayments, receivedAmount);
    const baseAmount = Math.max(Number(credito.amount) || 0, 0);
    const installmentAmount = Number(credito.installmentAmount) || 0;
    const cuotasTotales = Number(credito.totalInstallments) || 0;
    const cuotasPagadas = Number(credito.paidInstallments) || 0;
    let saldoObjetivo = cuotasTotales && installmentAmount
        ? cuotasTotales * installmentAmount
        : baseAmount;
    let saldoPendiente = Math.max(saldoObjetivo - totalPagado, 0);
    const cuotasRestantes = cuotasTotales ? Math.max(cuotasTotales - cuotasPagadas, 0) : null;
    const isSinglePayment = credito.type === "ONE_TIME";
    const primaryDateLabel = isSinglePayment ? "Fecha de pago" : "Fecha de otorgamiento";
    const startDateLabel = credito.startDate ? new Date(credito.startDate).toLocaleDateString("es-AR") : "—";
    const firstPaymentDateLabel = credito.firstPaymentDate
        ? new Date(credito.firstPaymentDate).toLocaleDateString("es-AR")
        : startDateLabel;
    const resolvedDueDate = resolveDisplayDueDate(credito);
    const dueDateLabel = resolvedDueDate ? resolvedDueDate.toLocaleDateString("es-AR") : "—";
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
        const firstPaymentDate = credito.firstPaymentDate ?? credito.startDate;
        if (!firstPaymentDate) return credito.dueDate ? new Date(credito.dueDate) : null;

        const baseDate = new Date(firstPaymentDate);
        if (Number.isNaN(baseDate.getTime())) return credito.dueDate ? new Date(credito.dueDate) : null;

        const nextIndex = Math.max(rawNextInstallment, 1) - 1;
        const hasRegisteredPayments = Array.isArray(pagosCredito) && pagosCredito.length > 0;
        const hasManualAdvance = !hasRegisteredPayments && (Number(credito.receivedAmount || 0) > 0 || Number(credito.paidInstallments || 0) > 0);
        const date = new Date(hasManualAdvance ? new Date() : baseDate);
        if (hasManualAdvance) {
            date.setHours(0, 0, 0, 0);
        }

        switch (credito.type) {
            case "DAILY":
                date.setDate(date.getDate() + (hasManualAdvance ? 1 : nextIndex));
                break;
            case "WEEKLY":
                date.setDate(date.getDate() + (hasManualAdvance ? 7 : nextIndex * 7));
                break;
            case "QUINCENAL":
                date.setDate(date.getDate() + (hasManualAdvance ? 15 : nextIndex * 15));
                break;
            case "MONTHLY":
                date.setMonth(date.getMonth() + (hasManualAdvance ? 1 : nextIndex));
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
            summaryRows.push(["Grupo especial", specialCreditName]);
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

        summaryRows.push([primaryDateLabel, formatDate(credito.startDate)]);

        if (!isSinglePayment) {
            summaryRows.push(["Primer pago", formatDate(credito.firstPaymentDate ?? credito.startDate)]);
        }

        if (resolvedDueDate) {
            summaryRows.push(["Cobro final", formatDate(resolvedDueDate)]);
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
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">
            {/* HEADER iOS */}
            <div className="ios-card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Banner */}
                <div style={{ background: "linear-gradient(135deg, #007AFF 0%, #32ADE6 100%)", padding: "22px 20px 34px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "14px" }}>
                        <div style={{ minWidth: 0 }}>
                            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
                                {cliente?.name || "Cliente desconocido"}
                            </h1>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                                <IosEstadoPill estado={credito.status} />
                                {clientReliabilityLabel && (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "99px", background: "rgba(255,255,255,0.18)", color: "#fff", fontSize: "12px", fontWeight: 700 }}>
                                        {clientReliabilityLabel}
                                    </span>
                                )}
                                {hasSpecialCredit && (
                                    <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "99px", background: "rgba(255,255,255,0.18)", color: "#fff", fontSize: "12px", fontWeight: 700 }}>
                                        {specialCreditName}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleDownloadPdf}
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                        >
                            <HiOutlinePrinter style={{ width: "15px", height: "15px" }} /> PDF
                        </button>
                    </div>
                </div>

                {/* Info rows */}
                <div style={{ marginTop: "-16px", background: "var(--ios-bg-card)", borderRadius: "16px 16px 0 0", paddingTop: "4px" }}>
                    <IosInfoRow label="Cobrador" value={cobrador?.name || "Sin asignar"} />
                    {hasCommission && <IosInfoRow label="Comisión" value={commissionDisplay} />}
                    <IosInfoRow label={primaryDateLabel} value={startDateLabel} />
                    {!isSinglePayment && <IosInfoRow label="Primer pago" value={firstPaymentDateLabel} />}
                    <IosInfoRow label="Cobro final" value={dueDateLabel} />
                    {hasSpecialCredit && specialCredit?.id && (
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ios-sep-opaque)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "14px", color: "var(--ios-label-sec)", fontWeight: 500 }}>Grupo especial</span>
                            <button
                                onClick={() => navigate(`/grupos-especiales/${specialCredit.id}/editar`)}
                                style={{ padding: "5px 12px", borderRadius: "8px", background: "#EBF3FF", border: "none", color: "#007AFF", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                            >
                                {specialCreditName} ›
                            </button>
                        </div>
                    )}
                </div>
            </div>


            {/* KPIs iOS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
                <IosKpiCard label="Monto total" value={totalCreditAmountLabel} color="#007AFF" bg="#EBF3FF" />
                <IosKpiCard label="Cuotas" value={`${credito.paidInstallments}/${credito.totalInstallments || "—"}`} color="#FF9500" bg="#FFF3E0" />
                <IosKpiCard label="Monto recibido" value={currencyFormatter.format(receivedAmount)} color="#34C759" bg="#E8F8ED" />
                <IosKpiCard label="Próxima cuota" value={nextInstallmentLabel !== "—" ? `${nextInstallmentLabel}` : nextInstallmentDateLabel || "—"} color="#FF9500" bg="#FFF3E0" />
                <IosKpiCard label="Total gastos" value={currencyFormatter.format(totalExpenses)} color="#FF3B30" bg="#FFEBEA" />
                <IosKpiCard label="Neto post gastos" value={currencyFormatter.format(netAfterExpenses)} color="#34C759" bg="#E8F8ED" />
                <IosKpiCard label="Tipo de crédito" value={creditTypeLabel} color="#AF52DE" bg="#F5EAFF" />
            </div>

            {/* Progress bar */}
            <div className="ios-card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ios-label-sec)" }}>Progreso del crédito</span>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: progreso === 100 ? "#34C759" : "#007AFF" }}>{progreso}%</span>
                </div>
                <div style={{ height: "8px", background: "#E5E5EA", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progreso}%`, background: progreso === 100 ? "#34C759" : "#007AFF", borderRadius: "99px", transition: "width 0.4s ease" }} />
                </div>
                <p style={{ fontSize: "12px", color: "var(--ios-label-ter)", marginTop: "6px" }}>
                    {cuotasPagadas} cuotas pagadas · {cuotasRestantes !== null ? `${cuotasRestantes} restantes` : "Sin cuotas definidas"}
                </p>
            </div>

            <div className="ios-card" style={{ padding: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: 0 }}>Gastos asociados</h2>
                    {hasExpenses && (
                        <span style={{ padding: "5px 12px", borderRadius: "99px", background: "#FFEBEA", color: "#FF3B30", fontSize: "13px", fontWeight: 700 }}>
                            Total: {currencyFormatter.format(totalExpenses)}
                        </span>
                    )}
                </div>

                {hasExpenses ? (
                    <div style={{ background: "var(--ios-bg-card)", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--ios-sep-opaque)" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    {["Gasto", "Monto", "Categoría", "Fecha"].map(h => (
                                        <th key={h} style={{ padding: "10px 14px", background: "var(--ios-fill)", borderBottom: "1px solid var(--ios-sep-opaque)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-sec)", textAlign: "left" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((expense, i) => {
                                    const incurredLabel = expense?.incurredOn ? new Date(expense.incurredOn).toLocaleDateString("es-AR") : "—";
                                    const categoryLabel = expense?.specialCredit?.name || "—";
                                    return (
                                        <tr key={expense.id ?? expense.tempId} style={{ borderBottom: i < expenses.length - 1 ? "1px solid var(--ios-sep-opaque)" : "none" }}>
                                            <td style={{ padding: "11px 14px", fontSize: "14px", color: "var(--ios-label)", fontWeight: 500 }}>{expense.description}</td>
                                            <td style={{ padding: "11px 14px", fontSize: "14px", fontWeight: 700, color: "#FF3B30" }}>{currencyFormatter.format(Number(expense.amount) || 0)}</td>
                                            <td style={{ padding: "11px 14px", fontSize: "13px", color: "var(--ios-label-sec)" }}>{categoryLabel}</td>
                                            <td style={{ padding: "11px 14px", fontSize: "13px", color: "var(--ios-label-ter)" }}>{incurredLabel}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px", padding: "10px 14px", background: "var(--ios-fill)", fontSize: "13px", fontWeight: 600, color: "var(--ios-label-sec)" }}>
                            <span>Total: {currencyFormatter.format(totalExpenses)}</span>
                            <span>Neto: {currencyFormatter.format(netAfterExpenses)}</span>
                        </div>
                    </div>
                ) : (
                    <p style={{ padding: "20px", background: "var(--ios-fill)", borderRadius: "12px", fontSize: "14px", color: "var(--ios-label-ter)", textAlign: "center" }}>
                        Sin gastos registrados para este crédito.
                    </p>
                )}
            </div>

            {/* Historial y chart */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }} className="lg:grid-cols-2-wrapper">
                <div className="ios-card" style={{ padding: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                        <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: 0 }}>Historial de pagos</h2>
                        <span style={{ padding: "4px 10px", borderRadius: "99px", background: "var(--ios-fill)", fontSize: "13px", fontWeight: 700, color: "var(--ios-label-sec)" }}>
                            {pagosOrdenados.length}
                        </span>
                    </div>

                    {pagosOrdenados.length === 0 ? (
                        <p style={{ textAlign: "center", padding: "28px", color: "var(--ios-label-ter)", fontSize: "14px" }}>Sin pagos registrados.</p>
                    ) : (
                        <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--ios-sep-opaque)" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr>
                                        {["Fecha", "Monto", "Nota"].map(h => (
                                            <th key={h} style={{ padding: "10px 14px", background: "var(--ios-fill)", borderBottom: "1px solid var(--ios-sep-opaque)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-sec)", textAlign: "left" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentPayments.map((p, i) => {
                                        const monto = Number.isNaN(Number(p.amount)) ? 0 : Number(p.amount);
                                        const fecha = new Date(p.date).toLocaleDateString("es-AR");
                                        return (
                                            <tr key={p.id} style={{ borderBottom: i < currentPayments.length - 1 ? "1px solid var(--ios-sep-opaque)" : "none" }}>
                                                <td style={{ padding: "11px 14px", fontSize: "14px", color: "var(--ios-label-sec)" }}>{fecha}</td>
                                                <td style={{ padding: "11px 14px", fontSize: "14px", fontWeight: 700, color: "#34C759" }}>${monto.toLocaleString("es-AR")}</td>
                                                <td style={{ padding: "11px 14px", fontSize: "13px", color: "var(--ios-label-ter)" }}>{p.note || "—"}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {showPagination && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px" }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                style={{ padding: "7px 14px", borderRadius: "8px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", fontSize: "13px", fontWeight: 700, color: currentPage === 1 ? "var(--ios-label-ter)" : "var(--ios-blue)", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                            >‹ Anterior</button>
                            <span style={{ fontSize: "13px", color: "var(--ios-label-sec)", fontWeight: 600 }}>Página {currentPage} / {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                style={{ padding: "7px 14px", borderRadius: "8px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", fontSize: "13px", fontWeight: 700, color: currentPage === totalPages ? "var(--ios-label-ter)" : "var(--ios-blue)", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
                            >Siguiente ›</button>
                        </div>
                    )}
                </div>

                <div className="ios-card" style={{ padding: "18px" }}>
                    <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 14px" }}>Pagos por fecha</h2>
                    <div style={{ height: "260px", width: "100%" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
                                <XAxis dataKey="fecha" stroke="#AEAEB2" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#AEAEB2" tick={{ fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E5E5EA", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: "13px" }} />
                                <Line type="monotone" dataKey="monto" stroke="#007AFF" strokeWidth={2.5} dot={{ fill: "#007AFF", r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Acciones */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                    onClick={handleGoBack}
                    style={{ padding: "12px 20px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", fontSize: "15px", fontWeight: 700, color: "var(--ios-label-sec)", cursor: "pointer" }}
                >
                    Volver
                </button>
                <button
                    onClick={() => navigate(`/creditos/${id}/editar`)}
                    style={{ padding: "12px 22px", borderRadius: "12px", border: "none", background: "var(--ios-blue)", fontSize: "15px", fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,122,255,0.3)" }}
                >
                    Editar crédito
                </button>
                {!creditoFinalizado && (
                    <button
                        onClick={() => navigate(`/creditos/${id}/cancelar`)}
                        style={{ padding: "12px 20px", borderRadius: "12px", border: "none", background: "#FFEBEA", fontSize: "15px", fontWeight: 700, color: "#FF3B30", cursor: "pointer" }}
                    >
                        Cancelar crédito
                    </button>
                )}
            </div>
        </div>
    );
}

/* === iOS Subcomponentes === */
const ESTADO_CONFIG = {
    PENDING: { label: "Pendiente", bg: "rgba(255,255,255,0.2)", color: "#fff" },
    PAID:    { label: "Pagado",    bg: "rgba(52,199,89,0.3)",   color: "#fff" },
    OVERDUE: { label: "Vencido",  bg: "rgba(255,59,48,0.3)",   color: "#fff" },
};

function IosEstadoPill({ estado }) {
    const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.PENDING;
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 12px", borderRadius: "99px", background: cfg.bg, color: cfg.color, fontSize: "12px", fontWeight: 700 }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
            {cfg.label}
        </span>
    );
}

function IosInfoRow({ label, value }) {
    if (!value) return null;
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--ios-sep-opaque)" }}>
            <span style={{ fontSize: "14px", color: "var(--ios-label-sec)", fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: "14px", color: "var(--ios-label)", fontWeight: 600 }}>{value}</span>
        </div>
    );
}

function IosKpiCard({ label, value, color = "#007AFF", bg = "#EBF3FF" }) {
    return (
        <div className="ios-card" style={{ padding: "16px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: bg, marginBottom: "10px" }} />
            <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", margin: "0 0 5px" }}>{label}</p>
            <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--ios-label)", margin: 0 }}>{value || "—"}</p>
        </div>
    );
}





