import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { HiPlus, HiEye, HiSearch, HiBan } from "react-icons/hi";
import { loadCredits } from "../store/creditsSlice";
import Pagination from "../components/Pagination";

const CREDIT_TYPE_OPTIONS = [
  { value: "todos",     label: "Todos"      },
  { value: "ONE_TIME",  label: "Pago único"  },
  { value: "DAILY",     label: "Diario"      },
  { value: "WEEKLY",    label: "Semanal"     },
  { value: "QUINCENAL", label: "Quincenal"   },
  { value: "MONTHLY",   label: "Mensual"     },
];

/* ── Estado → config visual iOS ── */
const ESTADO_CONFIG = {
  PENDING:  { label: "Pendiente", bg: "#FFF3E0", color: "#7C4A00", dot: "#FF9500" },
  PAID:     { label: "Pagado",    bg: "#E8F8ED", color: "#1A6B36", dot: "#34C759" },
  CANCELED: { label: "Cancelado", bg: "#EBF3FF", color: "#004299", dot: "#007AFF" },
  OVERDUE:  { label: "Vencido",   bg: "#FFEBEA", color: "#8B0000", dot: "#FF3B30" },
};

function EstadoPill({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.PENDING;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: "4px 10px", borderRadius: "99px",
      background: cfg.bg, color: cfg.color,
      fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap",
      minWidth: "90px",
    }}>
      {cfg.label}
    </span>
  );
}

function Progress({ value }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ height: "5px", width: "80px", background: "#E5E5EA", borderRadius: "99px", overflow: "hidden", flexShrink: 0 }}>
      <div style={{
        height: "100%", width: `${pct}%`,
        background: pct === 100 ? "#34C759" : "#007AFF",
        borderRadius: "99px", transition: "width 0.3s",
      }} />
    </div>
  );
}

const inputStyle = {
  height: "40px", padding: "0 12px", borderRadius: "10px",
  border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)",
  fontSize: "14px", color: "var(--ios-label)", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s",
  WebkitAppearance: "none", appearance: "none", width: "100%",
};

const onFocus = e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; e.target.style.background = "#fff"; };
const onBlur  = e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--ios-fill)"; };

