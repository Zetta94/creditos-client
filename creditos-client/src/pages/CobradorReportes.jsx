import { useEffect, useMemo, useState } from "react";
import { HiCash, HiCheckCircle, HiSwitchHorizontal, HiTrendingUp, HiUserGroup, HiSearch, HiX } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { fetchMyReports } from "../services/reportsService";
import Pagination from "../components/Pagination";
import ReportActivityCalendar from "../components/ReportActivityCalendar";

const inputStyle = {
  height: "40px", padding: "0 12px", borderRadius: "10px",
  border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)",
  fontSize: "14px", color: "var(--ios-label)", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
  WebkitAppearance: "none", appearance: "none",
};
const onFocus = e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; e.target.style.background = "#fff"; };
const onBlur = e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--ios-fill)"; };

export default function ReportesCobrador() {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [filtroMes, setFiltroMes] = useState("todos");
  const [filtroDia, setFiltroDia] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportesFiltrados, setReportesFiltrados] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setLoading(true);
    fetchMyReports({ page: 1, pageSize: 1000 })
      .then(res => {
        setReportes(Array.isArray(res?.data?.data) ? res.data.data : []);
        setError(null);
      })
      .catch(() => setError("No se pudieron cargar los reportes"))
      .finally(() => setLoading(false));
  }, []);

  const mesesDisponibles = useMemo(() => {
    if (!reportes.length) return [];
    const meses = reportes.map((r) => new Date(r.fechaDeReporte).toLocaleString("es-AR", { month: "long" }));
    return [...new Set(meses)];
  }, [reportes]);

  useEffect(() => {
    if (!reportes.length) return setReportesFiltrados([]);
    let filtrados = reportes;
    if (filtroMes !== "todos") filtrados = filtrados.filter((r) => new Date(r.fechaDeReporte).toLocaleString("es-AR", { month: "long" }) === filtroMes);
    if (filtroDia) filtrados = filtrados.filter((r) => r.fechaDeReporte.slice(0, 10) === filtroDia);
    filtrados = filtrados.sort((a, b) => new Date(b.fechaDeReporte) - new Date(a.fechaDeReporte));
    setReportesFiltrados(filtrados);
  }, [filtroMes, filtroDia, reportes]);

  useEffect(() => { setPage(1); }, [filtroMes, filtroDia, reportes.length]);

  const totalItems = reportesFiltrados.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const reportesPaginados = reportesFiltrados.slice(pageStart, pageStart + pageSize);

  const resumenTarjetas = [
    { label: "Total efectivo", value: `$${reportesFiltrados.reduce((sum, r) => sum + Number(r.efectivo || 0), 0).toLocaleString("es-AR")}`, icon: HiCash, color: "#1A6B36", bg: "#E8F8ED" },
    { label: "Total MP", value: `$${reportesFiltrados.reduce((sum, r) => sum + Number(r.mercadopago || 0), 0).toLocaleString("es-AR")}`, icon: HiCheckCircle, color: "#004299", bg: "#EBF3FF" },
    { label: "Transferencias", value: `$${reportesFiltrados.reduce((sum, r) => sum + Number(r.transferencia || 0), 0).toLocaleString("es-AR")}`, icon: HiSwitchHorizontal, color: "#5C2B8C", bg: "#F5EAFF" },
    { label: "Total recaudado", value: `$${reportesFiltrados.reduce((sum, r) => sum + Number(r.total || 0), 0).toLocaleString("es-AR")}`, icon: HiTrendingUp, color: "#7C4A00", bg: "#FFF3E0" },
    { label: "Clientes visitados", value: reportesFiltrados.reduce((sum, r) => sum + Number(r.clientsVisited || 0), 0).toLocaleString("es-AR"), icon: HiUserGroup, color: "#004299", bg: "#EBF3FF" },
  ];

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "16px" }} />)}
    </div>
  );
  if (error) return <div style={{ padding: "40px", textAlign: "center", color: "#8B0000", fontSize: "15px" }}>{error}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">

      {/* Header + filtros */}
      <div className="ios-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "14px", marginBottom: "16px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--ios-label)", margin: "0 0 4px", letterSpacing: "-0.025em" }}>
              Mis reportes
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ios-label-ter)", margin: 0 }}>
              {totalItems} {totalItems === 1 ? "reporte" : "reportes"} encontrados
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          <div style={{ flex: "1 1 160px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", display: "block", marginBottom: "5px" }}>Mes</label>
            <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} style={{ ...inputStyle, width: "100%" }} onFocus={onFocus} onBlur={onBlur}>
              <option value="todos">Todos los meses</option>
              {mesesDisponibles.map((mes) => (
                <option key={mes} value={mes}>{mes.charAt(0).toUpperCase() + mes.slice(1)}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", display: "block", marginBottom: "5px" }}>Día específico</label>
            <input type="date" value={filtroDia} onChange={(e) => setFiltroDia(e.target.value)} style={{ ...inputStyle, width: "100%" }} onFocus={onFocus} onBlur={onBlur} />
          </div>
          {(filtroMes !== "todos" || filtroDia) && (
            <button
              onClick={() => { setFiltroMes("todos"); setFiltroDia(""); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                height: "40px", padding: "0 14px", borderRadius: "10px", border: "none",
                background: "var(--ios-fill)", color: "var(--ios-label-sec)",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                marginTop: "23px",
              }}
            >
              <HiX style={{ width: "14px", height: "14px" }} />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      {reportesFiltrados.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
          {resumenTarjetas.map((item) => (
            <div key={item.label} className="ios-card" style={{ padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", margin: 0 }}>{item.label}</p>
                <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <item.icon style={{ width: "15px", height: "15px", color: item.color }} />
                </div>
              </div>
              <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--ios-label)", margin: 0 }}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Calendario */}
      <ReportActivityCalendar
        reports={reportes}
        title="Calendario de actividad"
        onReportClick={(report) => navigate(`/cobrador/reportes/${report.id}`)}
      />

      {/* Desktop table */}
      <div className="hidden sm:block ios-card" style={{ overflow: "hidden", padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Fecha", "Clientes visitados", "Efectivo", "MercadoPago", "Transferencia", "Total"].map((h, i) => (
                <th key={h} style={{ padding: "11px 14px", background: "var(--ios-fill)", borderBottom: "1px solid var(--ios-sep-opaque)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-sec)", textAlign: i === 0 ? "left" : "right" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportesPaginados.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "var(--ios-label-ter)", fontSize: "14px" }}>No hay reportes para los filtros seleccionados.</td></tr>
            ) : reportesPaginados.map((r) => (
              <tr key={r.id}
                onClick={() => navigate(`/cobrador/reportes/${r.id}`)}
                style={{ borderBottom: "1px solid var(--ios-sep-opaque)", transition: "background 0.12s", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 600, color: "var(--ios-label)" }}>
                  {new Date(r.fechaDeReporte).toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td style={{ padding: "12px 14px", fontSize: "14px", color: "var(--ios-label-sec)", textAlign: "right" }}>{r.clientsVisited}</td>
                <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 600, color: "#1A6B36", textAlign: "right" }}>${Number(r.efectivo || 0).toLocaleString("es-AR")}</td>
                <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 600, color: "#004299", textAlign: "right" }}>${Number(r.mercadopago || 0).toLocaleString("es-AR")}</td>
                <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 600, color: "#5C2B8C", textAlign: "right" }}>${Number(r.transferencia || 0).toLocaleString("es-AR")}</td>
                <td style={{ padding: "12px 14px", fontSize: "15px", fontWeight: 800, color: "var(--ios-label)", textAlign: "right" }}>${Number(r.total || 0).toLocaleString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden" style={{ flexDirection: "column", gap: "10px" }}>
        {reportesPaginados.length === 0 ? (
          <div className="ios-card" style={{ padding: "40px", textAlign: "center", color: "var(--ios-label-ter)", fontSize: "14px" }}>
            No hay reportes para los filtros seleccionados.
          </div>
        ) : reportesPaginados.map((r) => (
          <button key={r.id} type="button" onClick={() => navigate(`/cobrador/reportes/${r.id}`)}
            style={{ width: "100%", textAlign: "left", background: "var(--ios-bg-card)", borderRadius: "16px", boxShadow: "var(--ios-shadow-sm)", border: "none", padding: "16px", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--ios-bg-card)"}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--ios-label)", margin: 0 }}>
                {new Date(r.fechaDeReporte).toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
              </p>
              <span style={{ padding: "4px 10px", borderRadius: "99px", background: "#EBF3FF", color: "#004299", fontSize: "12px", fontWeight: 700 }}>Ver detalle</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--ios-label-ter)", margin: "0 0 8px" }}>Clientes visitados: <strong style={{ color: "var(--ios-label)" }}>{r.clientsVisited}</strong></p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {[
                { l: "Efvo", v: r.efectivo, c: "#1A6B36", bg: "#E8F8ED" },
                { l: "MP", v: r.mercadopago, c: "#004299", bg: "#EBF3FF" },
                { l: "Transf.", v: r.transferencia, c: "#5C2B8C", bg: "#F5EAFF" },
              ].map(item => (
                <div key={item.l} style={{ background: item.bg, borderRadius: "8px", padding: "8px 10px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: item.c, margin: "0 0 2px", opacity: 0.7 }}>{item.l}</p>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: item.c, margin: 0 }}>${Number(item.v || 0).toLocaleString("es-AR")}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "10px", padding: "8px 10px", background: "var(--ios-fill)", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--ios-label-ter)", fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--ios-label)" }}>${Number(r.total || 0).toLocaleString("es-AR")}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        page={safePage} pageSize={pageSize}
        totalItems={totalItems} totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />
    </div>
  );
}
