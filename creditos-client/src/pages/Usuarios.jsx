import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HiPlus, HiEye, HiSearch } from "react-icons/hi";
import { loadUsers } from "../store/employeeSlice";
import { loadCredits } from "../store/creditsSlice";
import Pagination from "../components/Pagination";

/* ── Badges iOS ── */
const ROL_CONFIG = {
  ADMIN:    { bg: "#F5EAFF", color: "#5C2B8C", label: "Admin"    },
  COBRADOR: { bg: "#FFF3E0", color: "#7C4A00", label: "Cobrador" },
  EMPLOYEE: { bg: "#FFF3E0", color: "#7C4A00", label: "Cobrador" },
};

const NIVEL_CONFIG = {
  EXCELENTE: { bg: "#E8F8ED", color: "#1A6B36", label: "Excelente" },
  ALTA:      { bg: "#FFF3E0", color: "#7C4A00", label: "Alta"      },
  BUENA:     { bg: "#EBF3FF", color: "#004299", label: "Buena"     },
  MEDIA:     { bg: "#EBF3FF", color: "#004299", label: "Media"     },
  MALA:      { bg: "#FFEBEA", color: "#8B0000", label: "Mala"      },
};

function Pill({ bg, color, label }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: "4px 10px", borderRadius: "99px",
      background: bg, color, fontSize: "12px", fontWeight: 700,
      minWidth: "84px", whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function RolPill({ rol })   { const c = ROL_CONFIG[rol]   || ROL_CONFIG.COBRADOR;  return <Pill {...c} />; }
function NivelPill({ nivel }){ const c = NIVEL_CONFIG[nivel]|| NIVEL_CONFIG.MEDIA;  return <Pill {...c} />; }
function EstadoPill({ status }) {
  const isActive = status === "ACTIVE";
  return <Pill bg={isActive ? "#E8F8ED" : "#F2F2F7"} color={isActive ? "#1A6B36" : "#636366"} label={isActive ? "Activo" : "Inactivo"} />;
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

/* ── Avatar con iniciales ── */
function Avatar({ name }) {
  const initials = name ? name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() : "?";
  return (
    <div style={{
      width: "36px", height: "36px", borderRadius: "50%",
      background: "linear-gradient(135deg, #007AFF, #32ADE6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "14px", fontWeight: 700, color: "#fff", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export default function Usuarios() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list: usuarios, loading, meta } = useSelector(state => state.employees) || { list: [], loading: false, meta: {} };
  const { list: creditos } = useSelector(state => state.credits) || { list: [] };

  const [q, setQ] = useState("");
  const [rol, setRol] = useState("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { setPage(meta?.page ?? 1); setPageSize(meta?.pageSize ?? 10); }, [meta?.page, meta?.pageSize]);

  const lastRequestRef = useRef({ page: null, pageSize: null, q: null });
  useEffect(() => {
    const normalizedQuery = q.trim() ? q.trim() : undefined;
    const params = { page, pageSize, q: normalizedQuery };
    const last = lastRequestRef.current;
    if (last.page === params.page && last.pageSize === params.pageSize && last.q === params.q) return;
    const timeout = setTimeout(() => {
      lastRequestRef.current = params;
      dispatch(loadUsers(params));
    }, 200);
    return () => clearTimeout(timeout);
  }, [dispatch, page, pageSize, q]);

  useEffect(() => { dispatch(loadCredits({ page: 1, pageSize: 500 })); }, [dispatch]);
  useEffect(() => { setPage(1); }, [q, rol]);

  const rows = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return (usuarios || [])
      .map(u => ({
        id: u.id,
        nombre: u.name,
        rol: (u.role || "").toUpperCase(),
        status: (u.status || "ACTIVE").toUpperCase(),
        creditos: creditos.filter(c => c.userId === u.id).length,
        nivel: u.responsability?.toUpperCase() || "MEDIA",
      }))
      .filter(u => {
        const textOk = !qn || u.nombre.toLowerCase().includes(qn);
        const rolOk = rol === "todos" || u.rol === rol;
        return textOk && rolOk;
      });
  }, [q, rol, usuarios, creditos]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.025em" }}>Usuarios</h1>
          <p style={{ fontSize: "14px", color: "var(--ios-label-sec)", margin: "4px 0 0" }}>{meta?.totalItems ?? usuarios.length} miembros</p>
        </div>
        <button
          onClick={() => navigate("/usuarios/nuevo")}
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
          Agregar usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="ios-card" style={{ padding: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: "180px" }}>
          <HiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--ios-label-ter)", pointerEvents: "none" }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre…"
            style={{ ...inputStyle, paddingLeft: "38px" }}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>
        <div style={{ flex: "0 0 auto" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ios-label-ter)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>Rol</label>
          <select value={rol} onChange={e => setRol(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: "130px" }} onFocus={onFocus} onBlur={onBlur}>
            <option value="todos">Todos</option>
            <option value="ADMIN">Admin</option>
            <option value="COBRADOR">Cobrador</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
        </div>
      </div>

      {/* ═══ MOBILE: Cards ═══ */}
      <div className="sm:hidden" style={{ flexDirection: "column", gap: "10px" }}>
        {loading ? (
          [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "130px", borderRadius: "16px" }} />)
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : rows.map(u => (
          <div key={u.id} className="ios-card" style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <Avatar name={u.nombre} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--ios-label)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.nombre}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--ios-label-ter)", margin: "2px 0 0" }}>
                    {u.creditos} créditos asignados
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/usuarios/${u.id}`)}
                style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#EBF3FF", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#C8E0FF"}
                onMouseLeave={e => e.currentTarget.style.background = "#EBF3FF"}
              >
                <HiEye style={{ width: "16px", height: "16px", color: "#007AFF" }} />
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              <RolPill rol={u.rol} />
              <NivelPill nivel={u.nivel} />
              <EstadoPill status={u.status} />
            </div>
          </div>
        ))}
      </div>

      {/* ═══ DESKTOP: Tabla ═══ */}
      <div className="hidden sm:block" style={{ background: "var(--ios-bg-card)", borderRadius: "16px", boxShadow: "var(--ios-shadow-sm)", overflow: "hidden" }}>
        <table className="ios-table" style={{ borderRadius: 0 }}>
          <thead>
            <tr>
              {["Nombre", "Créditos", "Responsabilidad", "Rol", "Estado", "Acciones"].map((h, i) => (
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
              <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "var(--ios-label-ter)" }}>
                No se encontraron usuarios.
              </td></tr>
            ) : rows.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--ios-sep-opaque)", transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "14px 16px", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Avatar name={u.nombre} />
                    <span style={{ fontWeight: 600, color: "var(--ios-label)" }}>{u.nombre}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--ios-label-sec)", textAlign: "left" }}>{u.creditos}</td>
                <td style={{ padding: "14px 16px", textAlign: "left" }}><NivelPill nivel={u.nivel} /></td>
                <td style={{ padding: "14px 16px", textAlign: "left" }}><RolPill rol={u.rol} /></td>
                <td style={{ padding: "14px 16px", textAlign: "left" }}><EstadoPill status={u.status} /></td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <button
                    onClick={() => navigate(`/usuarios/${u.id}`)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      padding: "7px 14px", borderRadius: "8px", border: "none",
                      background: "#EBF3FF", color: "#007AFF",
                      fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", marginLeft: "auto",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#C8E0FF"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#EBF3FF"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <HiEye style={{ width: "14px", height: "14px" }} />
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={meta?.page ?? page} pageSize={meta?.pageSize ?? pageSize}
        totalItems={meta?.totalItems ?? usuarios.length}
        totalPages={meta?.totalPages ?? 1}
        onPageChange={setPage}
        onPageSizeChange={size => { setPageSize(size); setPage(1); }}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--ios-bg-card)", borderRadius: "16px", boxShadow: "var(--ios-shadow-sm)" }}>
      <p style={{ fontSize: "40px", margin: "0 0 12px" }}>👤</p>
      <p style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 6px" }}>Sin usuarios</p>
      <p style={{ fontSize: "14px", color: "var(--ios-label-ter)", margin: 0 }}>No se encontraron usuarios con esos filtros.</p>
    </div>
  );
}
