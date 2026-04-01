// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { HiPencilAlt, HiEye, HiUserAdd, HiUserRemove, HiPlus, HiSearch } from "react-icons/hi";
import { loadClients, removeClient, saveClient } from "../store/clientsSlice";
import Pagination from "../components/Pagination";
import { useDialog } from "../components/DialogProvider";

const reliabilityOptions = [
  { label: "Todas", value: "todas" },
  { label: "Media", value: "MEDIA" },
  { label: "Baja", value: "BAJA" },
  { label: "Moroso", value: "MOROSO" },
];

const statusOptions = [
  { label: "Todos", value: "todos" },
  { label: "Alta", value: "ACTIVE" },
  { label: "Baja", value: "INACTIVE" },
];

const CONFIANZA_CONFIG = {
  MUYALTA: { label: "Muy alta", bg: "#E8F8ED", color: "#1A6B36" },
  ALTA: { label: "Alta", bg: "#E8F8ED", color: "#1A6B36" },
  MEDIA: { label: "Media", bg: "#EBF3FF", color: "#004299" },
  BAJA: { label: "Baja", bg: "#FFF8E1", color: "#B26A00" },
  MOROSO: { label: "Moroso", bg: "#FFEBEA", color: "#8B0000" }
};

const inputStyle = {
  height: "40px", padding: "0 12px", borderRadius: "10px",
  border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)",
  fontSize: "14px", color: "var(--ios-label)", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s",
  WebkitAppearance: "none", appearance: "none", width: "100%",
};
const onFocus = e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; e.target.style.background = "#fff"; };
const onBlur = e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--ios-fill)"; };

