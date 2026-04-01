import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HiArrowLeft, HiPencilAlt } from "react-icons/hi";
import { fetchClient } from "../services/clientsService";
import { fetchCredits } from "../services/creditsService";
import { fetchAssignments } from "../services/assignmentsService";

const CREDIT_TYPE_LABELS = {
  DAILY: "Diario", WEEKLY: "Semanal", QUINCENAL: "Quincenal",
  MONTHLY: "Mensual", ONE_TIME: "Único",
};

const ESTADO_CONFIG = {
  PENDING:  { label: "Pendiente", bg: "#FFF3E0", color: "#FF9500" },
  PAID:     { label: "Pagado",    bg: "#E8F8ED", color: "#34C759" },
  CANCELED: { label: "Cancelado",bg: "#EBF3FF", color: "#007AFF" },
  OVERDUE:  { label: "Vencido",  bg: "#FFEBEA", color: "#FF3B30" },
};

const CONFIANZA_CONFIG = {
  MUYALTA: { label: "Muy alta", bg: "#E8F8ED", color: "#34C759" },
  ALTA:    { label: "Alta",     bg: "#E8F8ED", color: "#34C759" },
  MEDIA:   { label: "Media",   bg: "#EBF3FF", color: "#007AFF" },
  BAJA:    { label: "Baja",    bg: "#FFF3E0", color: "#FF9500" },
  MOROSO:  { label: "Moroso",  bg: "#FFEBEA", color: "#FF3B30" },
};

function Pill({ bg, color, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "99px", background: bg, color, fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function EstadoPill({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.PENDING;
  return <Pill {...cfg} />;
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--ios-sep-opaque)" }}>
      <span style={{ fontSize: "14px", color: "var(--ios-label-sec)", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: "14px", color: "var(--ios-label)", fontWeight: 600, textAlign: "right", maxWidth: "55%" }}>{value}</span>
    </div>
  );
}

const formatCurrency = v => Number(v || 0).toLocaleString("es-AR");

function Progress({ value }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ height: "5px", width: "70px", background: "#E5E5EA", borderRadius: "99px", overflow: "hidden", flexShrink: 0 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#34C759" : "#007AFF", borderRadius: "99px" }} />
    </div>
  );
}

function formatNextVisitDate(credit, assignmentsByCollector = {}) {
  const assignment = credit?.userId ? assignmentsByCollector?.[credit.userId] : null;
  const d = assignment?.nextVisitDate ? new Date(assignment.nextVisitDate) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("es-AR") : "—";
}

function formatNextInstallmentLabel(credit) {
  const n = Number(credit?.nextInstallmentToCharge || 0);
  const total = Number(credit?.totalInstallments || 0);
  if (n <= 0) return "Sin próxima cuota";
  return total > 0 ? `Cuota ${n} de ${total}` : `Cuota ${n}`;
}

