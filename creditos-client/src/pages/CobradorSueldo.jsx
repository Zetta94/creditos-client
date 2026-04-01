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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">

      {/* Header */}
      <div className="ios-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "14px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--ios-label)", margin: "0 0 4px", letterSpacing: "-0.025em" }}>
              Sueldo semanal
            </h1>
            <p style={{ fontSize: "14px", color: "var(--ios-label-sec)", margin: "0 0 2px" }}>{cobrador.name}</p>
            <p style={{ fontSize: "13px", color: "var(--ios-label-ter)", margin: 0 }}>
              Tipo de salario: {salaryTypeLabel} · Día de cobro: <strong>Sábado</strong>
            </p>
          </div>
          <button
            type="button" onClick={generarResumenPago}
            disabled={!esSabado || generandoResumen}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 20px", borderRadius: "12px", border: "none",
              background: !esSabado || generandoResumen ? "var(--ios-fill)" : "var(--ios-blue)",
              color: !esSabado || generandoResumen ? "var(--ios-label-ter)" : "#fff",
              fontSize: "14px", fontWeight: 700, cursor: !esSabado || generandoResumen ? "not-allowed" : "pointer",
              boxShadow: esSabado && !generandoResumen ? "0 4px 12px rgba(0,122,255,0.3)" : "none",
              transition: "all 0.15s",
            }}
          >
            <HiDocumentText style={{ width: "16px", height: "16px" }} />
            {generandoResumen ? "Generando..." : "Generar resumen semanal"}
          </button>
        </div>

        {!esSabado && (
          <div style={{ marginTop: "14px", borderRadius: "10px", background: "#FFFBEB", border: "1.5px solid #F59E0B40", padding: "10px 14px" }}>
            <p style={{ fontSize: "13px", color: "#7C4A00", margin: 0 }}>
              ⚠️ El resumen para pago al administrador solo se genera los sábados.
            </p>
          </div>
        )}

        {pagoRegistradoSemana ? (
          <div style={{ marginTop: "14px", borderRadius: "10px", background: "#E8F8ED", border: "1.5px solid #34C75940", padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#1A6B36", margin: "0 0 2px" }}>Pago registrado esta semana</p>
                <p style={{ fontSize: "13px", color: "#1A6B36", margin: 0 }}>
                  Administración registró tu pago el {formatDate(pagoRegistradoSemana.paidAt)} · Total: {formatCurrency(pagoRegistradoSemana.totalPaid)}
                </p>
              </div>
              <span style={{ padding: "4px 12px", borderRadius: "99px", background: "#C6F6D5", color: "#1A6B36", fontSize: "12px", fontWeight: 700 }}>
                {pagoRegistradoSemana.commissionPaid ? "Con comisión" : "Sin comisión"}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: "14px", borderRadius: "10px", background: "var(--ios-fill)", border: "1.5px solid var(--ios-sep-opaque)", padding: "10px 14px" }}>
            <p style={{ fontSize: "13px", color: "var(--ios-label-ter)", margin: 0 }}>
              Todavía no hay un pago registrado por administración para esta semana.
            </p>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
        {[
          { label: "Sueldo semanal", value: formatCurrency(salarioBaseSemanal), icon: HiCurrencyDollar, color: "#004299", bg: "#EBF3FF" },
          { label: "Comisión", value: formatCurrency(totalComisionSemana), hint: `${porcentajeComision}% por crédito`, icon: HiTrendingUp, color: "#1A6B36", bg: "#E8F8ED" },
          { label: "Total cobrado", value: formatCurrency(totalPagosSemana), hint: "Esta semana", icon: HiCalendar, color: "#5C2B8C", bg: "#F5EAFF" },
          { label: "Total a pagar", value: formatCurrency(totalSemana), hint: "Sueldo + comisión", icon: HiCheckCircle, color: "#7C4A00", bg: "#FFF3E0" },
        ].map(kpi => (
          <div key={kpi.label} className="ios-card" style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", margin: 0 }}>{kpi.label}</p>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <kpi.icon style={{ width: "16px", height: "16px", color: kpi.color }} />
              </div>
            </div>
            <p style={{ fontSize: "20px", fontWeight: 800, color: "var(--ios-label)", margin: 0 }}>{kpi.value}</p>
            {kpi.hint && <p style={{ fontSize: "11px", color: "var(--ios-label-ter)", margin: "4px 0 0" }}>{kpi.hint}</p>}
          </div>
        ))}
      </div>

      {resumenSemanal && (
        <div style={{ borderRadius: "12px", background: "#E8F8ED", border: "1.5px solid #34C75940", padding: "14px 16px" }}>
          <p style={{ fontSize: "14px", color: "#1A6B36", margin: 0, fontWeight: 600 }}>
            {resumenSemanal.alreadyGenerated
              ? "✓ Resumen ya existente. El administrador ya lo tiene en Mensajes."
              : "✓ Resumen generado correctamente. El administrador puede verlo en Mensajes."}
          </p>
        </div>
      )}

      {/* Detalle semanal */}
      <div className="ios-card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 14px" }}>
          Detalle por crédito creado
        </h2>
        {loading ? (
          <div className="skeleton" style={{ height: "80px", borderRadius: "12px" }} />
        ) : error ? (
          <p style={{ color: "#8B0000", fontSize: "14px" }}>{error}</p>
        ) : creditosConComision.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block" style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--ios-sep-opaque)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Fecha", "Cliente", "Crédito/Producto", "Monto cobrado", "Comisión"].map((h, i) => (
                      <th key={h} style={{ padding: "10px 14px", background: "var(--ios-fill)", borderBottom: "1px solid var(--ios-sep-opaque)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-sec)", textAlign: i === 4 ? "right" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detallePaginado.map((item) => (
                    <tr key={item.creditId} style={{ borderBottom: "1px solid var(--ios-sep-opaque)", transition: "background 0.12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 14px", fontSize: "14px", color: "var(--ios-label-sec)" }}>{new Date(item.date).toLocaleDateString("es-AR")}</td>
                      <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 600, color: "var(--ios-label)" }}>{item.cliente}</td>
                      <td style={{ padding: "12px 14px", fontSize: "14px", color: "var(--ios-label-sec)" }}>{item.producto}</td>
                      <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 700, color: "var(--ios-label)" }}>${item.amount.toLocaleString("es-AR")}</td>
                      <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 700, color: "#1A6B36", textAlign: "right" }}>${item.comision.toLocaleString("es-AR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden" style={{ flexDirection: "column", gap: "10px" }}>
              {detallePaginado.map((item) => (
                <div key={item.creditId} style={{ background: "var(--ios-fill)", borderRadius: "12px", padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 2px" }}>{item.cliente}</p>
                      <p style={{ fontSize: "12px", color: "var(--ios-label-ter)", margin: 0 }}>{item.producto} · {formatDate(item.date)}</p>
                    </div>
                    <span style={{ padding: "4px 10px", borderRadius: "99px", background: "#E8F8ED", color: "#1A6B36", fontSize: "12px", fontWeight: 700 }}>
                      ${item.comision.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--ios-label-sec)", margin: 0 }}>Monto cobrado: <strong>${item.amount.toLocaleString("es-AR")}</strong></p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "14px" }}>
              <Pagination
                page={detallePageSafe} pageSize={detallePageSize}
                totalItems={creditosConComision.length} totalPages={detalleTotalPages}
                onPageChange={setDetallePage}
                onPageSizeChange={(size) => { setDetallePageSize(size); setDetallePage(1); }}
                pageSizeOptions={[5, 10, 20]}
              />
            </div>
          </>
        ) : (
          <p style={{ fontSize: "14px", color: "var(--ios-label-ter)", textAlign: "center", padding: "24px" }}>
            No se registraron créditos creados esta semana.
          </p>
        )}
      </div>

      {/* Historial */}
      <div className="ios-card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 14px" }}>
          Resúmenes anteriores
        </h2>
        {loading ? (
          <div className="skeleton" style={{ height: "80px", borderRadius: "12px" }} />
        ) : historialParaMostrar.length === 0 ? (
          <p style={{ fontSize: "14px", color: "var(--ios-label-ter)", textAlign: "center", padding: "24px" }}>
            No hay resúmenes históricos para mostrar.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {historialPaginado.map((item) => (
              <div key={item.payrollKey} style={{ borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", padding: "16px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ios-label)", margin: 0 }}>
                    Semana del {formatDate(item.weekStart)} al {formatDate(item.weekEnd)}
                  </p>
                  <span style={{
                    padding: "4px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: 700,
                    background: item.generated ? "#E8F8ED" : "#FFF3E0",
                    color: item.generated ? "#1A6B36" : "#7C4A00",
                  }}>
                    {item.generated ? "Generado" : "No generado"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
                  {[
                    { label: "Sueldo", value: formatCurrency(item.weeklySalary) },
                    { label: "Comisión", value: formatCurrency(item.totalCommission) },
                    { label: "Total payout", value: formatCurrency(item.weeklyPayout) },
                    { label: "Estado", value: item.payment ? "Pagado" : "Pendiente" },
                    { label: "Com. pagada", value: item.payment?.commissionPaid ? "Sí" : "No" },
                    { label: "Pagado", value: item.payment ? formatCurrency(item.payment.totalPaid) : "—" },
                  ].map(f => (
                    <div key={f.label}>
                      <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", margin: "0 0 2px" }}>{f.label}</p>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ios-label)", margin: 0 }}>{f.value}</p>
                    </div>
                  ))}
                </div>
                <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--ios-label-ter)" }}>
                  Créditos con comisión: {Array.isArray(item.items) ? item.items.length : 0}
                </p>
              </div>
            ))}
            <Pagination
              page={historialPageSafe} pageSize={historialPageSize}
              totalItems={historialParaMostrar.length} totalPages={historialTotalPages}
              onPageChange={setHistorialPage}
              onPageSizeChange={(size) => { setHistorialPageSize(size); setHistorialPage(1); }}
              pageSizeOptions={[4, 8, 12]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
