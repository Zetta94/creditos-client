import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchDashboardFinancialDetail } from "../services/dashboardService";
import Pagination from "../components/Pagination";
import { HiArrowLeft, HiDownload, HiCurrencyDollar, HiTrendingUp, HiTrendingDown, HiUsers, HiChartBar } from "react-icons/hi";

const FINANCIAL_PERIODS = [
  { key: "week",  label: "Semana" },
  { key: "month", label: "Mes"    },
  { key: "year",  label: "Año"    },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const label = new Date(2000, i, 1).toLocaleDateString("es-AR", { month: "long" });
  return { value: i + 1, label: label.charAt(0).toUpperCase() + label.slice(1) };
});

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = (() => {
  const opts = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
  if (!opts.includes(2025)) opts.push(2025);
  return opts.sort((a, b) => b - a);
})();

const toLocalDateIso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];

const formatDateLocale = (value, options = {}) => {
  if (!value) return "";
  const source = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("es-AR", options);
};

const formatDateTimeLocale = value => {
  if (!value) return "";
  const source = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.toLocaleDateString("es-AR")} ${date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
};

const getMonthLabel = m => MONTH_OPTIONS.find(o => o.value === Number(m))?.label || `Mes ${m}`;

/* ── Shared input style ── */
const inputStyle = {
  height: "40px", padding: "0 12px", borderRadius: "10px",
  border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)",
  fontSize: "14px", color: "var(--ios-label)", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s",
  WebkitAppearance: "none", appearance: "none", width: "100%",
};
const onFocus = e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; e.target.style.background = "#fff"; };
const onBlur  = e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--ios-fill)"; };

/* ── KPI card ── */
function KpiCard({ label, value, color = "#007AFF", bg = "#EBF3FF", icon: Icon }) {
  return (
    <div className="ios-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)" }}>{label}</span>
        {Icon && (
          <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon style={{ width: "16px", height: "16px", color }} />
          </div>
        )}
      </div>
      <p style={{ fontSize: "22px", fontWeight: 800, color: "var(--ios-label)", margin: 0 }}>{value}</p>
    </div>
  );
}

/* ── Section title ── */
function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 12px", letterSpacing: "-0.01em" }}>
      {children}
    </h2>
  );
}