export default function ClienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [creditos, setCreditos] = useState([]);
  const [assignmentsByCollector, setAssignmentsByCollector] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError(null);
      try {
        const [cliRes, crRes, asgRes] = await Promise.all([
          fetchClient(id),
          fetchCredits({ page: 1, pageSize: 200, clientId: id }),
          fetchAssignments({ page: 1, pageSize: 500 }),
        ]);
        if (!active) return;
        setCliente(cliRes.data ?? null);
        const contratos = Array.isArray(crRes.data?.data) ? crRes.data.data.filter(c => c.clientId === id) : [];
        setCreditos(contratos);
        const asgArr = Array.isArray(asgRes.data?.data) ? asgRes.data.data.filter(a => a?.clienteId === id) : [];
        setAssignmentsByCollector(asgArr.reduce((acc, a) => { if (a?.cobradorId) acc[a.cobradorId] = a; return acc; }, {}));
      } catch { if (!active) return; setError("No se pudo cargar la información del cliente."); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, [id]);

  const creditosOrdenados = useMemo(() =>
    [...creditos].sort((a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0)),
    [creditos]
  );

  const handleBack = () => window.history.length > 2 ? navigate(-1) : navigate("/clientes");

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "120px", borderRadius: "16px" }} />)}
    </div>
  );

  if (error || !cliente) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <p style={{ color: "var(--ios-red)", fontSize: "16px", marginBottom: "16px" }}>{error || "Cliente no encontrado."}</p>
      <button onClick={handleBack} style={{ padding: "11px 22px", borderRadius: "12px", background: "var(--ios-fill)", border: "none", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>Volver</button>
    </div>
  );

  const reliability = (cliente.reliability || "").toUpperCase();
  const confianzaCfg = CONFIANZA_CONFIG[reliability] || CONFIANZA_CONFIG.MEDIA;
  const status = (cliente.status || "ACTIVE").toUpperCase();
  const isActive = status === "ACTIVE";
  const birthDateLabel = cliente.birthDate ? new Date(cliente.birthDate).toLocaleDateString("es-AR") : null;
  const initials = cliente.name?.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={handleBack}
          style={{ width: "40px", height: "40px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-bg-card)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <HiArrowLeft style={{ width: "18px", height: "18px", color: "var(--ios-label-sec)" }} />
        </button>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ios-label-sec)", margin: 0 }}>Clientes</p>
        <span style={{ color: "var(--ios-label-ter)" }}>›</span>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ios-label)", margin: 0 }}>{cliente.name}</p>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => navigate(`/clientes/${cliente.id}/editar`)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-bg-card)", fontSize: "14px", fontWeight: 700, color: "var(--ios-blue)", cursor: "pointer", transition: "all 0.15s" }}
          >
            <HiPencilAlt style={{ width: "16px", height: "16px" }} /> Editar
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div className="ios-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Banner azul */}
        <div style={{ background: "linear-gradient(135deg, #007AFF, #32ADE6)", padding: "24px 20px 36px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 900, color: "#fff", flexShrink: 0, backdropFilter: "blur(8px)", border: "2px solid rgba(255,255,255,0.25)" }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{cliente.name}</h1>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", margin: "4px 0 0" }}>
                {cliente.phone}{cliente.alternatePhone ? ` · Alt: ${cliente.alternatePhone}` : ""}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                <Pill bg="rgba(255,255,255,0.18)" color="#fff" label={confianzaCfg.label} />
                <Pill bg={isActive ? "rgba(52,199,89,0.25)" : "rgba(174,174,178,0.25)"} color="#fff" label={isActive ? "Activo" : "Inactivo"} />
              </div>
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div style={{ marginTop: "-16px", background: "var(--ios-bg-card)", borderRadius: "16px 16px 0 0", paddingTop: "4px" }}>
          <InfoRow label="DNI / Documento" value={cliente.document} />
          <InfoRow label="Email" value={cliente.email} />
          <InfoRow label="Dirección" value={[cliente.address, cliente.city, cliente.province].filter(Boolean).join(", ")} />
          {birthDateLabel && <InfoRow label="Fecha de nacimiento" value={birthDateLabel} />}
          {cliente.notes && <InfoRow label="Notas" value={cliente.notes} />}
        </div>
      </div>

      {/* Créditos */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.02em" }}>
            Créditos <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--ios-label-ter)" }}>({creditosOrdenados.length})</span>
          </h2>
          <button
            onClick={() => navigate("/creditos/nuevo")}
            style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "9px 14px", borderRadius: "10px", border: "none", background: "var(--ios-blue)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,122,255,0.3)" }}
          >
            + Nuevo crédito
          </button>
        </div>

        {/* Mobile */}
        <div className="sm:hidden" style={{ flexDirection: "column", gap: "10px" }}>
          {creditosOrdenados.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", background: "var(--ios-bg-card)", borderRadius: "16px", boxShadow: "var(--ios-shadow-sm)", color: "var(--ios-label-ter)", fontSize: "14px" }}>
              Sin créditos para este cliente.
            </div>
          ) : creditosOrdenados.map(cr => {
            const total = Number(cr.totalInstallments || 0);
            const rawPaid = Number(cr.paidInstallments || 0);
            const paid = String(cr.status || "").toUpperCase() === "PAID" && total > 0 ? total : rawPaid;
            const progress = total > 0 ? (paid / total) * 100 : 0;
            return (
              <div key={cr.id} className="ios-card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--ios-label-ter)", margin: "0 0 3px" }}>{CREDIT_TYPE_LABELS[String(cr.type || "").toUpperCase()] || "—"}</p>
                    <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--ios-label)", margin: 0 }}>${formatCurrency(cr.amount)}</p>
                  </div>
                  <EstadoPill estado={(cr.status || "").toUpperCase()} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ios-label-sec)" }}>{paid}/{total} cuotas</span>
                  <Progress value={progress} />
                </div>
                <p style={{ fontSize: "12px", color: "var(--ios-label-ter)", margin: "0 0 12px" }}>
                  {formatNextInstallmentLabel(cr)} · Ruta: {formatNextVisitDate(cr, assignmentsByCollector)}
                </p>
                <button
                  onClick={() => navigate(`/creditos/${cr.id}`)}
                  style={{ width: "100%", padding: "11px", borderRadius: "12px", border: "none", background: "#EBF3FF", color: "#007AFF", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
                >
                  Ver crédito
                </button>
              </div>
            );
          })}
        </div>

        {/* Desktop */}
        <div className="hidden sm:block" style={{ background: "var(--ios-bg-card)", borderRadius: "16px", boxShadow: "var(--ios-shadow-sm)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Próximo cobro", "Tipo", "Monto", "Cuotas", "Progreso", "Estado", "Acción"].map((h, i) => (
                  <th key={h} style={{ padding: "11px 14px", background: "var(--ios-fill)", borderBottom: "1px solid var(--ios-sep-opaque)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-sec)", textAlign: i === 6 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {creditosOrdenados.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "var(--ios-label-ter)", fontSize: "14px" }}>Sin créditos para este cliente.</td></tr>
              ) : creditosOrdenados.map(cr => {
                const total = Number(cr.totalInstallments || 0);
                const rawPaid = Number(cr.paidInstallments || 0);
                const paid = String(cr.status || "").toUpperCase() === "PAID" && total > 0 ? total : rawPaid;
                const progress = total > 0 ? (paid / total) * 100 : 0;
                return (
                  <tr key={cr.id} style={{ borderBottom: "1px solid var(--ios-sep-opaque)", transition: "background 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 14px", textAlign: "left" }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ios-label)" }}>{formatNextVisitDate(cr, assignmentsByCollector)}</div>
                      <div style={{ fontSize: "11px", color: "var(--ios-label-ter)", marginTop: "2px" }}>{formatNextInstallmentLabel(cr)}</div>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "left", fontSize: "14px", color: "var(--ios-label-sec)" }}>{CREDIT_TYPE_LABELS[String(cr.type || "").toUpperCase()] || "—"}</td>
                    <td style={{ padding: "12px 14px", textAlign: "left", fontSize: "14px", fontWeight: 700, color: "var(--ios-label)" }}>${formatCurrency(cr.amount)}</td>
                    <td style={{ padding: "12px 14px", textAlign: "left", fontSize: "14px", color: "var(--ios-label-sec)" }}>{total}</td>
                    <td style={{ padding: "12px 14px", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ios-label-sec)" }}>{paid}/{total}</span>
                        <Progress value={progress} />
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "left" }}><EstadoPill estado={(cr.status || "").toUpperCase()} /></td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <button
                        onClick={() => navigate(`/creditos/${cr.id}`)}
                        style={{ padding: "7px 14px", borderRadius: "8px", border: "none", background: "#EBF3FF", color: "#007AFF", fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#C8E0FF"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#EBF3FF"; e.currentTarget.style.transform = "translateY(0)"; }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