export default function Clientes() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list, loading, meta } = useSelector(state => state.clients) || { list: [], loading: false, meta: {} };

  const { confirm } = useDialog();

  const [q, setQ] = useState("");
  const [activo, setActivo] = useState("todos");
  const [confianza, setConfianza] = useState("todas");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { setPage(meta?.page ?? 1); setPageSize(meta?.pageSize ?? 10); }, [meta?.page, meta?.pageSize]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = { page, pageSize };
      if (q.trim()) params.q = q.trim();
      if (confianza !== "todas") params.reliability = [confianza];
      const statusValue = (activo || "").toUpperCase();
      if (statusValue === "ACTIVE" || statusValue === "INACTIVE") {
        params.status = statusValue;
      }
      // Si es "todos", no agregar el filtro status
      dispatch(loadClients(params));
    }, 200);
    return () => clearTimeout(timeout);
  }, [dispatch, page, pageSize, q, confianza, activo]);

  useEffect(() => { setPage(1); }, [q, activo, confianza]);

  // rows = list directamente del store (ya filtrado por API)
  const rows = useMemo(() => list, [list]);

  const handleDeleteClient = async (id) => {
    const ok = await confirm("¿Seguro que deseas dar de baja a este cliente?", {
      title: "Baja",
      confirmText: "Baja",
      cancelText: "Cancelar",
      destructive: true,
    });
    if (!ok) return;
    try {
      await dispatch(removeClient(id)).unwrap();
      toast.success("Cliente dado de baja");
      dispatch(loadClients({ page, pageSize }));
    } catch (error) {
      const msg = typeof error === "string" ? error : error?.message || "No se pudo dar de baja al cliente";
      toast.error(msg);
    }
  };

  // Activar cliente dado de baja
  const handleActivateClient = async (id) => {
    const ok = await confirm("¿Seguro que deseas dar de alta a este cliente?", {
      title: "Dar de alta",
      confirmText: "Dar de alta",
      cancelText: "Cancelar",
      destructive: false,
    });
    if (!ok) return;
    try {
      await dispatch(saveClient({ id, payload: { status: "ACTIVE" } })).unwrap();
      toast.success("Cliente dado de alta");
      dispatch(loadClients({ page, pageSize }));
    } catch (error) {
      const msg = typeof error === "string" ? error : error?.message || "No se pudo dar de alta al cliente";
      toast.error(msg);
    }
  };

  // Dar de baja cliente (cambio de status a INACTIVE)
  const handleDeactivateClient = async (id) => {
    const ok = await confirm("¿Seguro que deseas dar de baja a este cliente?", {
      title: "Dar de baja",
      confirmText: "Dar de baja",
      cancelText: "Cancelar",
      destructive: true,
    });
    if (!ok) return;
    try {
      await dispatch(saveClient({ id, payload: { status: "INACTIVE" } })).unwrap();
      toast.success("Cliente dado de baja");
      dispatch(loadClients({ page, pageSize }));
    } catch (error) {
      const msg = typeof error === "string" ? error : error?.message || "No se pudo dar de baja al cliente";
      toast.error(msg);
    }
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setQ("");
    setActivo("todos");
    setConfianza("todas");
    setPage(1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.025em" }}>Clientes</h1>
          <p style={{ fontSize: "14px", color: "var(--ios-label-sec)", margin: "4px 0 0" }}>{meta?.totalItems ?? list.length} registros</p>
        </div>
        <button
          onClick={() => navigate("/clientes/nuevo")}
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
          Agregar cliente
        </button>
      </div>

      {/* Filtros */}
      <div className="ios-card" style={{ padding: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: "180px" }}>
          <HiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--ios-label-ter)", pointerEvents: "none" }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre, teléfono o documento..."
            style={{ ...inputStyle, paddingLeft: "38px" }}
            onFocus={onFocus} onBlur={onBlur}
          />
        </div>

        <div style={{ flex: "0 0 auto" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ios-label-ter)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>Estado</label>
          <select value={activo} onChange={e => { setActivo(e.target.value); }} style={{ ...inputStyle, width: "auto", minWidth: "120px" }} onFocus={onFocus} onBlur={onBlur}>
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div style={{ flex: "0 0 auto" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ios-label-ter)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>Confianza</label>
          <select value={confianza} onChange={e => setConfianza(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: "130px" }} onFocus={onFocus} onBlur={onBlur}>
            {reliabilityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={handleClearFilters}
          style={{ height: "40px", padding: "0 18px", borderRadius: "10px", border: "none", background: "#E5E5EA", color: "#333", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
        >
          Limpiar filtros
        </button>
      </div>

      {/* ═══ MOBILE: Cards ═══ */}
      <div className="sm:hidden flex flex-col gap-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "140px", borderRadius: "16px", marginBottom: "16px" }} />)
        ) : rows.length === 0 ? (
          <EmptyState onCreate={() => navigate("/clientes/nuevo")} />
        ) : rows.map(c => {
          const status = (c.status || "ACTIVE").toUpperCase();
          const isActive = status === "ACTIVE";
          return (
            <div key={c.id} className="ios-card mb-4" style={{ padding: "16px" }}>
              {/* Top */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <Avatar name={c.name} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--ios-label)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                    <p style={{ fontSize: "12px", color: "var(--ios-label-ter)", margin: "2px 0 0" }}>{c.phone || "—"}</p>
                  </div>
                </div>
                <ConfianzaPill reliability={c.reliability} />
              </div>
              {/* Acciones */}
              <div style={{ display: "flex", gap: "8px" }}>
                <MobileBtn color="#007AFF" bg="#EBF3FF" hoverBg="#C8E0FF" onClick={() => navigate(`/clientes/${c.id}`)}>
                  <HiEye style={{ width: "15px", height: "15px" }} /> Ver
                </MobileBtn>
                <MobileBtn color="#636366" bg="var(--ios-fill)" hoverBg="#E5E5EA" onClick={() => navigate(`/clientes/${c.id}/editar`)}>
                  <HiPencilAlt style={{ width: "15px", height: "15px" }} /> Editar
                </MobileBtn>
                <MobileBtn
                  color={isActive ? "#FF3B30" : "#34C759"}
                  bg={isActive ? "#FFEBEA" : "#E8F8ED"}
                  hoverBg={isActive ? "#FFCCC9" : "#B8F0CC"}
                  onClick={() => isActive ? handleDeactivateClient(c.id) : handleActivateClient(c.id)}
                >
                  {isActive ? <HiUserRemove style={{ width: "15px", height: "15px" }} /> : <HiUserAdd style={{ width: "15px", height: "15px" }} />}
                  {isActive ? "Dar de baja" : "Activar"}
                </MobileBtn>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ DESKTOP: Tabla ═══ */}
      <div className="hidden sm:block" style={{ background: "var(--ios-bg-card)", borderRadius: "16px", boxShadow: "var(--ios-shadow-sm)", overflow: "hidden" }}>
        <table className="ios-table" style={{ borderRadius: 0 }}>
          <thead>
            <tr>
              {["Nombre", "Teléfono", "Confianza", "Acciones"].map((h, i) => (
                <th key={h} style={{ textAlign: i === 3 ? "right" : "left", padding: "12px 16px", background: "var(--ios-fill)", borderBottom: "1px solid var(--ios-sep-opaque)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-sec)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center" }}>
                <div className="skeleton" style={{ height: "18px", width: "200px", margin: "0 auto", borderRadius: "6px" }} />
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: "48px", textAlign: "center", color: "var(--ios-label-ter)" }}>
                No hay clientes con esos filtros.
              </td></tr>
            ) : rows.map(c => {
              const status = (c.status || "ACTIVE").toUpperCase();
              const isActive = status === "ACTIVE";
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--ios-sep-opaque)", transition: "background 0.12s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "14px 16px", textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Avatar name={c.name} />
                      <span style={{ fontWeight: 600, color: "var(--ios-label)" }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "left" }}>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--ios-label)", margin: 0 }}>{c.phone || "—"}</p>
                    {c.alternatePhone && <p style={{ fontSize: "12px", color: "var(--ios-label-ter)", margin: "2px 0 0" }}>Alt: {c.alternatePhone}</p>}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "left" }}>
                    <ConfianzaPill reliability={c.reliability} />
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <ActionBtn color="#004299" bg="#EBF3FF" hoverBg="#C8E0FF" icon={<HiEye style={{ width: "14px", height: "14px" }} />} label="Ver" onClick={() => navigate(`/clientes/${c.id}`)} />
                      <ActionBtn color="#3A3A3C" bg="var(--ios-fill)" hoverBg="#E5E5EA" icon={<HiPencilAlt style={{ width: "14px", height: "14px" }} />} label="Editar" onClick={() => navigate(`/clientes/${c.id}/editar`)} />
                      <ActionBtn
                        color={isActive ? "#8B0000" : "#1A6B36"}
                        bg={isActive ? "#FFEBEA" : "#E8F8ED"}
                        hoverBg={isActive ? "#FFCCC9" : "#B8F0CC"}
                        icon={isActive ? <HiUserRemove style={{ width: "14px", height: "14px" }} /> : <HiUserAdd style={{ width: "14px", height: "14px" }} />}
                        label={isActive ? "Baja" : "Activar"}
                        onClick={() => isActive ? handleDeactivateClient(c.id) : handleActivateClient(c.id)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={meta?.page ?? page} pageSize={meta?.pageSize ?? pageSize}
        totalItems={meta?.totalItems ?? rows.length}
        totalPages={meta?.totalPages ?? 1}
        onPageChange={setPage}
        onPageSizeChange={size => { setPageSize(size); setPage(1); }}
      />
    </div>
  );
}

function ActionBtn({ onClick, color, bg, hoverBg, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", padding: "6px 0", borderRadius: "8px", border: "none", background: bg, color, fontSize: "12px", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap", minWidth: "88px", height: "30px" }}
      onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {icon} {label}
    </button>
  );
}

function MobileBtn({ children, color, bg, hoverBg, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", padding: "9px 8px", borderRadius: "10px", border: "none", background: bg, color, fontSize: "12px", fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background = hoverBg}
      onMouseLeave={e => e.currentTarget.style.background = bg}
    >
      {children}
    </button>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--ios-bg-card)", borderRadius: "16px", boxShadow: "var(--ios-shadow-sm)" }}>
      <p style={{ fontSize: "40px", margin: "0 0 12px" }}>👥</p>
      <p style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 8px" }}>Sin clientes</p>
      <p style={{ fontSize: "14px", color: "var(--ios-label-ter)", margin: "0 0 20px" }}>No hay clientes con esos filtros.</p>
      <button onClick={onCreate} style={{ padding: "11px 22px", borderRadius: "12px", background: "var(--ios-blue)", color: "#fff", border: "none", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
        Agregar cliente
      </button>
    </div>
  );
}

function ConfianzaPill({ reliability }) {
  const key = (reliability || "").toUpperCase();
  const cfg = CONFIANZA_CONFIG[key] || { label: key || "—", bg: "var(--ios-fill)", color: "var(--ios-label-sec)" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "4px 10px", borderRadius: "99px", background: cfg.bg, color: cfg.color, fontSize: "12px", fontWeight: 700, minWidth: "80px", whiteSpace: "nowrap" }}>
      {cfg.label}
    </span>
  );
}

function Avatar({ name }) {
  const initials = name ? name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() : "?";
  return (
    <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg, #007AFF22, #007AFF40)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#007AFF", flexShrink: 0, border: "1.5px solid #007AFF30" }}>
      {initials}
    </div>
  );
}
