import { useState, useEffect, useCallback } from "react";
import {
  HiPlay,
  HiStop,
  HiCash,
  HiCreditCard,
  HiCalendar,
  HiClipboardList,
  HiCheckCircle,
  HiClock,
  HiX,
} from "react-icons/hi";
import Toast from "../components/Toast.jsx";
import { fetchDashboardResumenCobrador } from "../services/dashboardService";
import { useDispatch } from "react-redux";
import { setTrayectoActivo as setTrayectoActivoAction } from "../store/trayectoSlice";

export default function DashboardCobrador() {
  const dispatch = useDispatch();
  const [trayectoActivo, setTrayectoActivoState] = useState(false);
  const [loadingTrayecto, setLoadingTrayecto] = useState(true);
  const [toast, setToast] = useState(null);
  const [resumen, setResumen] = useState({
    mercadopago: 0, efectivo: 0, transferencia: 0,
    pagosDiarios: 0, pagosSemanales: 0, pagosQuincenales: 0, pagosMensuales: 0,
    totalCobrado: 0, clientesVisitados: 0, asignaciones: 0,
    reporteGenerado: false, trayectoActivo: false,
  });
  const [loadingResumen, setLoadingResumen] = useState(true);
  const [errorResumen, setErrorResumen] = useState(null);

  const applyResumenData = useCallback((data) => {
    const activo = Boolean(data.trayectoActivo);
    setResumen({
      mercadopago: data.mercadopago ?? 0, efectivo: data.efectivo ?? 0, transferencia: data.transferencia ?? 0,
      pagosDiarios: data.pagosDiarios ?? 0, pagosSemanales: data.pagosSemanales ?? 0,
      pagosQuincenales: data.pagosQuincenales ?? 0, pagosMensuales: data.pagosMensuales ?? 0,
      totalCobrado: data.totalCobrado ?? ((data.mercadopago ?? 0) + (data.efectivo ?? 0) + (data.transferencia ?? 0)),
      clientesVisitados: data.clientesVisitados ?? 0, asignaciones: data.asignaciones ?? 0,
      reporteGenerado: Boolean(data.reporteGenerado), trayectoActivo: activo,
    });
    setTrayectoActivoState(activo);
    dispatch(setTrayectoActivoAction(activo));
    setLoadingTrayecto(false);
    setLoadingResumen(false);
    setErrorResumen(null);
  }, [dispatch]);

  const getResumenData = useCallback(async () => {
    const response = await fetchDashboardResumenCobrador();
    return response.data || {};
  }, []);

  const reloadResumen = useCallback(async (options = { showLoader: true }) => {
    if (options.showLoader) setLoadingResumen(true);
    try {
      const data = await getResumenData();
      applyResumenData(data);
      return data;
    } catch (err) {
      setErrorResumen("No se pudo cargar el resumen del cobrador.");
      throw err;
    } finally {
      if (options.showLoader) setLoadingResumen(false);
    }
  }, [getResumenData, applyResumenData]);

  useEffect(() => {
    let active = true;
    setLoadingResumen(true);
    getResumenData()
      .then(data => { if (!active) return; applyResumenData(data); })
      .catch(() => { if (!active) return; setErrorResumen("No se pudo cargar el resumen del cobrador."); })
      .finally(() => { if (!active) return; setLoadingResumen(false); });
    return () => { active = false; };
  }, [getResumenData, applyResumenData]);

  async function confirmarInicio() {
    setToast({
      message: "¿Deseas iniciar el trayecto del día?",
      type: "info",
      confirm: true,
      onConfirm: async () => {
        try {
          setLoadingTrayecto(true);
          await import("../services/reportsService").then(m => m.startReport());
          await reloadResumen({ showLoader: false });
          setToast({ message: "Trayecto iniciado correctamente.", type: "success" });
        } catch {
          setToast({ message: "Error iniciando trayecto.", type: "error" });
        } finally { setLoadingTrayecto(false); }
      },
    });
  }

  async function confirmarFinalizacion() {
    setToast({
      message: "¿Deseas finalizar el día y enviar el resumen?",
      type: "error",
      confirm: true,
      onConfirm: async () => {
        try {
          setLoadingTrayecto(true);
          await import("../services/reportsService").then(m => m.finalizeReport());
          await reloadResumen({ showLoader: false });
          setToast({ message: "Reporte finalizado correctamente.", type: "info" });
        } catch {
          setToast({ message: "Error enviando resumen.", type: "error" });
        } finally { setLoadingTrayecto(false); }
      },
    });
  }

  const fmtCurrency = v => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v ?? 0);
  const fmtNumber = v => new Intl.NumberFormat("es-AR").format(v ?? 0);

  const estadoTrayecto = resumen.trayectoActivo ? "En curso" : resumen.reporteGenerado ? "Finalizado" : "Pendiente";
  const estadoColor = resumen.trayectoActivo ? "#34C759" : resumen.reporteGenerado ? "#007AFF" : "#FF9500";

  return (
    <div className="min-h-screen bg-[#060b1d] text-white" style={{ 
        backgroundImage: "radial-gradient(circle at 50% -20%, #1a2b5a 0%, #060b1d 80%)",
        backgroundAttachment: "fixed"
    }}>
      <div className="mx-auto max-w-[500px] px-4 py-8 pb-32 animate-fade-in">
      
      {/* ── Header Principal ── */}
      <header className="py-8 text-center">
        <p className="text-[10px] ont-black uppercase tracking-[0.2em] text-slate-500 mb-2">Mi Jornada</p>
        <h1 className="text-3xl font-black tracking-tight text-white">Panel de Control</h1>
      </header>

      {/* ── Tarjeta de Estado Principal ── */}
      <section className="mb-8">
        <div className="rounded-[32px] bg-white/5 border border-white/10 p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden text-center">
          {/* Brillo de fondo sutil */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 blur-3xl -ml-16 -mt-16" />
          
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div 
              style={{ background: `${estadoColor}15`, color: estadoColor, borderColor: `${estadoColor}30` }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest"
            >
              <div style={{ background: estadoColor }} className="h-1.5 w-1.5 rounded-full animate-pulse" />
              {estadoTrayecto}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOTAL RECAUDADO HOY</p>
              <h2 className="text-5xl font-black tracking-tighter text-white">
                {loadingResumen ? "---" : fmtCurrency(resumen.totalCobrado)}
              </h2>
            </div>

            {/* BOTÓN DE ACCIÓN PRINCIPAL */}
            <div className="w-full mt-4">
              {loadingTrayecto ? (
                <div className="h-14 w-full rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 font-bold">
                  Cargando...
                </div>
              ) : !trayectoActivo ? (
                <button
                  onClick={confirmarInicio}
                  disabled={resumen.reporteGenerado}
                  className={`group relative h-16 w-full rounded-3xl font-black text-lg tracking-tight shadow-xl transition-all active:scale-95 ${
                    resumen.reporteGenerado 
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                      : "bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-emerald-500/20"
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <HiPlay className="h-6 w-6" />
                    {resumen.reporteGenerado ? "Jornada Finalizada" : "INICIAR TRAYECTO"}
                  </div>
                  {!resumen.reporteGenerado && (
                    <div className="absolute inset-0 rounded-3xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              ) : (
                <button
                  onClick={confirmarFinalizacion}
                  className="h-16 w-full rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 font-black text-lg tracking-tight shadow-xl shadow-red-500/5 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <HiStop className="h-6 w-6" />
                  FINALIZAR JORNADA
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── KPIs Secundarios ── */}
      <section className="grid grid-cols-2 gap-3 mb-8">
        <MiniCard 
          label="Visitados" 
          value={resumen.clientesVisitados} 
          icon={<HiCheckCircle className="h-5 w-5 text-blue-400" />}
          loading={loadingResumen}
        />
        <MiniCard 
          label="Pendientes" 
          value={resumen.asignaciones} 
          icon={<HiClock className="h-5 w-5 text-orange-400" />}
          loading={loadingResumen}
        />
      </section>

      {/* ── Desglose de Métodos ── */}
      <section className="mt-4">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Detalle por Método</h3>
        <div className="rounded-[32px] bg-white/5 border border-white/5 p-6 backdrop-blur-md space-y-5">
          <MetodoItem label="Efectivo" value={fmtCurrency(resumen.efectivo)} color="text-emerald-400" />
          <MetodoItem label="Mercado Pago" value={fmtCurrency(resumen.mercadopago)} color="text-blue-400" />
          <MetodoItem label="Transferencia" value={fmtCurrency(resumen.transferencia)} color="text-sky-400" />
        </div>
      </section>

      {/* ── Planificación Semanal ── */}
      <section className="mt-10">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Cobros Semanales</h3>
        <div className="grid grid-cols-3 gap-2">
            <FlatCard label="Diarios" value={resumen.pagosDiarios} color="yellow" />
            <FlatCard label="Semanales" value={resumen.pagosSemanales} color="blue" />
            <FlatCard label="Quinc." value={resumen.pagosQuincenales} color="indigo" />
        </div>
      </section>

      {errorResumen && (
        <div className="mt-8 p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500 text-xs font-black text-center uppercase tracking-widest">
          {errorResumen}
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message} type={toast.type} confirm={toast.confirm}
          onConfirm={toast.onConfirm} onCancel={() => setToast(null)} onClose={() => setToast(null)}
        />
      )}
      </div>
    </div>
  );
}

function MiniCard({ label, value, icon, loading }) {
  return (
    <div className="rounded-3xl bg-white/5 border border-white/10 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-black text-white">
        {loading ? "---" : value}
      </p>
    </div>
  );
}

function MetodoItem({ label, value, color }) {
    return (
        <div className="flex items-center justify-between">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</p>
            <p className={`text-lg font-black ${color}`}>{value}</p>
        </div>
    );
}

function FlatCard({ label, value, color }) {
    const colors = {
        yellow: "text-orange-400 bg-orange-400/5 border-orange-400/10",
        blue: "text-blue-400 bg-blue-400/5 border-blue-400/10",
        indigo: "text-indigo-400 bg-indigo-400/5 border-indigo-400/10"
    };

    return (
        <div className={`rounded-2xl border ${colors[color]} p-4 text-center`}>
            <p className="text-[8px] font-black uppercase tracking-tighter mb-1 opacity-70">{label}</p>
            <p className="text-xl font-black tracking-tight">{value}</p>
        </div>
    );
}
