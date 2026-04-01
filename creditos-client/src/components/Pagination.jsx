import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function Pagination({
  page = 1,
  pageSize = 10,
  totalItems = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  variant = "light",
}) {
  const isDark = variant === "dark";
  const safePage = Math.max(1, Math.min(page || 1, totalPages || 1));
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(totalItems, safePage * pageSize);

  const handlePrev = () => { if (safePage > 1 && onPageChange) onPageChange(safePage - 1); };
  const handleNext = () => { if (safePage < totalPages && onPageChange) onPageChange(safePage + 1); };
  const handlePageSizeChange = (evt) => {
    if (onPageSizeChange) onPageSizeChange(Number(evt.target.value) || pageSize);
  };

  const navBtnStyle = (disabled) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: isDark ? (disabled ? "transparent" : "rgba(255, 255, 255, 0.08)") : "var(--ios-fill)",
    color: disabled ? (isDark ? "rgba(255, 255, 255, 0.15)" : "var(--ios-label-quat)") : (isDark ? "#fff" : "var(--ios-blue)"),
    border: isDark && !disabled ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  });

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      padding: "6px 12px",
      background: isDark ? "rgba(20, 25, 45, 0.6)" : "var(--ios-bg-card)",
      backdropFilter: isDark ? "blur(30px) saturate(190%)" : "none",
      WebkitBackdropFilter: isDark ? "blur(30px) saturate(190%)" : "none",
      borderRadius: "99px",
      border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1.5px solid var(--ios-sep-opaque)",
      boxShadow: isDark ? "0 10px 40px rgba(0,0,0,0.4)" : "var(--ios-shadow-sm)",
      width: "fit-content",
      margin: "24px auto",
      minWidth: "300px"
    }}>
      {/* Texto de Rango - Horizontal y Elegante */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px", paddingLeft: "10px" }}>
        <span style={{ fontSize: "15px", fontWeight: 800, color: isDark ? "#fff" : "var(--ios-label)", letterSpacing: "-0.02em" }}>
          {startItem}–{endItem}
        </span>
        <span style={{ fontSize: "11px", fontWeight: 600, color: isDark ? "rgba(255,255,255,0.35)" : "var(--ios-label-sec)", textTransform: "uppercase" }}>
          de {totalItems}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Selector de Filas Ultra-Minimalista */}
        {onPageSizeChange && (
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              style={{
                height: "34px",
                padding: "0 10px",
                borderRadius: "10px",
                background: isDark ? "rgba(255, 255, 255, 0.05)" : "var(--ios-fill)",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                color: isDark ? "rgba(255,255,255,0.7)" : "var(--ios-label-sec)",
                outline: "none",
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            >
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt} style={{ background: "#1c2b4a", color: "#fff" }}>{opt}</option>
              ))}
            </select>
            <div style={{ fontSize: "8px", color: isDark ? "rgba(255,255,255,0.3)" : "var(--ios-label-ter)", marginLeft: "-18px", pointerEvents: "none" }}>▼</div>
          </div>
        )}

        {/* Grupo de Navegación Estilo iOS */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", background: isDark ? "rgba(255,255,255,0.03)" : "var(--ios-fill)", padding: "3px", borderRadius: "99px", border: isDark ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
          <button type="button" onClick={handlePrev} disabled={safePage <= 1} style={navBtnStyle(safePage <= 1)}>
            <HiChevronLeft style={{ width: "22px", height: "22px" }} />
          </button>

          <div style={{ minWidth: "40px", textAlign: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: isDark ? "#fff" : "var(--ios-label)", letterSpacing: "-0.01em" }}>
               {safePage}
            </span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.25)" : "var(--ios-label-ter)", marginLeft: "4px" }}>
               / {totalPages || 1}
            </span>
          </div>

          <button type="button" onClick={handleNext} disabled={safePage >= totalPages} style={navBtnStyle(safePage >= totalPages)}>
            <HiChevronRight style={{ width: "22px", height: "22px" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
