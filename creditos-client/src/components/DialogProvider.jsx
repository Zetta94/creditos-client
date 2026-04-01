import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

/* ─────────────────────────────────────────────
   iOS-style Confirm / Alert dialog system
   Usage:
     const { confirm, alert } = useDialog();
     const ok = await confirm("¿Eliminar cliente?", { title: "Confirmar", confirmText: "Eliminar", destructive: true });
     await alert("Operación completada");
───────────────────────────────────────────── */

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialogs, setDialogs] = useState([]);

  const show = useCallback((type, message, opts = {}) => {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).slice(2);
      setDialogs(prev => [...prev, { id, type, message, opts, resolve }]);
    });
  }, []);

  const confirm = useCallback((message, opts) => show("confirm", message, opts), [show]);
  const alert = useCallback((message, opts) => show("alert", message, opts), [show]);

  const close = useCallback((id, result) => {
    setDialogs(prev => {
      const d = prev.find(x => x.id === id);
      if (d) d.resolve(result);
      return prev.filter(x => x.id !== id);
    });
  }, []);

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialogs.map(d => (
        <DialogModal key={d.id} {...d} onClose={(result) => close(d.id, result)} />
      ))}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used inside <DialogProvider>");
  return ctx;
}

function DialogModal({ type, message, opts = {}, onClose }) {
  const {
    title,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    destructive = false,
  } = opts;

  const modalRef = useRef(null);

  // Animate in
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    el.style.transform = "scale(0.92)";
    el.style.opacity = "0";
    requestAnimationFrame(() => {
      el.style.transition = "transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s";
      el.style.transform = "scale(1)";
      el.style.opacity = "1";
    });
  }, []);

  // Close on backdrop
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) {
      if (type === "alert") onClose(true);
      else onClose(false);
    }
  };

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose(false);
      if (e.key === "Enter") onClose(type === "confirm" ? true : true);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, type]);

  return createPortal(
    <div
      onClick={handleBackdrop}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        animation: "ios-dialog-bg 0.18s ease",
      }}
    >
      <div
        ref={modalRef}
        style={{
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(20px)",
          borderRadius: "20px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
          width: "100%",
          maxWidth: "320px",
          overflow: "hidden",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        }}
      >
        {/* Content */}
        <div style={{ padding: "24px 24px 20px", textAlign: "center" }}>
          {title && (
            <p style={{ fontSize: "17px", fontWeight: 700, color: "#1C1C1E", margin: "0 0 8px" }}>
              {title}
            </p>
          )}
          <p style={{ fontSize: "14px", color: title ? "#636366" : "#1C1C1E", fontWeight: title ? 400 : 600, margin: 0, lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(0,0,0,0.1)" }} />

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: type === "confirm" ? "row" : "column" }}>
          {type === "confirm" && (
            <>
              <button
                onClick={() => onClose(false)}
                style={{
                  flex: 1, padding: "14px 12px",
                  background: "none", border: "none",
                  borderRight: "1px solid rgba(0,0,0,0.1)",
                  fontSize: "16px", fontWeight: 600,
                  color: "#636366", cursor: "pointer",
                  transition: "background 0.12s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                {cancelText}
              </button>
              <button
                onClick={() => onClose(true)}
                style={{
                  flex: 1, padding: "14px 12px",
                  background: "none", border: "none",
                  fontSize: "16px", fontWeight: 700,
                  color: destructive ? "#FF3B30" : "#007AFF",
                  cursor: "pointer",
                  transition: "background 0.12s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                {confirmText}
              </button>
            </>
          )}
          {type === "alert" && (
            <button
              onClick={() => onClose(true)}
              style={{
                width: "100%", padding: "14px",
                background: "none", border: "none",
                fontSize: "16px", fontWeight: 700,
                color: "#007AFF", cursor: "pointer",
                transition: "background 0.12s",
                fontFamily: "inherit",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              {opts.confirmText || "Aceptar"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