export default function Creditos() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list: creditos, loading, meta } = useSelector(state => state.credits) || { list: [], loading: false, meta: {} };

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { setPage(meta?.page ?? 1); }, [meta?.page]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = { page, pageSize };
      if (q.trim()) params.q = q.trim();
      if (estado !== "todos") params.status = estado;
      if (tipo !== "todos") params.type = tipo;
      dispatch(loadCredits(params));
    }, 200);
    return () => clearTimeout(timeout);
  }, [dispatch, page, pageSize, q, estado, tipo]);

  useEffect(() => { setPage(1); }, [q, estado, tipo]);

  const rows = useMemo(() =>
    creditos.map((cr, index) => {
      const monto = Number(cr.amount) || 0;
      const totalInstallments = Number(cr.totalInstallments || 0);
      const paidInstallments = Number(cr.paidInstallments || 0);
      const isClosed = String(cr.status || "").toUpperCase() === "PAID";
      const installmentAmount = Number(cr.installmentAmount || 0);
      const targetTotal = totalInstallments > 0 && installmentAmount > 0 ? installmentAmount * totalInstallments : monto;
      const receivedAmount = Number(cr.receivedAmount || 0);
      const isCanceled = isClosed && ((totalInstallments > 0 && paidInstallments < totalInstallments) || (targetTotal > 0 && receivedAmount < targetTotal));
      const shownPaidInstallments = isClosed && totalInstallments > 0 ? totalInstallments : paidInstallments;
      const safeTotal = totalInstallments > 0 ? totalInstallments : 1;
      const progress = isClosed ? 100 : Math.min(100, Math.max(0, (shownPaidInstallments / safeTotal) * 100));
      const key = cr.id || `temp-${cr.clientId || ""}-${cr.startDate || index}`;
      return {
        id: cr.id, key,
        cliente: cr.client?.name || "Cliente desconocido",
        monto, cuotas: totalInstallments,
        pagadas: shownPaidInstallments,
        estado: cr.status,
        estadoVisual: isCanceled ? "CANCELED" : cr.status,
        fechaInicio: cr.startDate,
        progress,
        progressLabel: `${shownPaidInstallments}/${totalInstallments || 0}`,
      };
    }),
    [creditos]
  );

  const canCancel = cr => cr.estado !== "PAID";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.025em" }}>Créditos</h1>
          <p style={{ fontSize: "14px", color: "var(--ios-label-sec)", margin: "4px 0 0" }}>{meta?.totalItems ?? creditos.length} registros</p>
        </div>
        <button
          onClick={() => navigate("/creditos/nuevo")}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "11px 18px", borderRadius: "12px", border: "none",
            background: "var(--ios-blue)", color: "#fff",
            fontSize: "15px", fontWeight: 700, cursor: "pointer",
            transition: "all 0.18s", boxShadow: "0 4px 12px rgba(0,122,255,0.3)",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--ios-blue-dark)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--ios-blue)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <HiPlus style={{ width: "18px", height: "18px" }} />
          Nuevo crédito
        </button>
      </div>

      {/* Filtros */}
      <div className="ios-card" style={{ padding: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: "180px" }}>
          <HiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--ios-label-ter)", pointerEvents: "none" }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar cliente, documento..."
            style={{ ...inputStyle, paddingLeft: "38px" }}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>

        {/* Estado */}
        <div style={{ flex: "0 0 auto" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ios-label-ter)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>Estado</label>
          <select value={estado} onChange={e => setEstado(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: "130px" }} onFocus={onFocus} onBlur={onBlur}>
            <option value="todos">Todos</option>
            <option value="PENDING">Pendiente</option>
            <option value="PAID">Pagado</option>
            <option value="OVERDUE">Vencido</option>
          </select>
        </div>

        {/* Tipo */}
        <div style={{ flex: "0 0 auto" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ios-label-ter)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: "130px" }} onFocus={onFocus} onBlur={onBlur}>
            {CREDIT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* ═══ MOBILE: Cards ═══ */}
      <div className="sm:hidden" style={{ flexDirection: "column", gap: "10px" }}>
        {loading ? (
          [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "160px", borderRadius: "16px" }} />)
        ) : rows.length === 0 ? (
          <EmptyState onCreate={() => navigate("/creditos/nuevo")} />
        ) : (
          rows.map(c => (
            <CreditoCard
              key={c.key} data={c}
              onView={() => navigate(`/creditos/${c.id}`)}
              onCancel={() => navigate(`/creditos/${c.id}/cancelar`)}
              canCancel={canCancel(c)}
            />
          ))
        )}
      </div>

      {/* ═══ DESKTOP: Tabla iOS ═══ */}
      <div className="hidden sm:block" style={{ background: "var(--ios-bg-card)", borderRadius: "16px", boxShadow: "var(--ios-shadow-sm)", overflow: "hidden" }}>
        <table className="ios-table" style={{ borderRadius: 0 }}>
          <thead>
            <tr>
              {["Cliente", "Monto", "Cuotas", "Progreso", "Estado", "Acciones"].map((h, i) => (
                <th key={h} style={{ textAlign: i === 5 ? "right" : "left", padding: "12px 16px", background: "var(--ios-fill)", borderBottom: "1px solid var(--ios-sep-opaque)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-sec)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center" }}>
                <div className="skeleton" style={{ height: "18px", width: "200px", margin: "0 auto", borderRadius: "6px" }} />
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "var(--ios-label-ter)", fontSize: "15px" }}>
                No se encontraron créditos.
              </td></tr>
            ) : rows.map((c) => (
              <tr key={c.key} style={{ borderBottom: "1px solid var(--ios-sep-opaque)", transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--ios-label)", textAlign: "left" }}>{c.cliente}</td>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--ios-label)", textAlign: "left" }}>
                  ${c.monto.toLocaleString("es-AR")}
                </td>
                <td style={{ padding: "14px 16px", color: "var(--ios-label-sec)", textAlign: "left" }}>{c.cuotas}</td>
                <td style={{ padding: "14px 16px", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ios-label-sec)" }}>{c.progressLabel}</span>
                    <Progress value={c.progress} />
                  </div>
                </td>
                <td style={{ padding: "14px 16px", textAlign: "left" }}>
                  <EstadoPill estado={c.estadoVisual || c.estado} />
                </td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <ActionBtn onClick={() => navigate(`/creditos/${c.id}`)} color="#004299" icon={<HiEye style={{ width: "14px", height: "14px" }} />} label="Ver" />
                    {canCancel(c)
                      ? <ActionBtn onClick={() => navigate(`/creditos/${c.id}/cancelar`)} color="#8B0000" icon={<HiBan style={{ width: "14px", height: "14px" }} />} label="Cancelar" />
                      : <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "88px", height: "30px", padding: "0", borderRadius: "8px", background: "#E8F8ED", color: "#1A6B36", fontSize: "12px", fontWeight: 700 }}>✓ Cerrado</span>
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page} pageSize={pageSize}
        totalItems={meta?.totalItems ?? creditos.length}
        totalPages={meta?.totalPages ?? 1}
        onPageChange={setPage}
        onPageSizeChange={size => { setPageSize(size); setPage(1); }}
      />
    </div>
  );
}

