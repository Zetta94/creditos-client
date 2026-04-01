import { useMemo, useState, useEffect } from "react";
import { HiUsers, HiCurrencyDollar, HiExclamation, HiCash, HiArrowRight } from "react-icons/hi";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { fetchDashboardResumen } from "../services/dashboardService";
import { fetchMessages } from "../services/messagesService";
import MessageCard from "../components/messages/MessageCard";

const COLORS = ["#34C759", "#007AFF", "#FF9500", "#FF3B30"];

/* ── KPI Card iOS ── */
function KpiCard({ icon, label, value, color = "#007AFF" }) {
  return (
    <div
      className="ios-card animate-fade-in"
      style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <div style={{
        width: "44px",
        height: "44px",
        borderRadius: "14px",
        background: `${color}18`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: "13px", color: "var(--ios-label-sec)", margin: "0 0 4px", fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: "26px", fontWeight: 700, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
      </div>
    </div>
  );
}

/* ── Section header ── */
function SectionHeader({ title, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
      {children}
    </div>
  );
}

export default function HomeDashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState("Semana");
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchDashboardResumen()
      .then(res => { setResumen(res.data); setError(null); })
      .catch(() => setError("No se pudo cargar el resumen"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    setMessagesLoading(true);
    fetchMessages()
      .then(res => {
        if (!active) return;
        const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        setMessages(data.slice(0, 6));
        setMessagesError(null);
      })
      .catch(() => { if (!active) return; setMessagesError("No se pudieron cargar los mensajes."); })
      .finally(() => { if (!active) return; setMessagesLoading(false); });
    return () => { active = false; };
  }, []);

  const clientesPorConfianza = useMemo(() => resumen?.clientesPorConfianza ?? [], [resumen]);
  const totalClientes = useMemo(
    () => clientesPorConfianza.reduce((acc, c) => acc + Number(c.valor || 0), 0),
    [clientesPorConfianza]
  );
  const ingresosData = useMemo(() => {
    if (!resumen?.ingresos) return [];
    if (range === "Hoy") return resumen.ingresos.hoy ?? [];
    if (range === "Mes") return resumen.ingresos.mes ?? [];
    return resumen.ingresos.semana ?? [];
  }, [resumen, range]);

  if (loading) return (
    <div style={{ padding: "40px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px", marginBottom: "20px" }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: "120px", borderRadius: "16px" }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        {[1,2].map(i => <div key={i} className="skeleton" style={{ height: "300px", borderRadius: "16px" }} />)}
      </div>
    </div>
  );

  if (error) return (
    <div style={{ padding: "24px", background: "var(--ios-red-bg)", borderRadius: "16px", color: "var(--ios-red)", fontWeight: 600 }}>
      {error}
    </div>
  );

  if (!resumen) return null;

  const fmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">

      {/* ── Page header ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.025em" }}>Resumen</h1>
          <p style={{ fontSize: "14px", color: "var(--ios-label-sec)", margin: "4px 0 0" }}>Vista general del negocio</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate("/creditos/nuevo")}
            className="ios-btn ios-btn-primary"
            style={{ padding: "10px 16px", borderRadius: "12px", fontSize: "14px" }}
          >
            + Crédito
          </button>
          <button
            onClick={() => navigate("/clientes/nuevo")}
            className="ios-btn ios-btn-secondary"
            style={{ padding: "10px 16px", borderRadius: "12px", fontSize: "14px" }}
          >
            + Cliente
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
        <KpiCard
          icon={<HiCash style={{ width: "22px", height: "22px", color: "#34C759" }} />}
          label="Créditos activos"
          value={resumen.creditosActivos}
          color="#34C759"
        />
        <KpiCard
          icon={<HiCurrencyDollar style={{ width: "22px", height: "22px", color: "#007AFF" }} />}
          label="Pagos de hoy"
          value={fmt.format(resumen.pagosHoy ?? 0)}
          color="#007AFF"
        />
        <KpiCard
          icon={<HiUsers style={{ width: "22px", height: "22px", color: "#AF52DE" }} />}
          label="Usuarios activos"
          value={resumen.usuarios}
          color="#AF52DE"
        />
        <KpiCard
          icon={<HiExclamation style={{ width: "22px", height: "22px", color: "#FF3B30" }} />}
          label="Clientes deudores"
          value={resumen.clientesDeudores}
          color="#FF3B30"
        />
      </div>

      {/* ── Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>

        {/* Ingresos */}
        <div className="ios-card" style={{ padding: "20px" }}>
          <SectionHeader title="Ingresos">
            <div style={{ display: "flex", gap: "4px", background: "var(--ios-fill)", borderRadius: "10px", padding: "3px" }}>
              {["Hoy", "Semana", "Mes"].map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    background: range === r ? "#fff" : "transparent",
                    color: range === r ? "var(--ios-blue)" : "var(--ios-label-sec)",
                    boxShadow: range === r ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </SectionHeader>
          <div style={{ height: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ingresosData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F7" />
                <XAxis dataKey="fecha" stroke="#AEAEB2" tick={{ fontSize: 11 }} />
                <YAxis stroke="#AEAEB2" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #E5E5EA", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
                  labelStyle={{ color: "#1C1C1E", fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="monto" stroke="#007AFF" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución clientes */}
        <div className="ios-card" style={{ padding: "20px" }}>
          <SectionHeader title="Clientes" />
          <div style={{ height: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={clientesPorConfianza} dataKey="valor" nameKey="tipo" cx="50%" cy="50%" outerRadius={80}
                  label={({ tipo, valor }) => `${tipo}: ${totalClientes > 0 ? Math.round((Number(valor || 0) / totalClientes) * 100) : 0}%`}
                  labelLine={{ stroke: "#AEAEB2" }}
                >
                  {clientesPorConfianza.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #E5E5EA", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul style={{ display: "flex", flexWrap: "wrap", gap: "10px", margin: "12px 0 0", padding: 0, listStyle: "none" }}>
            {clientesPorConfianza.map((c, i) => (
              <li key={c.tipo} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--ios-label-sec)" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: COLORS[i % COLORS.length], flexShrink: 0, display: "inline-block" }} />
                {c.tipo} ({totalClientes > 0 ? Math.round((Number(c.valor || 0) / totalClientes) * 100) : 0}%)
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Detalle financiero CTA ── */}
      <div className="ios-card" style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 4px" }}>Detalle financiero</h2>
          <p style={{ fontSize: "14px", color: "var(--ios-label-sec)", margin: 0 }}>Explorá el detalle mensual y anual en la vista dedicada.</p>
        </div>
        <button
          onClick={() => navigate("/finanzas/detalle")}
          className="ios-btn ios-btn-primary"
          style={{ padding: "10px 16px", borderRadius: "12px", fontSize: "14px", flexShrink: 0 }}
        >
          <HiArrowRight style={{ width: "16px", height: "16px" }} />
          Ver
        </button>
      </div>

      {/* ── Mensajes ── */}
      <div className="ios-card" style={{ padding: "20px" }}>
        <SectionHeader title="Mensajes importantes" />
        {messagesLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "60px", borderRadius: "12px" }} />)}
          </div>
        ) : messagesError ? (
          <p style={{ color: "var(--ios-red)", fontSize: "14px" }}>{messagesError}</p>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ios-label-ter)" }}>
            <p style={{ fontSize: "32px", margin: "0 0 8px" }}>✉️</p>
            <p style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 4px", color: "var(--ios-label-sec)" }}>Sin mensajes urgentes</p>
            <p style={{ fontSize: "13px", margin: 0 }}>Todo está en orden</p>
          </div>
        ) : (
          <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px", margin: 0, padding: 0, listStyle: "none" }}>
            {messages.map(m => <li key={m.id}><MessageCard message={m} /></li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
