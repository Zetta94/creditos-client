import { useEffect } from "react";
import { HiCheckCircle, HiXCircle, HiInformationCircle } from "react-icons/hi";

const icons = {
  success: <HiCheckCircle style={{ width: "20px", height: "20px", color: "var(--ios-green)", flexShrink: 0 }} />,
  error:   <HiXCircle    style={{ width: "20px", height: "20px", color: "var(--ios-red)",   flexShrink: 0 }} />,
  info:    <HiInformationCircle style={{ width: "20px", height: "20px", color: "var(--ios-blue)", flexShrink: 0 }} />,
};

export default function Toast({ message, type = "info", confirm, onConfirm, onCancel, onClose }) {
  useEffect(() => {
    if (confirm) return;
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose, confirm]);

  /* ── Modal de confirmación (Alert sheet iOS) ── */
  if (confirm) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          background: "rgba(0,0,0,0.30)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          padding: "16px",
          paddingBottom: "max(20px, env(safe-area-inset-bottom))",
        }}
        role="alertdialog"
        aria-modal="true"
      >
        <div
          className="animate-scale-in"
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          {/* Mensaje */}
          <div style={{ padding: "24px 20px 16px", textAlign: "center" }}>
            <p style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: 0, lineHeight: 1.4 }}>
              {message}
            </p>
          </div>

          {/* Separador */}
          <div style={{ height: "1px", background: "var(--ios-sep-opaque)" }} />

          {/* Botones estilo iOS Alert */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <button
              onClick={onCancel || onClose}
              style={{
                padding: "16px",
                border: "none",
                borderRight: "1px solid var(--ios-sep-opaque)",
                background: "transparent",
                fontSize: "17px",
                fontWeight: 500,
                color: "var(--ios-label-sec)",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              Cancelar
            </button>
            <button
              onClick={() => { onConfirm?.(); onClose(); }}
              style={{
                padding: "16px",
                border: "none",
                background: "transparent",
                fontSize: "17px",
                fontWeight: 700,
                color: "var(--ios-blue)",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Toast banner (notification pill iOS) ── */
  return (
    <div
      className="animate-slide-up"
      role="alert"
      style={{
        position: "fixed",
        top: "72px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        maxWidth: "min(90vw, 360px)",
        width: "max-content",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderRadius: "16px",
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      {icons[type]}
      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ios-label)", lineHeight: 1.4 }}>
        {message}
      </span>
    </div>
  );
}
