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
          onClick={() => {
            import("react-hot-toast").then((m) => {
              m.default.error("Inicia trayecto primero para ver tus cobros del día", {
                id: "trayecto-error",
                style: {
                  borderRadius: '16px',
                  background: '#1c2b4a',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }
              });
            });
          }}
        >
          <Icon style={{ width: "19px", height: "19px", flexShrink: 0 }} />
          <span>{label}</span>
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
