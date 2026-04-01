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
}) {
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
    gap: "4px",
    padding: "8px 14px",
    borderRadius: "10px",
    border: "1.5px solid var(--ios-sep-opaque)",
    background: "var(--ios-bg-card)",
    fontSize: "14px",
    fontWeight: 600,
    color: disabled ? "var(--ios-label-quat)" : "var(--ios-blue)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.15s",
    minHeight: "40px",
  });

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      padding: "12px 16px",
      background: "var(--ios-bg-card)",
      borderRadius: "16px",
      boxShadow: "var(--ios-shadow-sm)",
    }}>
      {/* Texto de rango */}
      <span style={{ fontSize: "13px", color: "var(--ios-label-sec)", fontWeight: 500 }}>
        {startItem}–{endItem} de {totalItems}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        {/* Filas por página */}
        {onPageSizeChange && (
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--ios-label-sec)", fontWeight: 500 }}>
            Filas
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              style={{
                height: "36px",
                padding: "0 10px",
                borderRadius: "10px",
                border: "1.5px solid var(--ios-sep-opaque)",
                background: "var(--ios-fill)",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--ios-label)",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
        )}

        {/* Navegación */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button type="button" onClick={handlePrev} disabled={safePage <= 1} style={navBtnStyle(safePage <= 1)}>
            <HiChevronLeft style={{ width: "16px", height: "16px" }} />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ios-label-sec)", minWidth: "80px", textAlign: "center" }}>
            {safePage} / {totalPages || 1}
          </span>

          <button type="button" onClick={handleNext} disabled={safePage >= totalPages} style={navBtnStyle(safePage >= totalPages)}>
            <span className="hidden sm:inline">Siguiente</span>
            <HiChevronRight style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
