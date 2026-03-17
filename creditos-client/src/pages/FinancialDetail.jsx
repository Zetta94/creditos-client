import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jsPDF";
import autoTable from "jspdf-autotable";
import { fetchDashboardFinancialDetail } from "../services/dashboardService";
import Pagination from "../components/Pagination";

const FINANCIAL_PERIODS = [
    { key: "week", label: "Semana", description: "Semanal" },
    { key: "month", label: "Mes", description: "Mensual" },
    { key: "year", label: "Año", description: "Anual" }
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
    const label = new Date(2000, index, 1).toLocaleDateString("es-AR", { month: "long" });
    return {
        value: index + 1,
        label: label.charAt(0).toUpperCase() + label.slice(1)
    };
});

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = (() => {
    const options = Array.from({ length: 5 }, (_, index) => CURRENT_YEAR - index);
    if (!options.includes(2025)) options.push(2025);
    return options.sort((a, b) => b - a);
})();

const toLocalDateIso = (date) => {
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().split("T")[0];
};

const getMonthLabel = (month) => {
    const option = MONTH_OPTIONS.find((item) => item.value === Number(month));
    return option ? option.label : `Mes ${month}`;
};

const formatDateLocale = (value, options = {}) => {
    if (!value) return "";
    const source = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00`
        : value;
    const date = new Date(source);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("es-AR", options);
};

const formatDateTimeLocale = (value) => {
    if (!value) return "";
    const source = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00`
        : value;
    const date = new Date(source);
    if (Number.isNaN(date.getTime())) return "";
    const datePart = date.toLocaleDateString("es-AR");
    const timePart = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    return `${datePart} ${timePart}`;
};

