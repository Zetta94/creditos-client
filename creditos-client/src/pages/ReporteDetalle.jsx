import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { HiOutlineArrowLeft, HiOutlinePrinter } from "react-icons/hi2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchReport, finalizeReportById } from "../services/reportsService";

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
    const role = useSelector((state) => state.auth.user?.role);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [finalizing, setFinalizing] = useState(false);
    const [error, setError] = useState(null);

    const loadReport = async (id, mounted = true) => {
        try {
            const response = await fetchReport(id);
            if (mounted) setData(response.data);
        } catch (err) {
            if (mounted) {
                const message = err?.response?.data?.error || "No se pudo cargar el reporte.";
                setError(message);
            }
        } finally {
            if (mounted) setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);
        loadReport(reportId, mounted);
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

    const handleBack = () => navigate(-1);

    const handleFinalize = async () => {
        if (!window.confirm("¿Estás seguro de que deseas finalizar este reporte manualmente? Se recalcularán los totales basados en los pagos de este día.")) return;
        
        try {
            setFinalizing(true);
            await finalizeReportById(reportId);
            await loadReport(reportId);
        } catch (err) {
            alert(err?.response?.data?.error || "Error al finalizar el reporte.");
        } finally {
            setFinalizing(false);
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
        <div className="min-h-screen bg-[#060b1d] text-white" style={{ 
            backgroundImage: "radial-gradient(circle at 50% -20%, #1a2b5a 0%, #060b1d 80%)",
            backgroundAttachment: "fixed"
        }}>
            <div className="mx-auto max-w-[600px] px-4 py-8 pb-32 animate-fade-in">
                
                {/* Header Compacto Estilo iOS */}
                <header className="mb-8 flex items-center justify-between gap-4">
                    <button
                        onClick={handleBack}
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 active:scale-90 transition-transform"
                    >
                        <HiOutlineArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex-1 text-center">
                        <h1 className="text-lg font-bold tracking-tight">Detalle del reporte</h1>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{fecha}</p>
                    </div>
                    <button
                        onClick={handleDownloadPdf}
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 active:scale-90 transition-transform"
                    >
                        <HiOutlinePrinter className="h-5 w-5" />
                    </button>
                </header>

                {/* Tarjeta de identificación del cobrador */}
                <div className="mb-8 rounded-[32px] bg-white/5 border border-white/10 p-5 backdrop-blur-xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-black">
                        {userName[0]}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">{userName}</p>
                        <p className="text-xs text-slate-400">{userEmail}</p>
                    </div>
                </div>

                {/* Resumen Principal */}
                <section className="grid gap-3">
                    <PremiumCard 
                        label="TOTAL COBRADO" 
                        value={currency.format(totalCobrado)} 
                        highlight 
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                        <PremiumCard label="VISITADOS" value={clientesVisitados} small />
                        <PremiumCard label="PAGOS" value={pagosRegistrados} small />
                    </div>

                    <PremiumCard 
                        label="ESTADO DEL REPORTE" 
                        value={finalized ? "FINALIZADO" : "EN PROGRESO"} 
                        variant={finalized ? "success" : "warning"} 
                        detail={finalizedAt ? `Completado: ${finalizedAt}` : "Todavía en ruta"} 
                    >
                        {!finalized && role === "admin" && (
                            <button
                                onClick={handleFinalize}
                                disabled={finalizing}
                                className="mt-4 w-full h-11 rounded-2xl bg-blue-500 text-white text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                            >
                                {finalizing ? "FINALIZANDO..." : "FINALIZAR REPORTE"}
                            </button>
                        )}
                    </PremiumCard>
                </section>

                {/* Desglose de Métodos */}
                <section className="mt-8">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Desglose por método</h2>
                    <div className="rounded-[32px] bg-white/5 border border-white/5 p-6 backdrop-blur-md space-y-4">
                        <MethodRow label="Efectivo" value={currency.format(breakdown.efectivo)} />
                        <MethodRow label="Mercado Pago" value={currency.format(breakdown.mercadopago)} />
                        <MethodRow label="Transferencia" value={currency.format(breakdown.transferencia)} />
                        <div className="pt-4 border-t border-white/10">
                            <MethodRow label="TOTAL NETO" value={currency.format(breakdown.total)} isTotal />
                        </div>
                    </div>
                </section>

                {/* Clientes Cobrados */}
                <section className="mt-10">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Clientes con pagos</h2>
                    <div className="flex flex-col gap-2">
                        {clientsCobranza.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">No hay registros hoy</div>
                        ) : (
                            clientsCobranza.map((client) => (
                                <div key={client.id} className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-[15px] font-bold">{client.name}</p>
                                        <p className="text-[11px] text-slate-500 font-medium">DNI: {client.document || "-"}</p>
                                    </div>
                                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Detalle de todos los pagos */}
                <section className="mt-10">
                    <div className="flex items-center justify-between mb-4 px-4">
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Pagos registrados</h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20">
                            {pagosRegistrados} TOTAL
                        </span>
                    </div>
                    
                    <div className="space-y-3">
                        {payments.length === 0 ? (
                            <div className="p-12 text-center text-slate-600 font-medium italic">Sin movimientos</div>
                        ) : (
                            payments.map((payment) => (
                                <div key={payment.id} className="group rounded-[24px] bg-gradient-to-r from-white/5 to-transparent border border-white/5 p-4 active:scale-[0.98] transition-transform">
                                    <div className="flex justify-between items-center">
                                        <div className="min-w-0">
                                            <p className="text-[15px] font-black truncate">{payment.credit?.client?.name ?? "-"}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                                                {payment.date ? dateTimeFormatter.format(new Date(payment.date)) : ""}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[16px] font-black text-blue-400">{currency.format(payment.amount ?? 0)}</p>
                                            <div className="inline-block px-1.5 py-0.5 rounded-md bg-white/5 mt-1">
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{payment.methodSummary || "efectivo"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function PremiumCard({ label, value, variant = "default", detail, highlight, small, children }) {
    const variants = {
        default: {
            border: "border-white/10",
            bg: "bg-white/5",
            color: "text-white"
        },
        warning: {
            border: "border-yellow-500/50",
            bg: "bg-yellow-500/5",
            color: "text-yellow-400"
        },
        success: {
            border: "border-emerald-500/50",
            bg: "bg-emerald-500/5",
            color: "text-emerald-400"
        }
    };

    const cfg = variants[variant];

    return (
        <div className={`rounded-[28px] border ${cfg.border} ${cfg.bg} ${small ? "p-4" : "p-6"} backdrop-blur-xl shadow-2xl relative overflow-hidden`}>
            {highlight && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16" />
            )}
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
            <p className={`mt-2 font-black tracking-tight ${highlight ? "text-4xl text-blue-400" : `${small ? "text-xl" : "text-2xl"} ${cfg.color}`}`}>
                {value}
            </p>
            {detail && <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight">{detail}</p>}
            {children}
        </div>
    );
}

function MethodRow({ label, value, isTotal }) {
    return (
        <div className="flex items-center justify-between">
            <p className={`text-xs font-bold uppercase tracking-wider ${isTotal ? "text-white" : "text-slate-500"}`}>{label}</p>
            <p className={`text-[17px] font-black ${isTotal ? "text-blue-400" : "text-slate-200"}`}>{value}</p>
        </div>
    );
}
