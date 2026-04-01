import { NavLink, useLocation } from "react-router-dom";
import {
  HiHome,
  HiTrendingUp,
  HiCreditCard,
  HiUsers,
  HiChat,
  HiViewGrid,
} from "react-icons/hi";
import { useState } from "react";

const iconMap = {
  dashboard: HiHome,
  stats: HiTrendingUp,
  grid: HiCreditCard,
  clients: HiUsers,
  message: HiChat,
  users: HiViewGrid,
  payments: HiCreditCard,
};

export default function SidebarItem({ to, label, icon, disabled = false }) {
  const location = useLocation();
  const pathname = location.pathname || "";
  const isRoot = to === "/";
  const isActive = !disabled && (isRoot ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`));
  const Icon = iconMap[icon] || HiHome;
  const [showAlert, setShowAlert] = useState(false);

  if (disabled) {
    return (
      <li>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            borderRadius: "12px",
            color: "var(--ios-label-quat)",
            fontSize: "15px",
            fontWeight: 500,
            cursor: "pointer",
            opacity: 0.7,
            position: "relative"
          }}
          aria-disabled="true"
          onClick={() => setShowAlert(true)}
        >
          <Icon style={{ width: "19px", height: "19px", flexShrink: 0 }} />
          <span>{label}</span>
          {showAlert && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.25)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onClick={() => setShowAlert(false)}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: "18px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                  padding: "32px 24px",
                  minWidth: "280px",
                  maxWidth: "90vw",
                  textAlign: "center"
                }}
                onClick={e => e.stopPropagation()}
              >
                <h3 style={{ color: "#e11d48", fontWeight: 700, fontSize: "18px", marginBottom: "10px" }}>Trayecto no iniciado</h3>
                <p style={{ color: "#222", fontSize: "15px", marginBottom: "18px" }}>
                  Debes iniciar tu trayecto desde el panel de inicio para ver los cobros del día.
                </p>
                <button
                  style={{
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "10px 22px",
                    fontWeight: 600,
                    fontSize: "15px",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(37,99,235,0.12)"
                  }}
                  onClick={() => {
                    setShowAlert(false);
                    window.location.href = "/cobrador/dashboard";
                  }}
                >
                  Ir al panel de inicio
                </button>
              </div>
            </div>
          )}
        </div>
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={to}
        style={({ isActive: navActive }) => {
          const active = isActive || navActive;
          return {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            borderRadius: "12px",
            textDecoration: "none",
            fontSize: "15px",
            fontWeight: active ? 600 : 500,
            color: active ? "var(--ios-blue)" : "var(--ios-label-sec)",
            background: active ? "rgba(0,122,255,0.10)" : "transparent",
            transition: "all 0.15s",
          };
        }}
        onMouseEnter={e => {
          if (!isActive) e.currentTarget.style.background = "var(--ios-fill)";
        }}
        onMouseLeave={e => {
          if (!isActive) e.currentTarget.style.background = "transparent";
        }}
      >
        <Icon style={{ width: "19px", height: "19px", flexShrink: 0 }} />
        <span>{label}</span>
      </NavLink>
    </li>
  );
}
