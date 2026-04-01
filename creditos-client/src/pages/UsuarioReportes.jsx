import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchUser } from "../services/usersService";
import { fetchClients } from "../services/clientsService";
import { fetchCredits } from "../services/creditsService";
import { fetchPayments } from "../services/paymentsService";
import { fetchReportsByUser } from "../services/reportsService";
import { HiArrowLeft, HiCash, HiUserGroup, HiClock } from "react-icons/hi";
import ReportActivityCalendar from "../components/ReportActivityCalendar";

const inputStyle = {
  height: "40px", padding: "0 12px", borderRadius: "10px",
  border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)",
  fontSize: "14px", color: "var(--ios-label)", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
  WebkitAppearance: "none", appearance: "none", width: "100%",
};
const onFocus = e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; e.target.style.background = "#fff"; };
const onBlur = e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--ios-fill)"; };

export default function UsuarioReportes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [creditos, setCreditos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rateLimit, setRateLimit] = useState(false);

  const [semana, setSemana] = useState(() => {
    const today = new Date();
    const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    return monday.toISOString().slice(0, 10);
  });
  const [diaFiltro, setDiaFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true); setRateLimit(false);
      try {
        const [u, cl, cr, pa, rep] = await Promise.all([
          fetchUser(id).then(r => r.data),
          fetchClients({ page: 1, pageSize: 500 }).then(r => r.data?.data ?? []),
          fetchCredits({ page: 1, pageSize: 2000 }).then(r => r.data?.data ?? []),
          fetchPayments({ page: 1, pageSize: 500 }).then(r => r.data?.data ?? []),
          fetchReportsByUser(id, { page: 1, pageSize: 1000 }).then(r => r.data?.data ?? []).catch(() => []),
        ]);
        if (!mounted) return;
        setUsuario(u); setClientes(cl); setCreditos(cr); setPagos(pa); setReportes(rep);
      } catch (err) {
        if (!mounted) return;
        if (err?.response?.status === 429) setRateLimit(true);
      } finally { if (mounted) setLoading(false); }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const creditosAsignados = useMemo(() => creditos.filter(cr => cr.userId === id), [creditos, id]);

  const pagosOrdenadosPorCredito = useMemo(() => {
    const map = new Map();
    pagos.forEach(p => { const list = map.get(p.creditId) || []; list.push(p); map.set(p.creditId, list); });
    map.forEach(list => list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    return map;
  }, [pagos]);

  const totalPagadoPorCredito = useMemo(() => {
    const map = new Map();
    pagos.forEach(p => map.set(p.creditId, (map.get(p.creditId) || 0) + (Number(p.amount) || 0)));
    return map;
  }, [pagos]);

  const calcularMontoPlan = c => c?.totalInstallments && c?.installmentAmount ? c.totalInstallments * c.installmentAmount : Number(c?.amount || 0);
  const calcularRestante = c => Math.max(0, calcularMontoPlan(c) - (totalPagadoPorCredito.get(c?.id) || 0));

  const pagosUsuario = useMemo(() => pagos.filter(p => {
    if (p.employeeId !== id) return false;
    const fecha = new Date(p.date);
    return !Number.isNaN(fecha.getTime()) && fecha.getDay() !== 0;
  }), [pagos, id]);

  const pagosSemana = useMemo(() => {
    const inicioSemana = new Date(semana);
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 5);
    return pagosUsuario.filter(p => { const f = new Date(p.date); return f >= inicioSemana && f <= finSemana; });
  }, [semana, pagosUsuario]);

  const pagosFiltrados = diaFiltro ? pagosSemana.filter(p => new Date(p.date).toISOString().slice(0, 10) === diaFiltro) : pagosSemana;
  const totalPaginas = Math.ceil(pagosFiltrados.length / porPagina);
  const pagosPaginados = pagosFiltrados.slice((pagina - 1) * porPagina, pagina * porPagina);

  const resumenSemana = useMemo(() => ({
    cobrado: pagosSemana.reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
    creditosSinPago: creditosAsignados.filter(cr => calcularRestante(cr) > 0 && !pagosSemana.some(p => p.creditId === cr.id)).length,
    pendiente: creditosAsignados.reduce((acc, cr) => acc + calcularRestante(cr), 0),
  }), [pagosSemana, creditosAsignados, totalPagadoPorCredito]);

  const diasConPagos = useMemo(() => { const set = new Set(); pagosSemana.forEach(p => set.add(new Date(p.date).toISOString().slice(0, 10))); return Array.from(set).sort(); }, [pagosSemana]);

  const openReportDetail = reportId => {
    const base = `${window.location.origin}${window.location.pathname}#/reportes/${reportId}`;
    window.open(base, "_blank", "noopener,noreferrer");
  };

  const currency = v => `$${Number(v || 0).toLocaleString("es-AR")}`;

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "16px" }} />)}
    </div>
  );
  if (rateLimit) return <div style={{ padding: "32px", textAlign: "center", color: "#8B0000", fontSize: "14px", fontWeight: 600 }}>Demasiadas solicitudes. Esperá unos segundos y reintentá.</div>;
  if (!usuario) return <div style={{ padding: "32px", textAlign: "center", color: "var(--ios-label-sec)" }}>Usuario no encontrado.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <button onClick={() => navigate(-1)}
          style={{ width: "40px", height: "40px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-bg-card)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--ios-bg-card)"}
        >
          <HiArrowLeft style={{ width: "18px", height: "18px", color: "var(--ios-blue)" }} />
        </button>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.025em" }}>Reportes del cobrador</h1>
          <p style={{ fontSize: "13px", color: "var(--ios-label-ter)", margin: "2px 0 0" }}>{usuario.name}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="ios-card" style={{ padding: "16px" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", margin: "0 0 12px" }}>Filtros</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-sec)", display: "block", marginBottom: "5px" }}>Semana seleccionada</label>
            <input type="date" value={semana} onChange={e => { setSemana(e.target.value); setPagina(1); }} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-sec)", display: "block", marginBottom: "5px" }}>Filtrar por día</label>
            <select value={diaFiltro} onChange={e => { setDiaFiltro(e.target.value); setPagina(1); }} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
              <option value="">Todos los días</option>
              {diasConPagos.map(key => (
                <option key={key} value={key}>{new Date(key).toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "short" })}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
        {[
          { label: "Cobrado semana", value: currency(resumenSemana.cobrado), icon: HiCash, color: "#1A6B36", bg: "#E8F8ED" },
          { label: "Sin pago", value: resumenSemana.creditosSinPago, icon: HiUserGroup, color: "#7C4A00", bg: "#FFF3E0" },
          { label: "Pendiente total", value: currency(resumenSemana.pendiente), icon: HiClock, color: "#5C2B8C", bg: "#F5EAFF" },
        ].map(k => (
          <div key={k.label} className="ios-card" style={{ padding: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", margin: 0 }}>{k.label}</p>
              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: k.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <k.icon style={{ width: "14px", height: "14px", color: k.color }} />
              </div>
            </div>
            <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--ios-label)", margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Calendario */}
      <ReportActivityCalendar reports={reportes} title={`Actividad de ${usuario.name}`} onReportClick={report => openReportDetail(report.id)} />

      {/* Tabla reportes registrados */}
      <div className="ios-card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 14px" }}>Reportes registrados</h2>
        <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--ios-sep-opaque)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Fecha", "Clientes visitados", "Efectivo", "MercadoPago", "Total", ""].map((h, i) => (
                  <th key={h || i} style={{ padding: "10px 14px", background: "var(--ios-fill)", borderBottom: "1px solid var(--ios-sep-opaque)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-sec)", textAlign: i >= 2 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportes.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--ios-label-ter)", fontSize: "14px" }}>No hay reportes registrados.</td></tr>
              ) : reportes.map(r => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--ios-sep-opaque)", transition: "background 0.12s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 600, color: "var(--ios-label)" }}>{new Date(r.fechaDeReporte).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td style={{ padding: "12px 14px", fontSize: "14px", color: "var(--ios-label-sec)" }}>{r.clientsVisited}</td>
                  <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 600, color: "#1A6B36", textAlign: "right" }}>{currency(r.efectivo)}</td>
                  <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 600, color: "#004299", textAlign: "right" }}>{currency(r.mercadopago)}</td>
                  <td style={{ padding: "12px 14px", fontSize: "15px", fontWeight: 800, color: "var(--ios-label)", textAlign: "right" }}>{currency(r.total)}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <button onClick={() => openReportDetail(r.id)} style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: "#EBF3FF", color: "#004299", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagos detallados */}
      <div className="ios-card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 14px" }}>
          Pagos de la semana — {pagosFiltrados.length} registros
        </h2>
        <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--ios-sep-opaque)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Fecha", "Cliente", "Monto", "Método", "Cuota", "Saldo restante", ""].map((h, i) => (
                  <th key={h || i} style={{ padding: "10px 14px", background: "var(--ios-fill)", borderBottom: "1px solid var(--ios-sep-opaque)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-sec)", textAlign: i >= 2 && i < 6 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagosPaginados.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--ios-label-ter)", fontSize: "14px" }}>No hay pagos en esta semana.</td></tr>
              ) : pagosPaginados.map(p => {
                const credito = creditos.find(cr => cr.id === p.creditId);
                const cliente = clientes.find(c => c.id === credito?.clientId);
                const historial = pagosOrdenadosPorCredito.get(p.creditId) || [];
                const posicion = historial.findIndex(item => item.id === p.id);
                const pagadoHasta = historial.slice(0, posicion + 1).reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
                const totalPlan = calcularMontoPlan(credito);
                const restante = Math.max(0, totalPlan - pagadoHasta);
                const cuota = credito?.totalInstallments ? Math.min(posicion + 1, credito.totalInstallments) : posicion + 1;
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--ios-sep-opaque)", transition: "background 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 14px", fontSize: "14px", color: "var(--ios-label-sec)" }}>{new Date(p.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 600, color: "var(--ios-label)" }}>{cliente?.name || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 700, color: "#1A6B36", textAlign: "right" }}>{currency(p.amount)}</td>
                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "var(--ios-label-sec)", textAlign: "right" }}>{p.methodSummary || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "var(--ios-label-sec)", textAlign: "right" }}>{cuota}{credito?.totalInstallments ? ` / ${credito.totalInstallments}` : ""}</td>
                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "var(--ios-label-sec)", textAlign: "right" }}>{currency(restante)}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <button onClick={() => navigate(`/creditos/${credito?.id}`)} style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: "#EBF3FF", color: "#004299", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Ver crédito</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación simple */}
        {totalPaginas > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "14px" }}>
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
              style={{ padding: "6px 14px", borderRadius: "8px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", color: pagina === 1 ? "var(--ios-label-ter)" : "var(--ios-label)", fontSize: "13px", fontWeight: 600, cursor: pagina === 1 ? "not-allowed" : "pointer" }}>
              Anterior
            </button>
            <span style={{ fontSize: "13px", color: "var(--ios-label-sec)" }}>Pág {pagina} de {totalPaginas}</span>
            <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
              style={{ padding: "6px 14px", borderRadius: "8px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", color: pagina === totalPaginas ? "var(--ios-label-ter)" : "var(--ios-label)", fontSize: "13px", fontWeight: 600, cursor: pagina === totalPaginas ? "not-allowed" : "pointer" }}>
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
