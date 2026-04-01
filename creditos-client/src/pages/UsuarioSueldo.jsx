import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HiArrowLeft, HiCurrencyDollar, HiTrendingUp, HiCheckCircle } from "react-icons/hi";
import toast from "react-hot-toast";
import { fetchUser } from "../services/usersService";
import { fetchWeeklyPayrollHistory, fetchWeeklyPayrollPreview, recordWeeklyPayrollPayment } from "../services/reportsService";

const inputStyle = {
  height: "44px", padding: "0 14px", borderRadius: "12px",
  border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)",
  fontSize: "15px", color: "var(--ios-label)", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
  WebkitAppearance: "none", appearance: "none", width: "100%",
};
const onFocus = e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; e.target.style.background = "#fff"; };
const onBlur = e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--ios-fill)"; };

export default function UsuarioSueldo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [payrollPreview, setPayrollPreview] = useState(null);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [selectedPayrollWeekStart, setSelectedPayrollWeekStart] = useState("");
  const [payrollForm, setPayrollForm] = useState(() => buildPayrollFormState(null));
  const [loading, setLoading] = useState(true);
  const [savingPayroll, setSavingPayroll] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadUser = async () => {
      setLoading(true);
      try {
        const response = await fetchUser(id);
        setUsuario(response?.data ?? null);
      } catch { setUsuario(null); }
      finally { setLoading(false); }
    };
    loadUser();
  }, [id]);

  useEffect(() => {
    const role = (usuario?.role || "").toUpperCase();
    const isCollector = role === "COBRADOR" || role === "EMPLOYEE";
    if (!id || !isCollector) {
      setPayrollPreview(null); setPayrollHistory([]);
      setSelectedPayrollWeekStart(""); setPayrollForm(buildPayrollFormState(null));
      return;
    }
    const loadPayroll = async () => {
      setLoading(true);
      try {
        const [previewRes, historyRes] = await Promise.all([
          fetchWeeklyPayrollPreview({ userId: id, ...(selectedPayrollWeekStart ? { weekStart: selectedPayrollWeekStart } : {}) }),
          fetchWeeklyPayrollHistory({ userId: id, weeks: 10 }),
        ]);
        const nextPreview = previewRes?.data ?? null;
        const nextHistory = Array.isArray(historyRes?.data?.data) ? historyRes.data.data : [];
        setPayrollPreview(nextPreview); setPayrollHistory(nextHistory);
        setPayrollForm(buildPayrollFormState(nextPreview));
        if (!selectedPayrollWeekStart && nextPreview?.weekStart) setSelectedPayrollWeekStart(nextPreview.weekStart);
      } catch { setPayrollPreview(null); setPayrollHistory([]); setPayrollForm(buildPayrollFormState(null)); }
      finally { setLoading(false); }
    };
    loadPayroll();
  }, [id, usuario?.role, selectedPayrollWeekStart]);

  const payrollWeekOptions = useMemo(() => {
    const seen = new Set();
    const options = [];
    const appendOption = (item) => {
      if (!item?.weekStart || seen.has(item.weekStart)) return;
      seen.add(item.weekStart);
      options.push({ value: item.weekStart, label: `${formatDate(item.weekStart)} al ${formatDate(item.weekEnd)}` });
    };
    appendOption(payrollPreview);
    payrollHistory.forEach(appendOption);
    return options;
  }, [payrollPreview, payrollHistory]);

  const payrollSuggestedTotal = Number(payrollPreview?.weeklySalary || 0) + Number(payrollPreview?.totalCommission || 0);
  const payrollRecordedTotal = Number(payrollForm.paidSalaryAmount || 0) + (payrollForm.commissionPaid ? Number(payrollForm.paidCommissionAmount || 0) : 0);

  const handlePayrollFieldChange = (field, value) => setPayrollForm(prev => ({ ...prev, [field]: value }));
  const handleCommissionToggle = () => setPayrollForm(prev => {
    const nextCommissionPaid = !prev.commissionPaid;
    return { ...prev, commissionPaid: nextCommissionPaid, paidCommissionAmount: nextCommissionPaid && !prev.paidCommissionAmount ? String(Number(payrollPreview?.totalCommission || 0)) : prev.paidCommissionAmount };
  });

  const handleSavePayroll = async () => {
    if (!payrollPreview) return;
    const paidSalaryAmount = Number(payrollForm.paidSalaryAmount);
    const paidCommissionAmount = payrollForm.commissionPaid ? Number(payrollForm.paidCommissionAmount) : 0;
    if (!Number.isFinite(paidSalaryAmount) || paidSalaryAmount < 0) { toast.error("Indicá un sueldo pagado válido."); return; }
    if (payrollForm.commissionPaid && (!Number.isFinite(paidCommissionAmount) || paidCommissionAmount <= 0)) { toast.error("Indicá cuánto se pagó de comisión."); return; }
    setSavingPayroll(true);
    try {
      await recordWeeklyPayrollPayment({ userId: id, weekStart: selectedPayrollWeekStart || payrollPreview.weekStart, paidSalaryAmount, commissionPaid: payrollForm.commissionPaid, paidCommissionAmount, notes: payrollForm.notes?.trim() || undefined });
      const [previewRes, historyRes] = await Promise.all([
        fetchWeeklyPayrollPreview({ userId: id, ...(selectedPayrollWeekStart || payrollPreview.weekStart ? { weekStart: selectedPayrollWeekStart || payrollPreview.weekStart } : {}) }),
        fetchWeeklyPayrollHistory({ userId: id, weeks: 10 }),
      ]);
      const nextPreview = previewRes?.data ?? null;
      setPayrollPreview(nextPreview);
      setPayrollHistory(Array.isArray(historyRes?.data?.data) ? historyRes.data.data : []);
      setPayrollForm(buildPayrollFormState(nextPreview));
      toast.success("Pago registrado correctamente.");
    } catch (error) {
      toast.error(error?.response?.data?.error || "No se pudo registrar el pago.");
    } finally { setSavingPayroll(false); }
  };

  if (loading && !usuario) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "16px" }} />)}
    </div>
  );
  if (!usuario) return <div style={{ padding: "40px", textAlign: "center", color: "var(--ios-label-sec)" }}>Usuario no encontrado.</div>;

  const role = (usuario.role || "").toUpperCase();
  const isCollector = role === "COBRADOR" || role === "EMPLOYEE";

  if (!isCollector) return (
    <div className="ios-card" style={{ padding: "32px", textAlign: "center" }}>
      <p style={{ fontSize: "16px", color: "var(--ios-label-sec)" }}>Esta pantalla solo aplica para usuarios cobradores.</p>
      <button onClick={() => navigate(`/usuarios/${id}`)} style={{ marginTop: "16px", padding: "10px 20px", borderRadius: "12px", border: "none", background: "var(--ios-blue)", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
        Volver al usuario
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <button onClick={() => navigate(`/usuarios/${id}`)}
          style={{ width: "40px", height: "40px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-bg-card)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--ios-bg-card)"}
        >
          <HiArrowLeft style={{ width: "18px", height: "18px", color: "var(--ios-blue)" }} />
        </button>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.025em" }}>Sueldo y comisión</h1>
          <p style={{ fontSize: "13px", color: "var(--ios-label-ter)", margin: "2px 0 0" }}>{usuario.name}</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
        {[
          { label: "Sueldo sugerido", value: formatCurrency(payrollPreview?.weeklySalary || 0), icon: HiCurrencyDollar, color: "#004299", bg: "#EBF3FF" },
          { label: "Comisión sugerida", value: formatCurrency(payrollPreview?.totalCommission || 0), icon: HiTrendingUp, color: "#1A6B36", bg: "#E8F8ED" },
          { label: "Total sugerido", value: formatCurrency(payrollSuggestedTotal), icon: HiCheckCircle, color: "#7C4A00", bg: "#FFF3E0" },
        ].map(k => (
          <div key={k.label} className="ios-card" style={{ padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", margin: 0 }}>{k.label}</p>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: k.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <k.icon style={{ width: "16px", height: "16px", color: k.color }} />
              </div>
            </div>
            <p style={{ fontSize: "20px", fontWeight: 800, color: "var(--ios-label)", margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Formulario de pago */}
      <div className="ios-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", margin: "0 0 2px" }}>Liquidación</p>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: 0 }}>Registrar pago semanal</h2>
          </div>
          <span style={{
            padding: "5px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: 700,
            background: payrollPreview?.payment ? "#E8F8ED" : "#FFF3E0",
            color: payrollPreview?.payment ? "#1A6B36" : "#7C4A00",
          }}>
            {payrollPreview?.payment ? "Pago registrado" : "Pendiente"}
          </span>
        </div>

        <p style={{ fontSize: "13px", color: "var(--ios-label-sec)", margin: "0 0 14px" }}>
          Semana: {formatDate(payrollPreview?.weekStart)} al {formatDate(payrollPreview?.weekEnd)}
        </p>

        {/* Selector semana */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-sec)", display: "block", marginBottom: "6px" }}>Semana</label>
          <select value={selectedPayrollWeekStart || payrollPreview?.weekStart || ""} onChange={e => setSelectedPayrollWeekStart(e.target.value)} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
            {payrollWeekOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          {/* Sueldo */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-sec)", display: "block", marginBottom: "6px" }}>Sueldo pagado</label>
            <input type="number" value={payrollForm.paidSalaryAmount} onChange={e => handlePayrollFieldChange("paidSalaryAmount", e.target.value)} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
          {/* Toggle comisión */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-sec)", display: "block", marginBottom: "6px" }}>Comisión pagada</label>
            <button type="button" onClick={handleCommissionToggle} style={{
              height: "44px", width: "100%", borderRadius: "12px", border: "1.5px solid",
              borderColor: payrollForm.commissionPaid ? "#34C75940" : "var(--ios-sep-opaque)",
              background: payrollForm.commissionPaid ? "#E8F8ED" : "var(--ios-fill)",
              color: payrollForm.commissionPaid ? "#1A6B36" : "var(--ios-label-sec)",
              fontSize: "14px", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px",
            }}>
              <span>{payrollForm.commissionPaid ? "Sí, se pagó" : "No se pagó"}</span>
              <span style={{ fontSize: "13px" }}>{payrollForm.commissionPaid ? "✓" : "—"}</span>
            </button>
          </div>
          {/* Monto comisión */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: payrollForm.commissionPaid ? "var(--ios-label-sec)" : "var(--ios-label-ter)", display: "block", marginBottom: "6px" }}>Monto comisión pagada</label>
            <input type="number" value={payrollForm.paidCommissionAmount} onChange={e => handlePayrollFieldChange("paidCommissionAmount", e.target.value)} disabled={!payrollForm.commissionPaid} style={{ ...inputStyle, opacity: payrollForm.commissionPaid ? 1 : 0.5 }} onFocus={onFocus} onBlur={onBlur} />
          </div>
          {/* Total */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-sec)", display: "block", marginBottom: "6px" }}>Total registrado</label>
            <div style={{ height: "44px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-bg)", display: "flex", alignItems: "center", padding: "0 14px", fontSize: "15px", fontWeight: 700, color: "var(--ios-label)" }}>
              {formatCurrency(payrollRecordedTotal)}
            </div>
          </div>
        </div>

        {/* Notas */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-sec)", display: "block", marginBottom: "6px" }}>Notas del pago</label>
          <textarea value={payrollForm.notes} onChange={e => handlePayrollFieldChange("notes", e.target.value)} placeholder="Ej: se liquidó sueldo completo y comisión..." rows={3}
            style={{ ...inputStyle, height: "auto", padding: "12px 14px", resize: "vertical" }} onFocus={onFocus} onBlur={onBlur}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={handleSavePayroll} disabled={savingPayroll}
            style={{ padding: "12px 24px", borderRadius: "12px", border: "none", background: savingPayroll ? "#A8C8FF" : "var(--ios-blue)", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: savingPayroll ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(0,122,255,0.3)" }}
          >
            {savingPayroll ? "Guardando..." : "Registrar pago"}
          </button>
        </div>
      </div>

      {/* Historial */}
      <div className="ios-card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 14px" }}>Historial de pagos</h2>
        {payrollHistory.length === 0 ? (
          <p style={{ textAlign: "center", padding: "24px", color: "var(--ios-label-ter)", fontSize: "14px" }}>No hay pagos semanales registrados para este cobrador.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {payrollHistory.map(item => (
              <div key={item.payrollKey} style={{ borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ios-label)", margin: 0 }}>Semana {formatDate(item.weekStart)}</p>
                  <span style={{ padding: "4px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: 700, background: item.payment ? "#E8F8ED" : "var(--ios-fill)", color: item.payment ? "#1A6B36" : "var(--ios-label-ter)" }}>
                    {item.payment ? "Pagado" : "Sin registrar"}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    { l: "Sueldo", v: item.payment ? formatCurrency(item.payment.paidSalaryAmount) : "—" },
                    { l: "Comisión", v: item.payment?.commissionPaid ? formatCurrency(item.payment.paidCommissionAmount) : "No pagada" },
                    { l: "Total", v: item.payment ? formatCurrency(item.payment.totalPaid) : "—" },
                  ].map(f => (
                    <div key={f.l} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", color: "var(--ios-label-sec)" }}>{f.l}</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ios-label)" }}>{f.v}</span>
                    </div>
                  ))}
                  {item.payment?.notes && <p style={{ fontSize: "12px", color: "var(--ios-label-ter)", margin: "4px 0 0" }}>{item.payment.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function buildPayrollFormState(summary) {
  const payment = summary?.payment;
  return {
    paidSalaryAmount: payment?.paidSalaryAmount != null ? String(payment.paidSalaryAmount) : String(Number(summary?.weeklySalary || 0)),
    commissionPaid: Boolean(payment?.commissionPaid),
    paidCommissionAmount: payment?.paidCommissionAmount != null ? String(payment.paidCommissionAmount) : String(Number(summary?.totalCommission || 0)),
    notes: payment?.notes || "",
  };
}
function formatCurrency(value) { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(value || 0)); }
function formatDate(value) { if (!value) return "—"; const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-AR"); }