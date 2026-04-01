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

  /* Estado del trayecto */
  const estadoTrayecto = resumen.trayectoActivo ? "En curso" : resumen.reporteGenerado ? "Finalizado" : "Pendiente";
  const estadoColor = resumen.trayectoActivo ? "#34C759" : resumen.reporteGenerado ? "#007AFF" : "#FF9500";

  return (
    <div className="flex flex-col gap-5 animate-fade-in px-2 pb-6 max-w-lg mx-auto">

      {/* ── Header card ── */}
      <div className="ios-card p-6">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ios-label-ter)] mb-1">Jornada</p>
            <h1 className="text-2xl font-extrabold text-[color:var(--ios-label)] mb-1 tracking-tight">Panel del Cobrador</h1>
            <p className="text-[15px] text-[color:var(--ios-label-sec)] m-0">Vista pensada para operar rápido desde el teléfono.</p>
          </div>

          {/* Estado + Botón acción */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Badge de estado */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "6px 14px", borderRadius: "99px",
              background: `${estadoColor}18`,
              border: `1.5px solid ${estadoColor}40`,
              fontSize: "13px", fontWeight: 700, color: estadoColor,
            }}>
              {resumen.trayectoActivo ? <HiPlay style={{ width: "14px", height: "14px" }} /> :
                resumen.reporteGenerado ? <HiCheckCircle style={{ width: "14px", height: "14px" }} /> :
                  <HiClock style={{ width: "14px", height: "14px" }} />}
              {estadoTrayecto}
            </div>

            {/* Botón principal */}
            {loadingTrayecto ? (
              <button disabled className="px-6 py-3 rounded-xl bg-[color:var(--ios-fill)] text-[color:var(--ios-label-ter)] font-semibold text-[15px] cursor-not-allowed">
                Cargando...
              </button>
            ) : !trayectoActivo ? (
              <button
                onClick={confirmarInicio}
                disabled={resumen.reporteGenerado}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow ${resumen.reporteGenerado ? "bg-[color:var(--ios-fill)] text-[color:var(--ios-label-ter)] cursor-not-allowed" : "bg-[color:#34C759] text-white hover:shadow-lg hover:-translate-y-0.5"}`}
              >
                <HiPlay style={{ width: "18px", height: "18px" }} />
                {resumen.reporteGenerado ? "Día Finalizado" : "Iniciar trayecto"}
              </button>
            ) : (
              <button
                onClick={confirmarFinalizacion}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] bg-[color:var(--ios-red)] text-white transition-all shadow hover:shadow-lg hover:-translate-y-0.5"
              >
                <HiStop style={{ width: "18px", height: "18px" }} />
                Finalizar día
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {errorResumen && (
        <div className="p-4 bg-[color:var(--ios-red-bg)] rounded-xl border border-[rgba(255,59,48,0.2)] text-[color:var(--ios-red)] text-[14px] font-bold">
          {errorResumen}
        </div>
      )}

      {/* ── Indicadores de cobro ── */}
      {!errorResumen && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Indicador icon={<HiCreditCard style={{ width: "18px", height: "18px", color: "#007AFF" }} />} label="Cobrado por MP" color="#007AFF" valor={loadingResumen ? null : fmtCurrency(resumen.mercadopago)} />
          <Indicador icon={<HiCash style={{ width: "18px", height: "18px", color: "#34C759" }} />} label="Efectivo" color="#34C759" valor={loadingResumen ? null : fmtCurrency(resumen.efectivo)} />
          <Indicador icon={<HiCreditCard style={{ width: "18px", height: "18px", color: "#32ADE6" }} />} label="Transferencias" color="#32ADE6" valor={loadingResumen ? null : fmtCurrency(resumen.transferencia)} />
          <Indicador icon={<HiClipboardList style={{ width: "18px", height: "18px", color: "#FF9500" }} />} label="Pagos diarios" color="#FF9500" valor={loadingResumen ? null : fmtNumber(resumen.pagosDiarios)} />
          <Indicador icon={<HiCalendar style={{ width: "18px", height: "18px", color: "#AF52DE" }} />} label="Semanales" color="#AF52DE" valor={loadingResumen ? null : fmtNumber(resumen.pagosSemanales)} />
          <Indicador icon={<HiCalendar style={{ width: "18px", height: "18px", color: "#5856D6" }} />} label="Quincenales" color="#5856D6" valor={loadingResumen ? null : fmtNumber(resumen.pagosQuincenales)} />
          <Indicador icon={<HiCalendar style={{ width: "18px", height: "18px", color: "#FF3B30" }} />} label="Mensuales" color="#FF3B30" valor={loadingResumen ? null : fmtNumber(resumen.pagosMensuales)} />
        </div>
      )}

      {/* ── Resumen del día ── */}
      {!loadingResumen && !errorResumen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DatoResumen label="Total cobrado hoy" value={fmtCurrency(resumen.totalCobrado)} accent="#34C759" />
          <DatoResumen label="Clientes visitados" value={fmtNumber(resumen.clientesVisitados)} accent="#007AFF" />
          <DatoResumen label="Créditos por cobrar hoy" value={fmtNumber(resumen.asignaciones)} accent="#FF9500" />
          <DatoResumen label="Estado del trayecto" value={estadoTrayecto} accent={estadoColor} />
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message} type={toast.type} confirm={toast.confirm}
          onConfirm={toast.onConfirm} onCancel={() => setToast(null)} onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

function Indicador({ icon, label, color, valor }) {
  return (
    <div className="ios-card px-4 pt-4 pb-5">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--ios-label-ter)] m-0">{label}</p>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}18` }} className="flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </div>
      {valor === null ? (
        <div className="skeleton h-[22px] w-4/5 rounded-md" />
      ) : (
        <p className="text-[18px] font-bold text-[color:var(--ios-label)] m-0 tracking-tight break-words">{valor}</p>
      )}
    </div>
  );
}

function DatoResumen({ label, value, accent }) {
  return (
    <div className="bg-[color:var(--ios-bg-card)] rounded-2xl shadow-sm p-4 border-l-4" style={{ borderLeftColor: accent }}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--ios-label-ter)] mb-1">{label}</p>
      <p className="text-[18px] font-bold text-[color:var(--ios-label)] m-0 tracking-tight break-words">{value}</p>
    </div>
  );
}
