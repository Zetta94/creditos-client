import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OrdenarClientes from "../pages/OrdenarClientes.jsx";
import { HiArrowLeft, HiPencil, HiCurrencyDollar, HiCollection, HiChartBar } from "react-icons/hi";
import { fetchUser } from "../services/usersService";
import { fetchCredits } from "../services/creditsService";
import { fetchPayments } from "../services/paymentsService";
import { fetchClients } from "../services/clientsService";
import { fetchUpcomingStarts } from "../services/assignmentsService";
import Pagination from "../components/Pagination";

function formatCommissionValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "Sin comisión";
  return n <= 100 ? `${n}%` : `$ ${n.toLocaleString("es-AR")}`;
}

const ROL_CONFIG = {
  ADMIN:    { bg: "#F5EAFF", color: "#5C2B8C", label: "Admin"    },
  COBRADOR: { bg: "#FFF3E0", color: "#7C4A00", label: "Cobrador" },
  EMPLOYEE: { bg: "#FFF3E0", color: "#7C4A00", label: "Cobrador" },
};

const RESP_CONFIG = {
  EXCELENTE: { bg: "#E8F8ED", color: "#1A6B36" },
  ALTA:      { bg: "#FFF3E0", color: "#7C4A00" },
  BUENA:     { bg: "#EBF3FF", color: "#004299" },
  MEDIA:     { bg: "#EBF3FF", color: "#004299" },
  MALA:      { bg: "#FFEBEA", color: "#8B0000" },
};

