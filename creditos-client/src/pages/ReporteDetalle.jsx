import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HiOutlineArrowLeft, HiOutlinePrinter } from "react-icons/hi2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchReport } from "../services/reportsService";

const currency = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
});

const COMPANY_NAME = "El Imperio Créditos";

export default function ReporteDetalle() {
    const { reportId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);
        fetchReport(reportId)
            .then((response) => {
                if (!mounted) return;
                setData(response.data);
            })
            .catch((err) => {
                if (!mounted) return;
                const message = err?.response?.data?.error || "No se pudo cargar el reporte.";
                setError(message);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, [reportId]);

    const payments = data?.payments ?? [];
    const breakdown = useMemo(() => {
        if (!data) {
            return { efectivo: 0, mercadopago: 0, transferencia: 0, total: 0 };
        }
        return data.breakdown ?? {
            efectivo: data.efectivo ?? 0,
            mercadopago: data.mercadopago ?? 0,
            transferencia: data.transferencia ?? 0,
            total: data.total ?? 0
        };
    }, [data]);

    const clientsCobranza = useMemo(() => {
        if (!payments.length) return [];
        const map = new Map();
        payments.forEach((payment) => {
            const key = payment.credit?.client?.id;
            if (!key) return;
            if (!map.has(key)) {
                map.set(key, {
                    id: key,
                    name: payment.credit.client.name,
                    document: payment.credit.client.document
                });
            }
        });
        return Array.from(map.values());
    }, [payments]);

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate("/usuarios");
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-6">
                <p className="text-center text-gray-500 dark:text-gray-400">Cargando reporte...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
                <p className="text-center text-red-500 dark:text-red-400 font-semibold">{error}</p>
                <div className="flex justify-center">
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    >
                        <HiOutlineArrowLeft className="h-4 w-4" />
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-6">
                <p className="text-center text-gray-500 dark:text-gray-400">Reporte no encontrado.</p>
            </div>
        );
    }

    const fecha = data.fechaDeReporte ? dateFormatter.format(new Date(data.fechaDeReporte)) : "Fecha desconocida";
    const userName = data.user?.name ?? "-";
    const userEmail = data.user?.email ?? "-";
    const finalized = data.finalized;
    const finalizedAt = data.finalizedAt ? dateTimeFormatter.format(new Date(data.finalizedAt)) : null;
    const clientesVisitados = data.clientsVisited ?? data.clientsPaid ?? clientsCobranza.length;
    const pagosRegistrados = data.paymentsCount ?? payments.length;
    const totalCobrado = data.total ?? breakdown.total;

    const handleDownloadPdf = () => {
        if (!data) return;

        const doc = new jsPDF();
        const leftMargin = 14;
        let cursorY = 16;

        doc.setFontSize(18);
        doc.text(COMPANY_NAME, leftMargin, cursorY);
        cursorY += 8;

        doc.setFontSize(14);
        doc.text(`Reporte de cobranzas`, leftMargin, cursorY);
        cursorY += 7;
        doc.setFontSize(12);
        doc.text(`Fecha del reporte: ${fecha}`, leftMargin, cursorY);
        cursorY += 6;
        doc.text(`Cobrador: ${userName}`, leftMargin, cursorY);
        cursorY += 6;
        doc.text(`Email: ${userEmail}`, leftMargin, cursorY);
        cursorY += 6;
        doc.text(`Estado: ${finalized ? "Finalizado" : "En progreso"}`, leftMargin, cursorY);
        if (finalizedAt) {
            cursorY += 6;
            doc.text(`Finalizado el: ${finalizedAt}`, leftMargin, cursorY);
        }
        cursorY += 8;

        autoTable(doc, {
            startY: cursorY,
            head: [["Resumen", "Valor"]],
            body: [
                ["Total cobrado", currency.format(totalCobrado)],
                ["Clientes visitados", String(clientesVisitados)],
                ["Pagos registrados", String(pagosRegistrados)]
            ],
            styles: { fontSize: 11 },
            headStyles: { fillColor: [59, 130, 246] }
        });

        cursorY = (doc.lastAutoTable?.finalY || cursorY) + 8;

        autoTable(doc, {
            startY: cursorY,
            head: [["Método", "Monto"]],
            body: [
                ["Efectivo", currency.format(breakdown.efectivo)],
                ["Mercado Pago", currency.format(breakdown.mercadopago)],
                ["Transferencia", currency.format(breakdown.transferencia)],
                ["Total", currency.format(breakdown.total)]
            ],
            styles: { fontSize: 11 },
            headStyles: { fillColor: [16, 185, 129] }
        });

        cursorY = (doc.lastAutoTable?.finalY || cursorY) + 8;

        if (clientsCobranza.length > 0) {
            autoTable(doc, {
                startY: cursorY,
                head: [["Clientes visitados", "Documento"]],
                body: clientsCobranza.map((client) => [
                    client.name,
                    client.document || "-"
                ]),
                styles: { fontSize: 10 },
                headStyles: { fillColor: [107, 114, 128] }
            });
            cursorY = (doc.lastAutoTable?.finalY || cursorY) + 8;
        }

        if (payments.length > 0) {
            autoTable(doc, {
                startY: cursorY,
                head: [["Fecha", "Cliente", "Monto", "Resumen"]],
                body: payments.map((payment) => [
                    payment.date ? dateTimeFormatter.format(new Date(payment.date)) : "-",
                    payment.credit?.client?.name ?? "-",
                    currency.format(payment.amount ?? 0),
                    payment.methodSummary || "-"
                ]),
                styles: { fontSize: 9 },
                headStyles: { fillColor: [37, 99, 235] },
                columnStyles: {
                    3: { cellWidth: 70 }
                }
            });
        }

        doc.save(`reporte-${reportId}.pdf`);
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Detalle del reporte</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Generado el {fecha}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Cobrador: {userName} ({userEmail})</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadPdf}
                        className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    >
                        <HiOutlinePrinter className="h-4 w-4" />
                        Descargar PDF
                    </button>
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    >
                        <HiOutlineArrowLeft className="h-4 w-4" />
                        Volver
                    </button>
                </div>
            </div>

            {/* Resumen */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard label="Total cobrado" value={currency.format(data.total ?? breakdown.total)} variant="primary" />
                <SummaryCard label="Clientes visitados" value={data.clientsVisited ?? data.clientsPaid ?? clientsCobranza.length} />
                <SummaryCard label="Pagos registrados" value={data.paymentsCount ?? payments.length} />
                <SummaryCard label="Estado" value={finalized ? "Finalizado" : "En progreso"} variant={finalized ? "success" : "warning"} detail={finalizedAt ? `Finalizado el ${finalizedAt}` : undefined} />
            </section>

            {/* Detalle de montos */}
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Desglose por método</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard label="Efectivo" value={currency.format(breakdown.efectivo)} />
                    <SummaryCard label="MercadoPago" value={currency.format(breakdown.mercadopago)} />
                    <SummaryCard label="Transferencia" value={currency.format(breakdown.transferencia)} />
                    <SummaryCard label="Total" value={currency.format(breakdown.total)} />
                </div>
            </section>

            {/* Clientes cobrados */}
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Clientes cobrados</h2>
                {clientsCobranza.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No se registraron pagos para clientes en este día.</p>
                ) : (
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {clientsCobranza.map((client) => (
                            <li key={client.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                                <span className="font-medium">{client.name}</span>
                                {client.document ? <span className="block text-xs text-gray-500 dark:text-gray-400">Documento: {client.document}</span> : null}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Pagos */}
            <section className="rounded-xl border border-gray-200 bg-white p-2 sm:p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-x-auto">
                <h2 className="px-2 text-lg font-semibold text-gray-800 dark:text-gray-200">Pagos registrados</h2>
                <table className="mt-3 min-w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th className="px-3 py-2 sm:px-4 sm:py-3">Fecha</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3">Cliente</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3">Crédito</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3">Monto</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3">Efectivo</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3">MercadoPago</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3">Transferencia</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3">Resumen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No se registraron pagos para este reporte.
                                </td>
                            </tr>
                        ) : (
                            payments.map((payment) => {
                                const date = payment.date ? dateTimeFormatter.format(new Date(payment.date)) : "";
                                const clientName = payment.credit?.client?.name ?? "-";
                                const creditLabel = payment.credit?.id ?? "-";
                                const efectivo = payment.efectivoAmount ?? 0;
                                const mercadopago = payment.mercadopagoAmount ?? 0;
                                const transferencia = payment.transferenciaAmount ?? 0;
                                const usesBreakdown = efectivo + mercadopago + transferencia > 0;
                                const efectivoShown = usesBreakdown ? efectivo : payment.amount ?? 0;

                                return (
                                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-700 dark:text-gray-200">{date}</td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-900 dark:text-gray-100">{clientName}</td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs text-gray-500 dark:text-gray-400">{creditLabel}</td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 font-semibold text-gray-900 dark:text-gray-100">{currency.format(payment.amount ?? 0)}</td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-700 dark:text-gray-200">{currency.format(efectivoShown)}</td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-700 dark:text-gray-200">{currency.format(usesBreakdown ? mercadopago : 0)}</td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-700 dark:text-gray-200">{currency.format(usesBreakdown ? transferencia : 0)}</td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-600 dark:text-gray-300">{payment.methodSummary || "-"}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
}

function SummaryCard({ label, value, variant = "default", detail }) {
    const variantStyles = {
        default: "border-gray-200 dark:border-gray-700",
        primary: "border-blue-200 dark:border-blue-700",
        success: "border-emerald-200 dark:border-emerald-700",
        warning: "border-yellow-200 dark:border-yellow-700"
    };

    const textStyles = {
        default: "text-gray-700 dark:text-gray-200",
        primary: "text-blue-600 dark:text-blue-400",
        success: "text-emerald-600 dark:text-emerald-400",
        warning: "text-yellow-600 dark:text-yellow-400"
    };

    return (
        <div className={`rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-800 ${variantStyles[variant] ?? variantStyles.default}`}>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`mt-1 text-lg font-semibold ${textStyles[variant] ?? textStyles.default}`}>{value}</p>
            {detail ? <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detail}</p> : null}
        </div>
    );
}
