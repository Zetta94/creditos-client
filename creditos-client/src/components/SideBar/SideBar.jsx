import { useEffect, useMemo, useRef, useState } from "react";
import logoMinimal from "../../assets/LogoMinimalista.png";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  HiChevronDown,
  HiHome,
  HiCash,
  HiCurrencyDollar,
  HiChartBar,
  HiLogout,
  HiViewGrid,
  HiUsers,
  HiCreditCard,
  HiChat,
  HiTrendingUp,
} from "react-icons/hi";
import SidebarAdmin from "./SideBarAdmin.jsx";
import SidebarCobrador from "./SideBarCobrador";
import { useDispatch, useSelector } from "react-redux";
import { resetTrayecto } from "../../store/trayectoSlice";
import { logout } from "../../store/authSlice";

/* ─── Ítems de navegación por rol ─── */
const adminNavItems = [
  { to: "/",         label: "Inicio",   icon: HiHome      },
  { to: "/creditos", label: "Créditos", icon: HiCreditCard },
  { to: "/clientes", label: "Clientes", icon: HiUsers      },
  { to: "/mensajes", label: "Mensajes", icon: HiChat       },
  { to: "/usuarios", label: "Usuarios", icon: HiViewGrid   },
];

const collectorNavItems = [
  { to: "/cobrador/dashboard", label: "Inicio",   icon: HiHome           },
  { to: "/cobrador/pagos",     label: "Cobros",   icon: HiCash           },
  { to: "/cobrador/sueldo",    label: "Sueldo",   icon: HiCurrencyDollar },
  { to: "/cobrador/reportes",  label: "Reportes", icon: HiChartBar       },
];

