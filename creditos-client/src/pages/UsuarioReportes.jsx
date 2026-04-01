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
    navigate(`/reportes/${reportId}`);
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
    <div style={{ 
      maxWidth: "1000px", 
      margin: "0 auto", 
      width: "100%",
      display: "flex", 
      flexDirection: "column", 
      gap: "24px",
      padding: "8px 0"
    }} className="animate-fade-in">

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

      {/* KPIs */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "16px" 
      }}>
        {[
          { label: "Cobrado semana", value: currency(resumenSemana.cobrado), icon: HiCash, color: "#1A6B36", bg: "rgba(52,199,89,0.1)" },
          { label: "Sin pago", value: resumenSemana.creditosSinPago, icon: HiUserGroup, color: "#7C4A00", bg: "rgba(255,149,0,0.1)" },
          { label: "Pendiente total", value: currency(resumenSemana.pendiente), icon: HiClock, color: "#5C2B8C", bg: "rgba(175,82,222,0.1)" },
        ].map(k => (
          <div key={k.label} className="ios-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ 
              width: "48px", height: "48px", borderRadius: "14px", 
              background: k.bg, display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0
            }}>
              <k.icon style={{ width: "22px", height: "22px", color: k.color }} />
            </div>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", margin: "0 0 4px" }}>{k.label}</p>
              <p style={{ fontSize: "20px", fontWeight: 800, color: "var(--ios-label)", margin: 0 }}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Calendario Actividad (Principal) */}
      <div className="ios-card" style={{ padding: "0", overflow: "hidden" }}>
        <ReportActivityCalendar reports={reportes} title={`Actividad de ${usuario.name}`} onReportClick={report => openReportDetail(report.id)} />
      </div>
    </div>
  );
}
