import {
  HiExclamation,
  HiCheckCircle,
  HiClock,
  HiFlag,
  HiLocationMarker,
} from "react-icons/hi";
import { formatMessageContent } from "../../utils/messageFormatter";

/* ── Paleta iOS limpia ── */
const PALETTE = {
  neutral: {
    bg:     "#F9F9FB",
    border: "#E5E5EA",
    icon:   "#636366",
    iconBg: "#F2F2F7",
    text:   "#1C1C1E",
    sub:    "#636366",
    accent: "#AEAEB2",
    badge:  { bg: "#E5E5EA", text: "#3A3A3C" },
  },
  warning: {
    bg:     "#FFFBF0",
    border: "#FFE5A0",
    icon:   "#FF9500",
    iconBg: "#FFF3E0",
    text:   "#1C1C1E",
    sub:    "#7C5600",
    accent: "#FF9500",
    badge:  { bg: "#FFE5A0", text: "#7C5600" },
  },
  danger: {
    bg:     "#FFF5F4",
    border: "#FFCCC9",
    icon:   "#FF3B30",
    iconBg: "#FFEBEA",
    text:   "#1C1C1E",
    sub:    "#AE1C14",
    accent: "#FF3B30",
    badge:  { bg: "#FFCCC9", text: "#AE1C14" },
  },
  info: {
    bg:     "#F0F6FF",
    border: "#C8E0FF",
    icon:   "#007AFF",
    iconBg: "#EBF3FF",
    text:   "#1C1C1E",
    sub:    "#004FAB",
    accent: "#007AFF",
    badge:  { bg: "#C8E0FF", text: "#004FAB" },
  },
  success: {
    bg:     "#F0FFF5",
    border: "#B8F0CC",
    icon:   "#34C759",
    iconBg: "#E8F8ED",
    text:   "#1C1C1E",
    sub:    "#1A7035",
    accent: "#34C759",
    badge:  { bg: "#B8F0CC", text: "#1A7035" },
  },
};

const MESSAGE_META = {
  PAGO:               { palette: "success", icon: HiCheckCircle,    label: "Pago recibido"       },
  VENCIMIENTO:        { palette: "warning", icon: HiClock,          label: "Vencimiento"          },
  IMPAGO:             { palette: "danger",  icon: HiExclamation,    label: "Impago"               },
  TRAYECTO_INICIADO:  { palette: "info",    icon: HiLocationMarker, label: "Trayecto iniciado"    },
  TRAYECTO_FINALIZADO:{ palette: "neutral", icon: HiFlag,           label: "Trayecto finalizado"  },
  DEFAULT:            { palette: "neutral", icon: HiExclamation,    label: "Sistema"              },
};

function formatDateTime(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.toLocaleDateString("es-AR")} · ${date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function MessageCard({ message }) {
  const type    = (message?.tipo || "").toUpperCase();
  const meta    = MESSAGE_META[type] || MESSAGE_META.DEFAULT;
  const palette = PALETTE[meta.palette] || PALETTE.neutral;
  const Icon    = meta.icon;
  const showImportantBadge = Boolean(message?.importante) && type !== "PAGO";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 16px",
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: "14px",
        transition: "box-shadow 0.15s, transform 0.15s",
        cursor: "default",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Ícono */}
      <div style={{
        width: "36px",
        height: "36px",
        borderRadius: "10px",
        background: palette.iconBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon style={{ width: "18px", height: "18px", color: palette.icon }} />
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Chip de tipo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
          <span style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: palette.icon,
          }}>
            {meta.label}
          </span>
          {showImportantBadge && (
            <span style={{
              padding: "2px 8px",
              borderRadius: "99px",
              background: palette.badge.bg,
              color: palette.badge.text,
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              flexShrink: 0,
            }}>
              Importante
            </span>
          )}
        </div>

        {/* Contenido del mensaje */}
        <p style={{
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--ios-label)",
          margin: 0,
          lineHeight: 1.5,
          whiteSpace: "pre-line",
        }}>
          {formatMessageContent(message?.contenido)}
        </p>

        {/* Meta info */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px", alignItems: "center" }}>
          {message?.client?.name && (
            <span style={{ fontSize: "12px", color: "var(--ios-label-sec)", fontWeight: 500 }}>
              {message.client.name}
            </span>
          )}
          {message?.client?.name && <span style={{ color: "var(--ios-sep-opaque)", fontSize: "12px" }}>·</span>}
          <span style={{ fontSize: "12px", color: "var(--ios-label-ter)" }}>
            {formatDateTime(message?.fechaDate || message?.fecha)}
          </span>
        </div>
      </div>
    </div>
  );
}
