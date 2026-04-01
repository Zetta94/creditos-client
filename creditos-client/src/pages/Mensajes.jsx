import { useEffect, useState } from "react";
import { HiSearch } from "react-icons/hi";
import { fetchMessages } from "../services/messagesService";
import Pagination from "../components/Pagination";
import MessageCard from "../components/messages/MessageCard";

const TYPE_OPTIONS = [
  { value: "TODOS",               label: "Todos"                },
  { value: "PAGO",                label: "Pagos recibidos"      },
  { value: "VENCIMIENTO",         label: "Próximos vencimientos"},
  { value: "IMPAGO",              label: "Clientes en mora"     },
  { value: "TRAYECTO_INICIADO",   label: "Trayectos iniciados"  },
  { value: "TRAYECTO_FINALIZADO", label: "Trayectos finalizados"},
];

function normalizarMensajes(items) {
  return (Array.isArray(items) ? items : []).map((item) => {
    const fechaDate = item.fecha ? new Date(item.fecha) : null;
    return {
      ...item,
      clienteNombre: item.client?.name ?? null,
      fechaDate: fechaDate instanceof Date && !Number.isNaN(fechaDate.getTime()) ? fechaDate : null,
    };
  });
}

/* ── Label + input stack ── */
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-sec)", letterSpacing: "0.01em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  height: "40px",
  width: "100%",
  padding: "0 12px",
  borderRadius: "10px",
  border: "1.5px solid var(--ios-sep-opaque)",
  background: "var(--ios-fill)",
  fontSize: "14px",
  color: "var(--ios-label)",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s, box-shadow 0.15s",
  WebkitAppearance: "none",
  appearance: "none",
};

export default function Mensajes() {
  const [filtros, setFiltros] = useState({ desde: "", hasta: "", tipo: "TODOS", soloImportantes: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { desde, hasta, tipo, soloImportantes } = filtros;

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = {
      page, pageSize,
      ...(tipo !== "TODOS" ? { tipo } : {}),
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
      ...(soloImportantes ? { importante: true } : {}),
    };
    fetchMessages(params)
      .then(res => {
        if (!active) return;
        setMessages(normalizarMensajes(res.data?.data));
        setMeta(res.data?.meta || { page: 1, pageSize, totalItems: 0, totalPages: 1 });
        setError(null);
      })
      .catch(() => { if (!active) return; setError("No se pudieron cargar los mensajes."); })
      .finally(() => { if (!active) return; setLoading(false); });
    return () => { active = false; };
  }, [page, pageSize, desde, hasta, tipo, soloImportantes]);

  useEffect(() => { setPage(meta.page ?? 1); setPageSize(meta.pageSize ?? 10); }, [meta.page, meta.pageSize]);
  useEffect(() => { setPage(1); }, [desde, hasta, tipo, soloImportantes]);

  const reset = () => setFiltros({ desde: "", hasta: "", tipo: "TODOS", soloImportantes: false });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.025em" }}>Mensajes</h1>
          <p style={{ fontSize: "14px", color: "var(--ios-label-sec)", margin: "4px 0 0" }}>Actividad y notificaciones del sistema</p>
        </div>
        <button
          onClick={reset}
          style={{
            padding: "9px 16px", borderRadius: "10px", border: "1.5px solid var(--ios-sep-opaque)",
            background: "var(--ios-bg-card)", fontSize: "14px", fontWeight: 600,
            color: "var(--ios-blue)", cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--ios-bg-card)"}
        >
          Limpiar filtros
        </button>
      </div>

      {/* Panel de filtros  */}
      <div className="ios-card" style={{ padding: "18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px" }}>
          <Field label="Desde">
            <input
              type="date"
              value={filtros.desde}
              onChange={e => setFiltros(f => ({ ...f, desde: e.target.value }))}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; e.target.style.background = "#fff"; }}
              onBlur={e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--ios-fill)"; }}
            />
          </Field>

          <Field label="Hasta">
            <input
              type="date"
              value={filtros.hasta}
              onChange={e => setFiltros(f => ({ ...f, hasta: e.target.value }))}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; e.target.style.background = "#fff"; }}
              onBlur={e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--ios-fill)"; }}
            />
          </Field>

          <Field label="Tipo">
            <select
              value={filtros.tipo}
              onChange={e => setFiltros(f => ({ ...f, tipo: e.target.value }))}
              disabled={filtros.soloImportantes}
              style={{ ...inputStyle, opacity: filtros.soloImportantes ? 0.5 : 1, cursor: filtros.soloImportantes ? "not-allowed" : "pointer" }}
              onFocus={e => { if (!filtros.soloImportantes) { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; e.target.style.background = "#fff"; } }}
              onBlur={e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--ios-fill)"; }}
            >
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>

          {/* Toggle solo importantes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", justifyContent: "flex-end" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-sec)" }}>Filtrar</label>
            <label
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                height: "40px", padding: "0 12px",
                borderRadius: "10px", border: "1.5px solid var(--ios-sep-opaque)",
                background: filtros.soloImportantes ? "var(--ios-blue-light)" : "var(--ios-fill)",
                cursor: "pointer", fontSize: "14px", fontWeight: 500,
                color: filtros.soloImportantes ? "var(--ios-blue)" : "var(--ios-label-sec)",
                transition: "all 0.15s", userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={filtros.soloImportantes}
                onChange={e => setFiltros(f => ({ ...f, soloImportantes: e.target.checked, tipo: e.target.checked ? "TODOS" : f.tipo }))}
                style={{ width: "16px", height: "16px", accentColor: "var(--ios-blue)", cursor: "pointer" }}
              />
              Solo importantes
            </label>
          </div>
        </div>
      </div>

      {/* Lista de mensajes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {loading ? (
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "14px" }} />
          ))
        ) : error ? (
          <div style={{ padding: "20px", background: "var(--ios-red-bg)", borderRadius: "14px", color: "var(--ios-red)", fontSize: "14px", fontWeight: 600 }}>
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontSize: "40px", margin: "0 0 12px" }}>✉️</p>
            <p style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 6px" }}>Sin mensajes</p>
            <p style={{ fontSize: "14px", color: "var(--ios-label-ter)", margin: 0 }}>No hay mensajes con los filtros seleccionados.</p>
          </div>
        ) : (
          messages.map(m => <MessageCard key={m.id} message={m} />)
        )}
      </div>

      {/* Paginación */}
      <Pagination
        page={meta.page ?? page}
        pageSize={meta.pageSize ?? pageSize}
        totalItems={meta.totalItems ?? messages.length}
        totalPages={meta.totalPages ?? 1}
        onPageChange={setPage}
        onPageSizeChange={size => { setPageSize(size); setPage(1); }}
      />
    </div>
  );
}