function Pill({ bg, color, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "5px 12px", borderRadius: "99px", background: bg, color, fontSize: "13px", fontWeight: 700, minWidth: "84px", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function InfoRow({ label, value }) {
  if (!value || value === "—") return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--ios-sep-opaque)" }}>
      <span style={{ fontSize: "14px", color: "var(--ios-label-sec)", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: "14px", color: "var(--ios-label)", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function KpiCard({ label, value, hint, color = "#007AFF", bg = "#EBF3FF", icon: Icon }) {
  return (
    <div className="ios-card" style={{ padding: "16px", textAlign: "center" }}>
      {Icon && (
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
          <Icon style={{ width: "18px", height: "18px", color }} />
        </div>
      )}
      <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontSize: "22px", fontWeight: 800, color: "var(--ios-label)", margin: 0 }}>{value}</p>
      {hint && <p style={{ fontSize: "11px", color: "var(--ios-label-ter)", margin: "4px 0 0" }}>{hint}</p>}
    </div>
  );
}

function ActionBtn({ children, onClick, color = "#004299", bg = "#EBF3FF", hoverBg = "#C8E0FF" }) {
  return (
    <button
      onClick={onClick}
      style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: bg, color, fontSize: "15px", fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background = hoverBg}
      onMouseLeave={e => e.currentTarget.style.background = bg}
    >
      {children}
    </button>
  );
}

export default function UsuarioDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const assignedPortfolioRef = useRef(null);

  const [usuario, setUsuario] = useState(null);
  const [creditos, setCreditos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [upcomingStarts, setUpcomingStarts] = useState([]);
  const [upcomingMeta, setUpcomingMeta] = useState({ page: 1, pageSize: 8, totalItems: 0, totalPages: 1 });
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [upcomingPageSize, setUpcomingPageSize] = useState(8);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const u = await fetchUser(id).then(r => r.data);
        const [cr, pa, cl] = await Promise.all([
          fetchCredits({ page: 1, pageSize: 2000 }).then(r => r.data?.data ?? []),
          fetchPayments({ page: 1, pageSize: 500 }).then(r => r.data?.data ?? []),
          fetchClients({ page: 1, pageSize: 500 }).then(r => r.data?.data ?? []),
        ]);
        setUsuario({ ...u, status: (u.status || "ACTIVE").toUpperCase(), phone: u.phone || "—", alternatePhone: u.alternatePhone || "—", address: u.address || "—", document: u.document || "—", responsability: u.responsability || "MEDIA", salary: u.salary ?? 0, salaryType: u.salaryType || "N_A", comisions: u.comisions ?? 0, birthDate: u.birthDate || null });
        setCreditos(cr); setPagos(pa); setClientes(cl);
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  useEffect(() => { setUpcomingPage(1); }, [id]);

  useEffect(() => {
    const role = (usuario?.role || "").toUpperCase();
    const isCollector = role === "COBRADOR" || role === "EMPLOYEE";
    if (!id || !isCollector) { setUpcomingStarts([]); setUpcomingMeta({ page: 1, pageSize: upcomingPageSize, totalItems: 0, totalPages: 1 }); return; }
    const loadUpcoming = async () => {
      setLoadingUpcoming(true);
      try {
        const res = await fetchUpcomingStarts({ cobradorId: id, page: upcomingPage, pageSize: upcomingPageSize });
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
        setUpcomingStarts(data);
        setUpcomingMeta(res?.data?.meta || { page: upcomingPage, pageSize: upcomingPageSize, totalItems: data.length, totalPages: 1 });
      } finally { setLoadingUpcoming(false); }
    };
    loadUpcoming();
  }, [id, usuario?.role, upcomingPage, upcomingPageSize]);

  const inicioSemana = useMemo(() => {
    const now = new Date(), s = new Date(now), day = s.getDay(), diff = day === 0 ? 6 : day - 1;
    s.setDate(s.getDate() - diff); s.setHours(0, 0, 0, 0); return s;
  }, []);

  const cobrosUsuario = useMemo(() =>
    pagos.filter(p => p.employeeId === id).map(p => {
      const cr = creditos.find(c => c.id === p.creditId);
      const cl = clientes.find(c => c.id === cr?.clientId);
      return { id: p.id, fecha: p.date, monto: p.amount, cliente: cl?.name || "Cliente desconocido" };
    }), [pagos, creditos, clientes, id]
  );

  const cobrosSemana = cobrosUsuario.filter(c => { const d = new Date(c.fecha); return !Number.isNaN(d.getTime()) && d >= inicioSemana; });
  const totalCobradoSemana = cobrosSemana.reduce((acc, c) => acc + c.monto, 0);
  const creditosCargados = creditos.filter(c => { if (c.userId !== id) return false; const d = new Date(c.createdAt || c.startDate); return !Number.isNaN(d.getTime()) && d >= inicioSemana; }).length;
  const handleBack = () => window.history.length > 2 ? navigate(-1) : navigate("/usuarios");

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "140px", borderRadius: "16px" }} />)}
    </div>
  );

  if (!usuario) return (
    <div style={{ textAlign: "center", padding: "60px", color: "var(--ios-red)", fontSize: "16px" }}>Usuario no encontrado.</div>
  );

  const roleDisplay = (usuario.role || "").toUpperCase();
  const isCollector = roleDisplay === "COBRADOR" || roleDisplay === "EMPLOYEE";
  const rolCfg = ROL_CONFIG[roleDisplay] || ROL_CONFIG.COBRADOR;
  const respCfg = RESP_CONFIG[(usuario.responsability || "").toUpperCase()] || RESP_CONFIG.MEDIA;
  const initials = usuario.name?.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
  const birthDateDisplay = (() => { if (!usuario.birthDate) return null; const d = new Date(usuario.birthDate); return !Number.isNaN(d.getTime()) ? d.toLocaleDateString("es-AR", { timeZone: "UTC" }) : null; })();

  const detailItems = [
    { label: "Teléfono",            value: usuario.phone          },
    { label: "Tel. alternativo",    value: usuario.alternatePhone },
    { label: "Dirección",           value: usuario.address        },
    { label: "Documento",           value: usuario.document       },
    { label: "Cumpleaños",          value: birthDateDisplay       },
    { label: "Responsabilidad",     value: usuario.responsability },
    { label: "Sueldo base",         value: `$${(usuario.salary || 0).toLocaleString("es-AR")}` },
    { label: "Tipo de sueldo",      value: usuario.salaryType     },
    { label: "Comisión",            value: formatCommissionValue(usuario.comisions) },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">

      {/* Header de nav */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={handleBack}
          style={{ width: "40px", height: "40px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-bg-card)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <HiArrowLeft style={{ width: "18px", height: "18px", color: "var(--ios-label-sec)" }} />
        </button>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ios-label-sec)", margin: 0 }}>Usuarios</p>
        <span style={{ color: "var(--ios-label-ter)" }}>›</span>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ios-label)", margin: 0 }}>{usuario.name}</p>
      </div>

      {/* Hero card */}
      <div className="ios-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg, #1C1C1E, #3A3A3C)", padding: "24px 20px 36px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", minWidth: 0 }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "linear-gradient(135deg, #007AFF, #32ADE6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{usuario.name}</h1>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", margin: "4px 0 0" }}>{usuario.email}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                  <Pill bg="rgba(255,255,255,0.12)" color="rgba(255,255,255,0.9)" label={`ID ${(usuario.id || "").slice(0, 8)}`} />
                  <Pill bg={rolCfg.bg} color={rolCfg.color} label={rolCfg.label} />
                  <Pill
                    bg={usuario.status === "ACTIVE" ? "#E8F8ED" : "#F2F2F7"}
                    color={usuario.status === "ACTIVE" ? "#34C759" : "#AEAEB2"}
                    label={usuario.status === "ACTIVE" ? "Activo" : "Inactivo"}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/usuarios/${id}/editar`)}
              style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
            >
              <HiPencil style={{ width: "16px", height: "16px", color: "#fff" }} />
            </button>
          </div>
        </div>

        {/* Info rows */}
        <div style={{ marginTop: "-16px", background: "var(--ios-bg-card)", borderRadius: "16px 16px 0 0" }}>
          <div style={{ padding: "16px 16px 4px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <Pill bg={respCfg.bg} color={respCfg.color} label={`Responsabilidad: ${usuario.responsability || "—"}`} />
            <Pill bg="var(--ios-fill)" color="var(--ios-label-sec)" label={`Sueldo: ${usuario.salaryType || "—"}`} />
          </div>
          {detailItems.map(item => <InfoRow key={item.label} label={item.label} value={item.value} />)}
        </div>
      </div>

      {/* KPIs semana */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
        <KpiCard label="Créditos cargados" value={creditosCargados} hint="Esta semana" color="#007AFF" bg="#EBF3FF" icon={HiCollection} />
        <KpiCard label="Pagos recibidos" value={cobrosSemana.length} hint="Esta semana" color="#34C759" bg="#E8F8ED" icon={HiChartBar} />
        <KpiCard
          label="Total cobrado"
          value={totalCobradoSemana.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
          hint="Semana actual"
          color="#FF9500" bg="#FFF3E0"
          icon={HiCurrencyDollar}
        />
      </div>

      {/* Acciones rápidas */}
      <div style={{ display: "grid", gridTemplateColumns: isCollector ? "1fr 1fr" : "1fr", gap: "10px" }}>
        {isCollector && (
          <>
            <ActionBtn onClick={() => assignedPortfolioRef.current?.scrollIntoView({ behavior: "smooth" })} color="#7C4A00" bg="#FFF3E0" hoverBg="#FFE5A0">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <HiCollection style={{ width: "18px", height: "18px" }} />
                Ordenar clientes
              </div>
            </ActionBtn>
            <ActionBtn onClick={() => navigate(`/usuarios/${id}/sueldo`)} color="#1A6B36" bg="#E8F8ED" hoverBg="#B8F0CC">
               <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <HiCurrencyDollar style={{ width: "18px", height: "18px" }} />
                Sueldo y comisión
              </div>
            </ActionBtn>
          </>
        )}
        <ActionBtn onClick={() => navigate(`/usuarios/${id}/reportes`)} color="#004299" bg="#EBF3FF" hoverBg="#C8E0FF">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <HiChartBar style={{ width: "18px", height: "18px" }} />
            Ver reportes
          </div>
        </ActionBtn>
        {!isCollector && (
          <ActionBtn onClick={() => navigate(`/usuarios/${id}/editar`)} color="#3A3A3C" bg="var(--ios-fill)" hoverBg="#E5E5EA">
            Editar información
          </ActionBtn>
        )}
      </div>
      
      {/* ═══ Cartera asignada ═══ */}
      {isCollector && (
        <div ref={assignedPortfolioRef} style={{ marginTop: "10px" }}>
          {/* El componente OrdenarClientes ya trae su propio ios-card y titulo, 
              así que lo dejamos "suelto" para evitar anidación excesiva */}
          <OrdenarClientes cobradorId={usuario.id} />
        </div>
      )}

      {/* Créditos próximos */}
      {isCollector && (
        <div className="ios-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: 0 }}>Créditos por iniciar</h2>
              <p style={{ fontSize: "13px", color: "var(--ios-label-ter)", margin: "4px 0 0" }}>Créditos asignados aún no iniciados</p>
            </div>
            <span style={{ padding: "5px 12px", borderRadius: "99px", background: "var(--ios-fill)", fontSize: "13px", fontWeight: 700, color: "var(--ios-label-sec)" }}>
              {upcomingMeta.totalItems ?? upcomingStarts.length}
            </span>
          </div>

          {loadingUpcoming ? (
            <div className="skeleton" style={{ height: "80px", borderRadius: "12px" }} />
          ) : upcomingStarts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--ios-label-ter)", fontSize: "14px" }}>
              No hay créditos pendientes de inicio.
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="sm:hidden" style={{ flexDirection: "column", gap: "10px" }}>
                {upcomingStarts.map(item => (
                  <div key={item.creditId} style={{ background: "var(--ios-fill)", borderRadius: "12px", padding: "14px" }}>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 8px" }}>{item.client?.name || "Cliente"}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      {[
                        { l: "Monto", v: `$${Number(item.amount || 0).toLocaleString("es-AR")}` },
                        { l: "Inicio", v: item.startDate ? new Date(item.startDate).toLocaleDateString("es-AR") : "—" },
                        { l: "Próx. visita", v: item.assignment?.nextVisitDate ? new Date(item.assignment.nextVisitDate).toLocaleDateString("es-AR") : "—" },
                      ].map(i => (
                        <div key={i.l}>
                          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ios-label-ter)", margin: "0 0 2px" }}>{i.l}</p>
                          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ios-label)", margin: 0 }}>{i.v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop */}
              <div className="hidden sm:block" style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--ios-sep-opaque)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Cliente", "Monto", "Inicio cobro", "Próxima visita"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", background: "var(--ios-fill)", borderBottom: "1px solid var(--ios-sep-opaque)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-sec)", textAlign: "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingStarts.map((item, i) => (
                      <tr key={item.creditId} style={{ borderBottom: i < upcomingStarts.length - 1 ? "1px solid var(--ios-sep-opaque)" : "none" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--ios-label)" }}>{item.client?.name || "Cliente"}</td>
                        <td style={{ padding: "12px 14px", color: "var(--ios-label-sec)" }}>${Number(item.amount || 0).toLocaleString("es-AR")}</td>
                        <td style={{ padding: "12px 14px", color: "var(--ios-label-sec)" }}>{item.startDate ? new Date(item.startDate).toLocaleDateString("es-AR") : "—"}</td>
                        <td style={{ padding: "12px 14px", color: "var(--ios-label-sec)" }}>{item.assignment?.nextVisitDate ? new Date(item.assignment.nextVisitDate).toLocaleDateString("es-AR") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: "12px" }}>
                <Pagination
                  page={upcomingMeta.page ?? upcomingPage} pageSize={upcomingMeta.pageSize ?? upcomingPageSize}
                  totalItems={upcomingMeta.totalItems ?? upcomingStarts.length}
                  totalPages={upcomingMeta.totalPages ?? 1}
                  onPageChange={setUpcomingPage}
                  onPageSizeChange={size => { setUpcomingPageSize(size); setUpcomingPage(1); }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