export default function FinancialDetail() {
    const navigate = useNavigate();
    const [detailPeriod, setDetailPeriod] = useState("month");
    const [detailWeekDate, setDetailWeekDate] = useState(() => toLocalDateIso(new Date()));
    const [detailMonth, setDetailMonth] = useState(new Date().getMonth() + 1);
    const [detailYear, setDetailYear] = useState(new Date().getFullYear());
    const [detailData, setDetailData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);
    const [paymentsPage, setPaymentsPage] = useState(1);
    const [paymentsPageSize, setPaymentsPageSize] = useState(20);

    const buildDetailParams = useCallback(() => {
        const params = { period: detailPeriod };
        if (detailPeriod === "week") {
            params.reference = detailWeekDate;
        } else if (detailPeriod === "month") {
            params.year = detailYear;
            params.month = detailMonth;
        } else {
            params.year = detailYear;
        }
        return params;
    }, [detailPeriod, detailWeekDate, detailMonth, detailYear]);

    const loadDetail = useCallback(async () => {
        const params = buildDetailParams();
        setDetailLoading(true);
        setDetailError(null);
        try {
            const response = await fetchDashboardFinancialDetail(params);
            const payload = response?.data ?? null;
            if (!payload) {
                setDetailData(null);
                setDetailError("No hay datos disponibles para este período.");
                return;
            }
            setDetailData(payload);
        } catch (err) {
            setDetailData(null);
            setDetailError(detailPeriod === "week" ? "No se pudo cargar el resumen semanal." : "No se pudo cargar el resumen detallado.");
        } finally {
            setDetailLoading(false);
        }
    }, [buildDetailParams, detailPeriod]);

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    useEffect(() => {
        setPaymentsPage(1);
    }, [detailPeriod, detailWeekDate, detailMonth, detailYear, detailData]);

    const detailSelectionLabel = useMemo(() => {
        if (detailPeriod === "week") {
            const formatted = formatDateLocale(detailWeekDate);
            return formatted ? `Semana del ${formatted}` : "Semana seleccionada";
        }
        if (detailPeriod === "month") {
            return `${getMonthLabel(detailMonth)} ${detailYear}`;
        }
        return `Año ${detailYear}`;
    }, [detailPeriod, detailWeekDate, detailMonth, detailYear]);

    const detailRangeLabel = useMemo(() => {
        if (!detailData?.range) return null;
        const start = formatDateLocale(detailData.range.start);
        const end = formatDateLocale(detailData.range.end);
        if (!start || !end) return null;
        return `${start} - ${end}`;
    }, [detailData]);

    const canDownloadDetailPdf = detailPeriod !== "week" && !!detailData && !detailLoading;

    const detailTotals = detailData?.totals ?? null;
    const detailNetProfit = detailTotals?.netProfit ?? 0;
    const detailNetProfitClass = detailNetProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
    const detailOperationalExpenses = detailTotals?.operationalExpenses ?? 0;
    const detailPayments = detailData?.payments ?? [];
    const paymentsTotalItems = detailPayments.length;
    const paymentsTotalPages = Math.max(1, Math.ceil(paymentsTotalItems / paymentsPageSize));
    const safePaymentsPage = Math.min(paymentsPage, paymentsTotalPages);
    const paymentStartIndex = (safePaymentsPage - 1) * paymentsPageSize;
    const paginatedPayments = detailPayments.slice(paymentStartIndex, paymentStartIndex + paymentsPageSize);

    const currencyFormatter = useMemo(() => new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }), []);

    const toCurrency = useCallback((value) => currencyFormatter.format(value ?? 0), [currencyFormatter]);

    const handleDownloadDetailPdf = () => {
        if (!detailData || detailPeriod === "week") return;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(16);
        doc.text(`Detalle financiero - ${detailSelectionLabel}`, pageWidth / 2, 18, { align: "center" });

        const rangeText = detailRangeLabel || detailSelectionLabel;
        if (rangeText) {
            doc.setFontSize(11);
            doc.text(rangeText, 14, 30);
        }

        const totals = detailData.totals ?? {};
        autoTable(doc, {
            startY: 38,
            head: [["Ingresos", "Gastos", "Pago empleados", "Gastos operativos", "Ganancia neta"]],
            body: [[
                toCurrency(totals.income ?? 0),
                toCurrency(totals.totalExpenses ?? 0),
                toCurrency(totals.payroll ?? 0),
                toCurrency(totals.operationalExpenses ?? 0),
                toCurrency(totals.netProfit ?? 0)
            ]]
        });

        let nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 48;

        if (detailData.breakdown?.entries?.length) {
            const breakdownTitle = detailData.breakdown.type === "month"
                ? "Mes"
                : detailData.breakdown.type === "week"
                    ? "Semana"
                    : "Segmento";
            autoTable(doc, {
                startY: nextY,
                head: [[breakdownTitle, "Ingresos", "Gastos"]],
                body: detailData.breakdown.entries.map((entry) => [
                    entry.label,
                    toCurrency(entry.income ?? 0),
                    toCurrency(entry.expenses ?? 0)
                ])
            });
            nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : nextY + 8;
        }

        if (detailData.collectors?.length) {
            autoTable(doc, {
                startY: nextY,
                head: [["Cobrador", "Total recaudado", "Clientes cobrados", "Clientes pendientes", "Estado"]],
                body: detailData.collectors.map((collector) => [
                    collector.name ?? "-",
                    toCurrency(collector.totalCollected ?? 0),
                    String(collector.clientsPaid?.length ?? 0),
                    String(collector.clientsPending?.length ?? 0),
                    collector.completed ? "Completado" : "En progreso"
                ])
            });
            nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : nextY + 8;
        }

        if (detailData.payments?.length) {
            autoTable(doc, {
                startY: nextY,
                head: [["Fecha", "Cliente", "Cobrador", "Monto", "Método"]],
                body: detailData.payments.slice(0, 20).map((payment) => [
                    formatDateTimeLocale(payment.date),
                    payment.client?.name ?? "-",
                    payment.collector?.name ?? "-",
                    toCurrency(payment.amount ?? 0),
                    payment.methodSummary ?? "-"
                ])
            });
            nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : nextY + 8;
        }

        if (detailData.expenses?.length) {
            autoTable(doc, {
                startY: nextY,
                head: [["Fecha", "Descripción", "Categoría", "Monto"]],
                body: detailData.expenses.slice(0, 20).map((expense) => [
                    formatDateLocale(expense.incurredOn),
                    expense.description ?? "-",
                    expense.category ?? "-",
                    toCurrency(expense.amount ?? 0)
                ])
            });
        }

        const suffix = detailPeriod === "month"
            ? `${detailYear}-${String(detailMonth).padStart(2, "0")}`
            : `${detailYear}`;
        doc.save(`detalle-financiero-${suffix}.pdf`);
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold sm:text-2xl">Detalle financiero</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {detailRangeLabel || detailSelectionLabel}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        Volver al dashboard
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadDetailPdf}
                        disabled={!canDownloadDetailPdf}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Descargar PDF
                    </button>
                </div>
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-wrap gap-2">
                    {FINANCIAL_PERIODS.map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setDetailPeriod(key)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${detailPeriod === key
                                ? "border-blue-500 bg-blue-500/10 text-blue-700 shadow-sm dark:border-blue-400 dark:bg-blue-400/10 dark:text-blue-200"
                                : "border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:text-blue-200"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {detailPeriod === "week" && (
                        <label className="flex flex-col text-sm">
                            <span className="mb-1 text-gray-600 dark:text-gray-300">Seleccionar día de la semana</span>
                            <input
                                type="date"
                                value={detailWeekDate}
                                onChange={(event) => setDetailWeekDate(event.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                            />
                        </label>
                    )}
                    {detailPeriod === "month" && (
                        <>
                            <label className="flex flex-col text-sm">
                                <span className="mb-1 text-gray-600 dark:text-gray-300">Mes</span>
                                <select
                                    value={detailMonth}
                                    onChange={(event) => setDetailMonth(Number(event.target.value))}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                >
                                    {MONTH_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col text-sm">
                                <span className="mb-1 text-gray-600 dark:text-gray-300">Año</span>
                                <select
                                    value={detailYear}
                                    onChange={(event) => setDetailYear(Number(event.target.value))}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                >
                                    {YEAR_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </>
                    )}
                    {detailPeriod === "year" && (
                        <label className="flex flex-col text-sm">
                            <span className="mb-1 text-gray-600 dark:text-gray-300">Año</span>
                            <select
                                value={detailYear}
                                onChange={(event) => setDetailYear(Number(event.target.value))}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                            >
                                {YEAR_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>

                {detailLoading ? (
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Cargando detalle...</p>
                ) : detailError ? (
                    <p className="mt-4 text-sm text-red-500 dark:text-red-400">{detailError}</p>
                ) : !detailData ? (
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No hay información para esta selección.</p>
                ) : (
                    <div className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Ingresos totales</p>
                                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {toCurrency(detailTotals?.income ?? 0)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Gastos</p>
                                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {toCurrency(detailTotals?.totalExpenses ?? 0)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Pago a empleados</p>
                                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {toCurrency(detailTotals?.payroll ?? 0)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Gastos operativos</p>
                                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {toCurrency(detailOperationalExpenses)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Ganancia neta</p>
                                <p className={`mt-2 text-2xl font-semibold ${detailNetProfitClass}`}>
                                    {toCurrency(detailNetProfit)}
                                </p>
                            </div>
                        </div>

                        {detailData.breakdown?.entries?.length ? (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Desglose por {detailData.breakdown.type === "month" ? "mes" : detailData.breakdown.type === "week" ? "semana" : "segmento"}</h2>
                                <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Periodo</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Ingresos</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Gastos</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white text-sm dark:divide-gray-800 dark:bg-gray-900 dark:text-gray-100">
                                            {detailData.breakdown.entries.map((entry) => (
                                                <tr key={entry.label}>
                                                    <td className="px-4 py-2">{entry.label}</td>
                                                    <td className="px-4 py-2">{toCurrency(entry.income ?? 0)}</td>
                                                    <td className="px-4 py-2">{toCurrency(entry.expenses ?? 0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}

                        {detailData.collectors?.length ? (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Desempeño de cobradores</h2>
                                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {detailData.collectors.map((collector) => (
                                        <div key={collector.id ?? collector.name} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{collector.name ?? "Sin nombre"}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total recaudado: {toCurrency(collector.totalCollected ?? 0)}</p>
                                                </div>
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${collector.completed
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                                    }`}
                                                >
                                                    {collector.completed ? "Completado" : "En progreso"}
                                                </span>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300">
                                                <p>Pagos registrados: {collector.payments?.length ?? 0}</p>
                                                <p>Clientes cobrados: {collector.clientsPaid?.length ?? 0}</p>
                                                <p>Clientes pendientes: {collector.clientsPending?.length ?? 0}</p>
                                            </div>
                                            {collector.clientsPaid?.length ? (
                                                <div className="mt-3 text-xs">
                                                    <p className="font-semibold text-gray-700 dark:text-gray-200">Clientes al día</p>
                                                    <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-300">
                                                        {collector.clientsPaid.slice(0, 4).map((client) => (
                                                            <li key={client.id ?? client.name}>
                                                                {client.name ?? "Sin nombre"} · {toCurrency(client.totalPaid ?? 0)}
                                                            </li>
                                                        ))}
                                                        {collector.clientsPaid.length > 4 ? (
                                                            <li className="text-gray-500 dark:text-gray-400">+{collector.clientsPaid.length - 4} más</li>
                                                        ) : null}
                                                    </ul>
                                                </div>
                                            ) : null}
                                            {collector.clientsPending?.length ? (
                                                <div className="mt-3 text-xs">
                                                    <p className="font-semibold text-gray-700 dark:text-gray-200">Clientes pendientes</p>
                                                    <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-300">
                                                        {collector.clientsPending.slice(0, 4).map((client) => (
                                                            <li key={client.id ?? client.name}>
                                                                {client.name ?? "Sin nombre"}
                                                                {client.nextVisitDate ? ` · Visita ${formatDateLocale(client.nextVisitDate)}` : ""}
                                                            </li>
                                                        ))}
                                                        {collector.clientsPending.length > 4 ? (
                                                            <li className="text-gray-500 dark:text-gray-400">+{collector.clientsPending.length - 4} más</li>
                                                        ) : null}
                                                    </ul>
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {detailData.payments?.length ? (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Pagos registrados</h2>
                                <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Fecha</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Cliente</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Cobrador</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Monto</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Método</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white text-sm dark:divide-gray-800 dark:bg-gray-900 dark:text-gray-100">
                                            {paginatedPayments.map((payment) => (
                                                <tr key={payment.id}>
                                                    <td className="px-4 py-2">{formatDateTimeLocale(payment.date)}</td>
                                                    <td className="px-4 py-2">{payment.client?.name ?? "-"}</td>
                                                    <td className="px-4 py-2">{payment.collector?.name ?? "-"}</td>
                                                    <td className="px-4 py-2">{toCurrency(payment.amount ?? 0)}</td>
                                                    <td className="px-4 py-2 capitalize">{payment.methodSummary ?? "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-3">
                                    <Pagination
                                        page={safePaymentsPage}
                                        pageSize={paymentsPageSize}
                                        totalItems={paymentsTotalItems}
                                        totalPages={paymentsTotalPages}
                                        onPageChange={setPaymentsPage}
                                        onPageSizeChange={(size) => {
                                            setPaymentsPageSize(size);
                                            setPaymentsPage(1);
                                        }}
                                        pageSizeOptions={[10, 20, 50, 100]}
                                    />
                                </div>
                            </div>
                        ) : null}

                        {detailData.expenses?.length ? (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Gastos registrados</h2>
                                <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Fecha</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Descripción</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Categoría</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white text-sm dark:divide-gray-800 dark:bg-gray-900 dark:text-gray-100">
                                            {detailData.expenses.map((expense) => (
                                                <tr key={expense.id}>
                                                    <td className="px-4 py-2">{formatDateLocale(expense.incurredOn)}</td>
                                                    <td className="px-4 py-2">{expense.description ?? "-"}</td>
                                                    <td className="px-4 py-2">{expense.category ?? "-"}</td>
                                                    <td className="px-4 py-2">{toCurrency(expense.amount ?? 0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </section>
        </div>
    );
}
