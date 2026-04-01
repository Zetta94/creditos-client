import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { HiCurrencyDollar, HiTrendingUp, HiCalendar, HiDocumentText, HiCheckCircle } from "react-icons/hi";
import {
  fetchWeeklyPayrollPreview,
  fetchWeeklyPayrollHistory,
  generateWeeklyPayroll,
} from "../services/reportsService";
import toast from "react-hot-toast";
import Pagination from "../components/Pagination";

const salaryTypeLabels = { N_A: "Sin definir", DIARIO: "Diario", SEMANAL: "Semanal", MENSUAL: "Mensual" };
const formatCurrency = (value) => `$${Number(value || 0).toLocaleString("es-AR")}`;
const formatDate = (value) => { if (!value) return "-"; return new Date(value).toLocaleDateString("es-AR"); };

export default function SueldoCobrador() {
  const authUser = useSelector((state) => state.auth.user);
  const storedUser = useMemo(() => {
    if (authUser) return null;
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }, [authUser]);

  const cobrador = authUser || storedUser;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resumenPreview, setResumenPreview] = useState(null);
  const [historialResumenes, setHistorialResumenes] = useState([]);
  const [generandoResumen, setGenerandoResumen] = useState(false);
  const [resumenSemanal, setResumenSemanal] = useState(null);
  const [detallePage, setDetallePage] = useState(1);
  const [detallePageSize, setDetallePageSize] = useState(5);
  const [historialPage, setHistorialPage] = useState(1);
  const [historialPageSize, setHistorialPageSize] = useState(4);

  useEffect(() => {
    if (!cobrador?.id) return;
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const [previewRes, historyRes] = await Promise.all([
          fetchWeeklyPayrollPreview(),
          fetchWeeklyPayrollHistory({ weeks: 10 }),
        ]);
        setResumenPreview(previewRes?.data ?? null);
        setHistorialResumenes(Array.isArray(historyRes?.data?.data) ? historyRes.data.data : []);
      } catch (err) {
        setResumenPreview(null); setHistorialResumenes([]);
        setError("No se pudo obtener el resumen semanal.");
      } finally { setLoading(false); }
    };
    load();
  }, [cobrador?.id]);

  const role = (cobrador?.role || "").toLowerCase();
  const esCobrador = role === "cobrador" || role === "employee";

  if (!esCobrador) return (
    <div style={{ padding: "40px", textAlign: "center", color: "var(--ios-label-sec)" }}>
      No tienes permiso para acceder a esta vista.
    </div>
  );

  const salarioBaseSemanal = Number(resumenPreview?.weeklySalary ?? cobrador.salary) || 0;
  const porcentajeComision = Number(resumenPreview?.commissionRatePercent ?? cobrador.comisions) || 0;
  const salaryTypeKey = (cobrador.salaryType || "N_A").toUpperCase();
  const salaryTypeLabel = salaryTypeLabels[salaryTypeKey] || salaryTypeLabels.N_A;

  const creditosConComision = useMemo(() => {
    const items = Array.isArray(resumenPreview?.items) ? resumenPreview.items : [];
    return items.map((item) => ({
      ...item,
      amount: Number(item.amount || 0),
      comision: Number(item.commission || 0),
      producto: item.product || "Credito",
      cliente: item.clientName || "Cliente sin nombre",
    }));
  }, [resumenPreview]);

  const totalPagosSemana = useMemo(() => Number(resumenPreview?.totalCollected || 0), [resumenPreview]);
  const totalComisionSemana = useMemo(() => Number(resumenPreview?.totalCommission ?? 0), [resumenPreview]);
  const totalSemana = salarioBaseSemanal + totalComisionSemana;
  const pagoRegistradoSemana = resumenPreview?.payment ?? null;
  const esSabado = new Date().getDay() === 6;

  const historialParaMostrar = useMemo(
    () => historialResumenes.filter((h) => (h?.weeklySalary || 0) > 0 || (h?.totalCommission || 0) > 0 || (h?.items?.length || 0) > 0),
    [historialResumenes]
  );

  useEffect(() => { setDetallePage(1); }, [creditosConComision.length]);
  useEffect(() => { setHistorialPage(1); }, [historialParaMostrar.length]);

  const detalleTotalPages = Math.max(1, Math.ceil(creditosConComision.length / detallePageSize));
  const detallePageSafe = Math.min(detallePage, detalleTotalPages);
  const detalleInicio = (detallePageSafe - 1) * detallePageSize;
  const detallePaginado = creditosConComision.slice(detalleInicio, detalleInicio + detallePageSize);

  const historialTotalPages = Math.max(1, Math.ceil(historialParaMostrar.length / historialPageSize));
  const historialPageSafe = Math.min(historialPage, historialTotalPages);
  const historialInicio = (historialPageSafe - 1) * historialPageSize;
  const historialPaginado = historialParaMostrar.slice(historialInicio, historialInicio + historialPageSize);

  const generarResumenPago = async () => {
    setGenerandoResumen(true);
    try {
      const { data } = await generateWeeklyPayroll();
      setResumenSemanal(data);
      if (data?.alreadyGenerated) toast("El resumen de esta semana ya fue generado.", { icon: "ℹ️" });
      else toast.success("Resumen semanal generado y enviado a Mensajes para el administrador.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "No se pudo generar el resumen semanal.");
    } finally { setGenerandoResumen(false); }
  };

  return (
    <div className="min-h-screen bg-[#060b1d] text-white" 
         style={{ backgroundImage: "radial-gradient(circle at 50% -20%, #1a2b5a 0%, #060b1d 80%)", backgroundAttachment: "fixed" }}>
      
      <div className="mx-auto max-w-2xl px-4 py-8 pb-32 animate-fade-in space-y-6">
        
        {/* ── Header ── */}
        <div className="rounded-[32px] bg-white/5 border border-white/10 p-8 backdrop-blur-2xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16" />
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Mi Sueldo</p>
                <h1 className="text-3xl font-black tracking-tight text-white">{cobrador.name}</h1>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Salario: <span className="text-white font-bold">{salaryTypeLabel}</span> · Cobro: <span className="text-white font-bold">Sábados</span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400">
                <HiCurrencyDollar className="h-7 w-7" />
              </div>
            </div>

            <button
              onClick={generarResumenPago}
              disabled={!esSabado || generandoResumen}
              className={`h-14 w-full rounded-2xl font-black text-sm tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 ${
                !esSabado || generandoResumen 
                ? "bg-white/5 text-slate-500 border border-white/5 grayscale" 
                : "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-xl shadow-blue-500/20"
              }`}
            >
              <HiDocumentText className="h-5 w-5" />
              {generandoResumen ? "GENERANDO..." : "GENERAR RESUMEN SEMANAL"}
            </button>

            {!esSabado && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Solo disponible los Sábados
              </div>
            )}
          </div>
        </div>

        {/* ── KPIs Grid ── */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Salario Base", value: formatCurrency(salarioBaseSemanal), icon: HiCurrencyDollar, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
            { label: "Comisiones", value: formatCurrency(totalComisionSemana), hint: `${porcentajeComision}% variable`, icon: HiTrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
            { label: "Total Cobrado", value: formatCurrency(totalPagosSemana), hint: "Esta semana", icon: HiCalendar, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
            { label: "Mi Ganancia", value: formatCurrency(totalSemana), hint: "A liquidar", icon: HiCheckCircle, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-[28px] bg-white/5 border border-white/10 p-5 backdrop-blur-xl space-y-3 relative overflow-hidden">
              <div className={`absolute top-0 right-0 p-3 ${kpi.color} opacity-20`}>
                <kpi.icon className="h-12 w-12" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{kpi.label}</p>
              <div>
                <p className="text-2xl font-black text-white tracking-tighter">{kpi.value}</p>
                {kpi.hint && <p className="text-[10px] text-slate-500 font-bold italic">{kpi.hint}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* ── Status Alerts ── */}
        {pagoRegistradoSemana && (
            <div className="rounded-[28px] bg-emerald-500/10 border border-emerald-500/20 p-5 flex items-center gap-4 animate-ios-notification backdrop-blur-md">
                <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner">
                    <HiCheckCircle className="h-7 w-7" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-0.5">Pago Registrado</p>
                    <p className="text-[13px] text-white font-bold tracking-tight">Liquidados {formatCurrency(pagoRegistradoSemana.totalPaid)}</p>
                    <p className="text-[10px] text-emerald-500/60 font-medium italic">El día {formatDate(pagoRegistradoSemana.paidAt)}</p>
                </div>
            </div>
        )}

        {resumenSemanal && (
          <div className="rounded-3xl bg-blue-500/10 border border-blue-500/20 p-5 text-center animate-slide-up">
            <p className="text-xs font-black text-blue-400 uppercase tracking-widest">
              {resumenSemanal.alreadyGenerated ? "RESUMEN EXISTENTE" : "RESUMEN ENVIADO"}
            </p>
            <p className="text-sm text-slate-300 font-medium mt-1">El administrador ya tiene el reporte en su panel de mensajes.</p>
          </div>
        )}

        {/* ── Detalle List ── */}
        <div className="rounded-[32px] bg-white/5 border border-white/10 p-8 backdrop-blur-2xl shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Detalle por Crédito</h2>
            <span className="text-[10px] font-bold text-slate-600 italic">{creditosConComision.length} registros</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-20 w-full rounded-2xl bg-white/5 animate-pulse" />
              <div className="h-20 w-full rounded-2xl bg-white/5 animate-pulse" />
            </div>
          ) : creditosConComision.length > 0 ? (
            <div className="space-y-4">
              {detallePaginado.map((item) => (
                <div key={item.creditId} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-black text-white text-lg tracking-tight">{item.cliente}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.producto} · {formatDate(item.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-md font-black text-emerald-400">+ ${item.comision.toLocaleString("es-AR")}</p>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Comisión</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <p className="text-[10px] text-slate-400 font-medium">Cobrado: <span className="text-white font-bold">${item.amount.toLocaleString("es-AR")}</span></p>
                  </div>
                </div>
              ))}
              
              <div className="pt-4">
                <Pagination
                  page={detallePageSafe} pageSize={detallePageSize}
                  totalItems={creditosConComision.length} totalPages={detalleTotalPages}
                  onPageChange={setDetallePage}
                  onPageSizeChange={(size) => { setDetallePageSize(size); setDetallePage(1); }}
                  pageSizeOptions={[5, 10, 20]}
                  variant="dark"
                />
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500 font-bold italic">No se registraron cobros con comisión esta semana.</p>
            </div>
          )}
        </div>

        {/* ── Historial ── */}
        <div className="rounded-[32px] bg-white/5 border border-white/10 p-8 backdrop-blur-2xl shadow-xl space-y-6">
          <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Resúmenes Históricos</h2>
          
          {historialParaMostrar.length === 0 ? (
            <p className="text-center text-sm text-slate-600 font-bold italic py-8">Sin historial acumulado.</p>
          ) : (
            <div className="space-y-4">
              {historialPaginado.map((item) => (
                <div key={item.payrollKey} className="p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs font-black text-white uppercase tracking-widest">
                      SEMANA {formatDate(item.weekStart)}
                    </p>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${
                      item.generated ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {item.generated ? "GENERADO" : "PENDIENTE"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">SUELDO</p>
                      <p className="text-sm font-bold text-white">{formatCurrency(item.weeklySalary)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">COMISIÓN</p>
                      <p className="text-sm font-bold text-emerald-400">{formatCurrency(item.totalCommission)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">PAGADO</p>
                      <p className={`text-sm font-bold ${item.payment ? "text-blue-400" : "text-slate-500"}`}>
                        {item.payment ? formatCurrency(item.payment.totalPaid) : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-4">
                <Pagination
                  page={historialPageSafe} pageSize={historialPageSize}
                  totalItems={historialParaMostrar.length} totalPages={historialTotalPages}
                  onPageChange={setHistorialPage}
                  onPageSizeChange={(size) => { setHistorialPageSize(size); setHistorialPage(1); }}
                  pageSizeOptions={[4, 8, 12]}
                  variant="dark"
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