export default function SideBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);
  const authUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const user = useMemo(() => {
    if (authUser) return authUser;
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    try { return JSON.parse(stored); } catch (_) { return null; }
  }, [authUser]);

  const rawRole = user?.role ?? localStorage.getItem("role") ?? "admin";
  const role = typeof rawRole === "string" ? rawRole.toLowerCase() : "admin";
  const isCollector = role === "cobrador" || role === "employee";
  const email = user?.email || "";
  const displayName = user?.name || (email ? email.split("@")[0] : "Usuario");
  const initials = useMemo(() => {
    const source = (displayName || "Usuario").trim();
    const words = source.split(/\s+/).filter(Boolean);
    if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
    return source.slice(0, 2).toUpperCase();
  }, [displayName]);
  const roleLabel = role === "admin" ? "Administrador" : "Cobrador";
  const navItems = isCollector ? collectorNavItems : adminNavItems;

  const handleLogoClick = () => {
    navigate(isCollector ? "/cobrador/dashboard" : "/");
  };

  const handleLogout = async () => {
    dispatch(resetTrayecto());
    await dispatch(logout());
    setUserOpen(false);
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    setUserOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClick(e) {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    }
    if (userOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userOpen]);

  return (
    <>
      {/* ══════════════════════════════════════
          NAVBAR SUPERIOR — Glassmorphism iOS
          ══════════════════════════════════════ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: "64px",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
        }}
      >
        {/* Izquierda: espacio reservado para simetría */}
        <div style={{ minWidth: "44px" }} />

        {/* Centro: Logo (siempre centrado) */}
        <button
          type="button"
          onClick={handleLogoClick}
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "6px 12px",
            borderRadius: "14px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "#1c2b4a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(28,43,74,0.3)",
            flexShrink: 0,
          }}>
            <img src={logoMinimal} style={{ width: "26px", height: "26px", objectFit: "contain" }} alt="Logo" />
          </div>
          <div
            className="hidden sm:flex"
            style={{ flexDirection: "column", lineHeight: 1.2, textAlign: "left" }}
          >
            <span style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ios-label-sec)", fontWeight: 600 }}>El Imperio</span>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--ios-label)" }}>Dashboard</span>
          </div>
        </button>

        {/* Derecha: Avatar / user menu */}
        <div
          style={{ position: "relative", display: "flex", alignItems: "center", minWidth: "44px", justifyContent: "flex-end" }}
          ref={userRef}
        >
          {/* Avatar desktop (texto + chevron) */}
          <button
            type="button"
            onClick={() => setUserOpen(v => !v)}
            className="hidden sm:flex"
            style={{
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px 4px 4px",
              borderRadius: "99px",
              border: "1.5px solid var(--ios-sep-opaque)",
              background: "var(--ios-bg-card)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--ios-bg-card)"}
          >
            <span style={{
              width: "32px", height: "32px", borderRadius: "99px",
              background: "linear-gradient(135deg, #007AFF, #32ADE6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>
              {initials}
            </span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ios-label)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayName}
            </span>
            <HiChevronDown style={{
              width: "14px", height: "14px", color: "var(--ios-label-sec)", flexShrink: 0,
              transform: userOpen ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.2s",
            }} />
          </button>

          {/* Avatar mobile (solo iniciales, sin texto) */}
          <button
            type="button"
            onClick={() => setUserOpen(v => !v)}
            className="sm:hidden"
            style={{
              width: "38px", height: "38px", borderRadius: "99px",
              background: "linear-gradient(135deg, #007AFF, #32ADE6)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", fontWeight: 700, color: "#fff",
              boxShadow: "0 2px 8px rgba(0,122,255,0.35)",
            }}
            aria-label="Menú de usuario"
          >
            {initials}
          </button>

          {/* Dropdown del usuario */}
          {userOpen && (
            <div
              className="animate-scale-in"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: "0",
                width: "240px",
                background: "rgba(255,255,255,0.97)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: "20px",
                border: "1px solid var(--ios-sep-opaque)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                overflow: "hidden",
                zIndex: 60,
              }}
            >
              <div style={{ padding: "16px", borderBottom: "1px solid var(--ios-sep-opaque)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    width: "44px", height: "44px", borderRadius: "99px",
                    background: "linear-gradient(135deg, #007AFF, #32ADE6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "16px", fontWeight: 700, color: "#fff", flexShrink: 0,
                  }}>
                    {initials}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--ios-label)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {displayName}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--ios-blue)", margin: "2px 0 0", fontWeight: 600 }}>
                      {roleLabel}
                    </p>
                  </div>
                </div>
                {email && (
                  <p style={{ fontSize: "12px", color: "var(--ios-label-sec)", marginTop: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {email}
                  </p>
                )}
              </div>
              <div style={{ padding: "8px" }}>
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    width: "100%", padding: "11px 12px", borderRadius: "12px",
                    border: "none", background: "transparent",
                    color: "var(--ios-red)", fontSize: "15px", fontWeight: 600,
                    cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--ios-red-bg)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <HiLogout style={{ width: "18px", height: "18px" }} />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ══════════════════════════════════════
          SIDEBAR DESKTOP — Solo admin, solo ≥ sm
          ══════════════════════════════════════ */}
      {!isCollector && (
        <aside
          className="hidden sm:block"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 40,
            height: "100vh",
            width: "256px",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRight: "1px solid var(--ios-sep-opaque)",
            paddingTop: "64px",
          }}
        >
          <div style={{ height: "100%", overflowY: "auto", padding: "16px 12px" }}>
            <SidebarAdmin />
          </div>
        </aside>
      )}

      {/* ══════════════════════════════════════
          BOTTOM NAV FLOTANTE
          • Admin:    solo mobile  (sm:hidden)
          • Cobrador: siempre visible
          ══════════════════════════════════════ */}
      <div
        className={`ios-bottom-nav ${!isCollector ? "sm:hidden" : ""}`}
        style={{ pointerEvents: "none" }}
      >
        <div
          className="ios-bottom-nav-inner"
          style={{
            gridTemplateColumns: `repeat(${navItems.length}, 1fr)`,
            pointerEvents: "auto",
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isRoot = item.to === "/";
            const isActive = isRoot
              ? location.pathname === "/"
              : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`ios-nav-item ${isActive ? "active" : ""}`}
              >
                <Icon style={{ width: "22px", height: "22px" }} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </>
  );
}