/* ── iOS Table ── */
function IosTable({ headers, rows, emptyText = "Sin datos" }) {
  return (
    <div style={{ background: "var(--ios-bg-card)", borderRadius: "14px", boxShadow: "var(--ios-shadow-sm)", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{ padding: "11px 14px", background: "var(--ios-fill)", borderBottom: "1px solid var(--ios-sep-opaque)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-sec)", textAlign: "left" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} style={{ padding: "32px", textAlign: "center", color: "var(--ios-label-ter)", fontSize: "14px" }}>{emptyText}</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--ios-sep-opaque)" : "none", transition: "background 0.12s" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "12px 14px", fontSize: "13px", color: "var(--ios-label)", fontWeight: j === 0 ? 600 : 400 }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FinancialDetail() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("month");
  const [weekDate, setWeekDate] = useState(() => toLocalDateIso(new Date()));
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPageSize, setPaymentsPageSize] = useState(20);

  const buildParams = useCallback(() => {
    const p = { period };
    if (period === "week") p.reference = weekDate;
    else if (period === "month") { p.year = year; p.month = month; }
    else p.year = year;
    return p;
  }, [period, weekDate, month, year]);

  const loadDetail = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchDashboardFinancialDetail(buildParams());
      const payload = res?.data ?? null;
      if (!payload) { setData(null); setError("No hay datos para este período."); return; }
      setData(payload);
    } catch { setData(null); setError("No se pudo cargar el detalle financiero."); }
    finally { setLoading(false); }
  }, [buildParams]);

  useEffect(() => { loadDetail(); }, [loadDetail]);
  useEffect(() => { setPaymentsPage(1); }, [period, weekDate, month, year, data]);

  const selectionLabel = useMemo(() => {
    if (period === "week") { const f = formatDateLocale(weekDate); return f ? `Semana del ${f}` : "Semana"; }
    if (period === "month") return `${getMonthLabel(month)} ${year}`;
    return `Año ${year}`;
  }, [period, weekDate, month, year]);

  const rangeLabel = useMemo(() => {
    if (!data?.range) return null;
    const s = formatDateLocale(data.range.start), e = formatDateLocale(data.range.end);
    return s && e ? `${s} · ${e}` : null;
  }, [data]);

  const totals = data?.totals ?? null;
  const netProfit = totals?.netProfit ?? 0;
  const payments = data?.payments ?? [];
  const totalPages = Math.max(1, Math.ceil(payments.length / paymentsPageSize));
  const safePage = Math.min(paymentsPage, totalPages);
  const paginatedPayments = payments.slice((safePage - 1) * paymentsPageSize, safePage * paymentsPageSize);

  const fmt = useMemo(() => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }), []);
  const toCurrency = useCallback(v => fmt.format(v ?? 0), [fmt]);
  const canDownloadPdf = period !== "week" && !!data && !loading;

  const handleDownloadPdf = () => {
    if (!data || period === "week") return;
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    doc.text(`Detalle financiero - ${selectionLabel}`, pw / 2, 18, { align: "center" });
    if (rangeLabel) { doc.setFontSize(11); doc.text(rangeLabel, 14, 30); }
    const t = data.totals ?? {};
    autoTable(doc, { startY: 38, head: [["Ingresos", "Gastos", "Payroll", "G. Operativos", "Ganancia neta"]], body: [[toCurrency(t.income ?? 0), toCurrency(t.totalExpenses ?? 0), toCurrency(t.payroll ?? 0), toCurrency(t.operationalExpenses ?? 0), toCurrency(t.netProfit ?? 0)]] });
    let ny = doc.lastAutoTable?.finalY + 8 || 48;
    if (data.payments?.length) {
      autoTable(doc, { startY: ny, head: [["Fecha", "Cliente", "Cobrador", "Monto", "Método"]], body: data.payments.slice(0, 20).map(p => [formatDateTimeLocale(p.date), p.client?.name ?? "-", p.collector?.name ?? "-", toCurrency(p.amount ?? 0), p.methodSummary ?? "-"]) });
      ny = doc.lastAutoTable?.finalY + 8 || ny + 8;
    }
    const suffix = period === "month" ? `${year}-${String(month).padStart(2, "0")}` : `${year}`;
    doc.save(`detalle-financiero-${suffix}.pdf`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.025em" }}>Detalle Financiero</h1>
          <p style={{ fontSize: "14px", color: "var(--ios-label-sec)", margin: "4px 0 0" }}>{rangeLabel || selectionLabel}</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/")}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-bg-card)", fontSize: "14px", fontWeight: 600, color: "var(--ios-label-sec)", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--ios-bg-card)"}
          >
            <HiArrowLeft style={{ width: "16px", height: "16px" }} /> Dashboard
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={!canDownloadPdf}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "12px", border: "none", background: canDownloadPdf ? "#E8F8ED" : "var(--ios-fill)", fontSize: "14px", fontWeight: 700, color: canDownloadPdf ? "#34C759" : "var(--ios-label-ter)", cursor: canDownloadPdf ? "pointer" : "not-allowed", transition: "all 0.15s" }}
          >
            <HiDownload style={{ width: "16px", height: "16px" }} /> PDF
          </button>
        </div>
      </div>

      {/* Selector de período */}
      <div className="ios-card" style={{ padding: "18px" }}>

        {/* Segmented control periodo */}
        <div style={{ display: "inline-flex", padding: "4px", background: "var(--ios-fill)", borderRadius: "12px", gap: "2px", marginBottom: "16px" }}>
          {FINANCIAL_PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              style={{
                padding: "8px 20px", borderRadius: "9px", border: "none",
                background: period === key ? "#fff" : "transparent",
                boxShadow: period === key ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                fontSize: "14px", fontWeight: 700,
                color: period === key ? "var(--ios-blue)" : "var(--ios-label-sec)",
                cursor: "pointer", transition: "all 0.18s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtros por período */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {period === "week" && (
            <div style={{ flex: "0 0 auto" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ios-label-ter)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>Día de la semana</label>
              <input type="date" value={weekDate} onChange={e => setWeekDate(e.target.value)} style={{ ...inputStyle, width: "auto" }} onFocus={onFocus} onBlur={onBlur} />
            </div>
          )}
          {(period === "month" || period === "year") && (
            <>
              {period === "month" && (
                <div style={{ flex: "0 0 auto" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ios-label-ter)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>Mes</label>
                  <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ ...inputStyle, width: "auto", minWidth: "140px" }} onFocus={onFocus} onBlur={onBlur}>
                    {MONTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}
              <div style={{ flex: "0 0 auto" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ios-label-ter)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>Año</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ ...inputStyle, width: "auto", minWidth: "110px" }} onFocus={onFocus} onBlur={onBlur}>
                  {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: "100px", borderRadius: "16px" }} />)}
        </div>
      ) : error ? (
        <div style={{ padding: "20px", background: "var(--ios-red-bg)", borderRadius: "14px", color: "var(--ios-red)", fontSize: "14px", fontWeight: 600 }}>{error}</div>
      ) : !data ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--ios-label-ter)", fontSize: "15px" }}>Sin información para esta selección.</div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "14px" }}>
            <KpiCard label="Ingresos" value={toCurrency(totals?.income ?? 0)} color="#34C759" bg="#E8F8ED" icon={HiTrendingUp} />
            <KpiCard label="Gastos" value={toCurrency(totals?.totalExpenses ?? 0)} color="#FF3B30" bg="#FFEBEA" icon={HiTrendingDown} />
            <KpiCard label="Pago empleados" value={toCurrency(totals?.payroll ?? 0)} color="#007AFF" bg="#EBF3FF" icon={HiUsers} />
            <KpiCard label="G. operativos" value={toCurrency(totals?.operationalExpenses ?? 0)} color="#FF9500" bg="#FFF3E0" icon={HiChartBar} />
            <KpiCard
              label="Ganancia neta"
              value={toCurrency(netProfit)}
              color={netProfit >= 0 ? "#34C759" : "#FF3B30"}
              bg={netProfit >= 0 ? "#E8F8ED" : "#FFEBEA"}
              icon={HiCurrencyDollar}
            />
          </div>

          {/* Desglose */}
          {data.breakdown?.entries?.length ? (
            <div>
              <SectionTitle>
                Desglose por {data.breakdown.type === "month" ? "mes" : data.breakdown.type === "week" ? "semana" : "segmento"}
              </SectionTitle>
              <IosTable
                headers={["Período", "Ingresos", "Gastos"]}
                rows={data.breakdown.entries.map(e => [e.label, toCurrency(e.income ?? 0), toCurrency(e.expenses ?? 0)])}
              />
            </div>
          ) : null}

          {/* Cobradores */}
          {data.collectors?.length ? (
            <div>
              <SectionTitle>Desempeño de cobradores</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                {data.collectors.map(c => (
                  <div key={c.id ?? c.name} className="ios-card" style={{ padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--ios-label)", margin: 0 }}>{c.name ?? "Sin nombre"}</p>
                      <span style={{
                        padding: "4px 10px", borderRadius: "99px",
                        background: c.completed ? "#E8F8ED" : "#FFF3E0",
                        color: c.completed ? "#34C759" : "#FF9500",
                        fontSize: "11px", fontWeight: 700,
                      }}>
                        {c.completed ? "Completo" : "En progreso"}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                      {[
                        { label: "Recaudado", value: toCurrency(c.totalCollected ?? 0) },
                        { label: "Cobrados", value: c.clientsPaid?.length ?? 0 },
                        { label: "Pendientes", value: c.clientsPending?.length ?? 0 },
                      ].map(item => (
                        <div key={item.label} style={{ background: "var(--ios-fill)", borderRadius: "10px", padding: "8px 10px" }}>
                          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ios-label-ter)", margin: "0 0 4px" }}>{item.label}</p>
                          <p style={{ fontSize: "13px", fontWeight: 800, color: "var(--ios-label)", margin: 0 }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    {c.clientsPaid?.length ? (
                      <div style={{ marginTop: "10px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ios-label-sec)", margin: "0 0 4px" }}>Clientes al día</p>
                        {c.clientsPaid.slice(0, 3).map(cl => (
                          <p key={cl.id ?? cl.name} style={{ fontSize: "12px", color: "var(--ios-label-ter)", margin: "2px 0" }}>
                            {cl.name} · {toCurrency(cl.totalPaid ?? 0)}
                          </p>
                        ))}
                        {c.clientsPaid.length > 3 && <p style={{ fontSize: "11px", color: "var(--ios-blue)", fontWeight: 600, margin: "4px 0 0" }}>+{c.clientsPaid.length - 3} más</p>}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Pagos */}
          {data.payments?.length ? (
            <div>
              <SectionTitle>Pagos registrados ({data.payments.length})</SectionTitle>
              <IosTable
                headers={["Fecha", "Cliente", "Cobrador", "Monto", "Método"]}
                rows={paginatedPayments.map(p => [
                  formatDateTimeLocale(p.date),
                  p.client?.name ?? "-",
                  p.collector?.name ?? "-",
                  toCurrency(p.amount ?? 0),
                  p.methodSummary ?? "-",
                ])}
              />
              <div style={{ marginTop: "12px" }}>
                <Pagination
                  page={safePage} pageSize={paymentsPageSize}
                  totalItems={payments.length} totalPages={totalPages}
                  onPageChange={setPaymentsPage}
                  onPageSizeChange={size => { setPaymentsPageSize(size); setPaymentsPage(1); }}
                  pageSizeOptions={[10, 20, 50, 100]}
                />
              </div>
            </div>
          ) : null}

          {/* Gastos */}
          {data.expenses?.length ? (
            <div>
              <SectionTitle>Gastos registrados ({data.expenses.length})</SectionTitle>
              <IosTable
                headers={["Fecha", "Descripción", "Categoría", "Monto"]}
                rows={data.expenses.map(e => [
                  formatDateLocale(e.incurredOn),
                  e.description ?? "-",
                  e.category ?? "-",
                  toCurrency(e.amount ?? 0),
                ])}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