/* ── Botón de acción en tabla ── */
function ActionBtn({ onClick, color, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px",
        padding: "6px 0", borderRadius: "8px", border: "none",
        background: `${color}18`, color,
        fontSize: "12px", fontWeight: 700,
        cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
        minWidth: "88px", height: "30px",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}28`; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {icon}
      {label}
    </button>
  );
}

/* ── Card mobile de crédito ── */
function CreditoCard({ data, onView, onCancel, canCancel }) {
  return (
    <div
      className="ios-card"
      style={{ padding: "16px" }}
    >
      {/* Top */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px", gap: "8px" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data.cliente}
          </p>
          {data.fechaInicio && (
            <p style={{ fontSize: "12px", color: "var(--ios-label-ter)", margin: 0 }}>Inicio: {data.fechaInicio}</p>
          )}
        </div>
        <EstadoPill estado={data.estadoVisual || data.estado} />
      </div>

      {/* Info grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
        <InfoCell label="Monto" value={`$${data.monto.toLocaleString("es-AR")}`} />
        <InfoCell label="Cuotas" value={data.cuotas} />
      </div>

      {/* Progreso */}
      <div style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-ter)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Progreso</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ios-label-sec)" }}>{data.progressLabel}</span>
        </div>
        <div style={{ height: "5px", background: "#E5E5EA", borderRadius: "99px", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${data.progress}%`,
            background: data.progress === 100 ? "#34C759" : "#007AFF",
            borderRadius: "99px", transition: "width 0.3s",
          }} />
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={onView}
          style={{ flex: 1, padding: "11px", borderRadius: "12px", border: "none", background: "#EBF3FF", color: "#007AFF", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#C8E0FF"}
          onMouseLeave={e => e.currentTarget.style.background = "#EBF3FF"}
        >
          <HiEye style={{ width: "16px", height: "16px" }} /> Ver
        </button>
        {canCancel ? (
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "11px", borderRadius: "12px", border: "none", background: "#FFEBEA", color: "#FF3B30", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#FFCCC9"}
            onMouseLeave={e => e.currentTarget.style.background = "#FFEBEA"}
          >
            <HiBan style={{ width: "16px", height: "16px" }} /> Cancelar
          </button>
        ) : (
          <span style={{ flex: 1, padding: "11px", borderRadius: "12px", background: "#E8F8ED", color: "#34C759", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            Cancelado
          </span>
        )}
      </div>
    </div>
  );
}

function InfoCell({ label, value }) {
  return (
    <div style={{ background: "var(--ios-fill)", borderRadius: "10px", padding: "10px 12px" }}>
      <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ios-label-ter)", margin: "0 0 3px" }}>{label}</p>
      <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--ios-label)", margin: 0 }}>{value}</p>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--ios-bg-card)", borderRadius: "16px", boxShadow: "var(--ios-shadow-sm)" }}>
      <p style={{ fontSize: "40px", margin: "0 0 12px" }}>💳</p>
      <p style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 8px" }}>Sin créditos</p>
      <p style={{ fontSize: "14px", color: "var(--ios-label-ter)", margin: "0 0 20px" }}>No se encontraron créditos con esos filtros.</p>
      <button
        onClick={onCreate}
        style={{ padding: "11px 22px", borderRadius: "12px", background: "var(--ios-blue)", color: "#fff", border: "none", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}
      >
        Crear nuevo crédito
      </button>
    </div>
  );
}
