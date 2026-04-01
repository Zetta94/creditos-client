import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { HiArrowLeft, HiCheck, HiLockClosed } from "react-icons/hi";
import { fetchCredit, updateCredit } from "../services/creditsService";
import { loadUsers } from "../store/employeeSlice";

const CREDIT_TYPES = [
  { value: "DAILY",    label: "Diario"     },
  { value: "WEEKLY",   label: "Semanal"    },
  { value: "QUINCENAL",label: "Quincenal"  },
  { value: "MONTHLY",  label: "Mensual"    },
  { value: "ONE_TIME", label: "Pago único" },
];
const CREDIT_STATUS = [
  { value: "PENDING", label: "Pendiente" },
  { value: "OVERDUE", label: "Vencido"   },
  { value: "PAID",    label: "Pagado"    },
];

const toDateInput = value => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const computeScheduledDueDate = (baseDate, total, type) => {
  if (!baseDate || !total || Number(total) <= 0) return "";
  const due = new Date(`${baseDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return "";
  const n = Math.max(0, Number(total));
  switch (type) {
    case "DAILY":    due.setDate(due.getDate() + n); break;
    case "WEEKLY":   due.setDate(due.getDate() + n * 7); break;
    case "QUINCENAL":due.setDate(due.getDate() + n * 15); break;
    case "MONTHLY":  default: due.setMonth(due.getMonth() + n); break;
  }
  return toDateInput(due);
};

const computeAdvanceDueDate = (baseDate, total, paid, type) => {
  if (!baseDate || !total || Number(total) <= 0) return "";
  const start = new Date(`${baseDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return "";
  const today = new Date(); today.setHours(0,0,0,0);
  const base = start > today ? start : today;
  const due = new Date(base);
  const remaining = Math.max(0, Number(total) - Number(paid));
  switch (type) {
    case "DAILY":    due.setDate(due.getDate() + remaining); break;
    case "WEEKLY":   due.setDate(due.getDate() + remaining * 7); break;
    case "QUINCENAL":due.setDate(due.getDate() + remaining * 15); break;
    case "MONTHLY":  default: due.setMonth(due.getMonth() + remaining); break;
  }
  return toDateInput(due);
};

const inferInstallmentMode = data => {
  const scheduled = computeScheduledDueDate(toDateInput(data?.firstPaymentDate ?? data?.startDate), data?.totalInstallments, data?.type);
  const stored = toDateInput(data?.dueDate);
  return scheduled && stored && stored < scheduled ? "ADVANCE" : "ARREARS";
};

/* ── Field components ── */
const inputBase = {
  height: "46px", padding: "0 14px", borderRadius: "12px",
  border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)",
  fontSize: "15px", color: "var(--ios-label)", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s",
  WebkitAppearance: "none", appearance: "none", width: "100%",
};
const onFocus = e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; e.target.style.background = "#fff"; };
const onBlur  = e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--ios-fill)"; };

function Field({ label, readOnly = false, children, span2 = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", gridColumn: span2 ? "1 / -1" : undefined }}>
      <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ios-label-sec)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "5px" }}>
        {label}
        {readOnly && <HiLockClosed style={{ width: "11px", height: "11px", color: "var(--ios-label-ter)" }} />}
      </label>
      {children}
    </div>
  );
}

export default function CreditoEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list: users = [] } = useSelector(state => state.employees ?? { list: [] });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [credito, setCredito] = useState(null);
  const [form, setForm] = useState({
    userId: "", type: "MONTHLY", installmentMode: "ARREARS",
    amount: "", installmentAmount: "", totalInstallments: "", paidInstallments: "",
    receivedAmount: "", nextInstallmentToCharge: "",
    startDate: "", firstPaymentDate: "", dueDate: "", status: "PENDING",
  });

  const isSinglePayment = form.type === "ONE_TIME";
  const primaryDateLabel = isSinglePayment ? "Fecha de pago" : "Fecha de otorgamiento";
  const cobradores = useMemo(() => users.filter(u => u.role === "COBRADOR" || u.role === "EMPLOYEE"), [users]);

  useEffect(() => { if (!users.length) dispatch(loadUsers()); }, [users.length, dispatch]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchCredit(id)
      .then(res => {
        const data = res.data;
        setCredito(data);
        setForm({
          userId: data.userId || "", type: data.type || "MONTHLY",
          installmentMode: inferInstallmentMode(data),
          amount: data.amount ?? "", installmentAmount: data.installmentAmount ?? "",
          totalInstallments: data.totalInstallments ?? "", paidInstallments: data.paidInstallments ?? "",
          receivedAmount: data.receivedAmount ?? "", nextInstallmentToCharge: data.nextInstallmentToCharge ?? "",
          startDate: toDateInput(data.startDate), firstPaymentDate: toDateInput(data.firstPaymentDate ?? data.startDate),
          dueDate: toDateInput(data.dueDate), status: data.status || "PENDING",
        });
      })
      .catch(() => toast.error("No se pudo cargar el crédito"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  useEffect(() => {
    setForm(prev => {
      const ia = Number(prev.installmentAmount || 0);
      const ti = Number(prev.totalInstallments || 0);
      const pi = Math.min(Math.max(0, Number(prev.paidInstallments || 0)), ti > 0 ? ti : Infinity);
      const base = prev.type === "ONE_TIME" ? prev.startDate : prev.firstPaymentDate;
      const received = ia > 0 ? ia * pi : 0;
      const next = ti > 0 ? (pi >= ti ? "" : String(pi + 1)) : "";
      const dueDate = prev.installmentMode === "ADVANCE"
        ? computeAdvanceDueDate(base, ti, pi, prev.type)
        : computeScheduledDueDate(base, ti, prev.type);
      const status = ti > 0 && pi >= ti ? "PAID" : prev.status === "PAID" ? "PENDING" : prev.status;
      return { ...prev, paidInstallments: String(pi), receivedAmount: String(received), nextInstallmentToCharge: next, dueDate, status };
    });
  }, [form.installmentAmount, form.totalInstallments, form.paidInstallments, form.startDate, form.firstPaymentDate, form.type, form.installmentMode]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Ingresá un monto válido"); return; }
    if (!form.startDate) { toast.error(`La ${primaryDateLabel.toLowerCase()} es obligatoria`); return; }
    if (!isSinglePayment && !form.firstPaymentDate) { toast.error("La fecha de primer pago es obligatoria"); return; }
    if (!isSinglePayment && Number(form.totalInstallments || 0) < 2) { toast.error("Mínimo 2 cuotas en planes recurrentes"); return; }
    const payload = {
      userId: form.userId || null, type: form.type, installmentMode: form.installmentMode,
      amount: Number(form.amount), status: form.status,
      installmentAmount: form.installmentAmount === "" ? null : Number(form.installmentAmount),
      totalInstallments: form.totalInstallments === "" ? null : Number(form.totalInstallments),
      paidInstallments: form.paidInstallments === "" ? 0 : Number(form.paidInstallments),
      receivedAmount: form.receivedAmount === "" ? 0 : Number(form.receivedAmount),
      nextInstallmentToCharge: form.nextInstallmentToCharge === "" ? null : Number(form.nextInstallmentToCharge),
      startDate: new Date(`${form.startDate}T00:00:00`).toISOString(),
      firstPaymentDate: isSinglePayment ? null : (form.firstPaymentDate ? new Date(`${form.firstPaymentDate}T00:00:00`).toISOString() : null),
      dueDate: form.dueDate ? new Date(`${form.dueDate}T00:00:00`).toISOString() : null,
    };
    try {
      setSaving(true);
      await updateCredit(id, payload);
      toast.success("Crédito actualizado con éxito");
      navigate(`/creditos/${id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo actualizar el crédito");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "720px", margin: "0 auto" }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: "60px", borderRadius: "12px" }} />)}
    </div>
  );

  if (!credito) return (
    <div style={{ textAlign: "center", padding: "60px", color: "var(--ios-red)", fontSize: "16px" }}>
      Crédito no encontrado.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "720px", margin: "0 auto" }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={() => navigate(`/creditos/${id}`)}
          style={{ width: "40px", height: "40px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-bg-card)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <HiArrowLeft style={{ width: "18px", height: "18px", color: "var(--ios-label-sec)" }} />
        </button>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.02em" }}>Editar crédito</h1>
          <p style={{ fontSize: "13px", color: "var(--ios-label-sec)", margin: "3px 0 0" }}>{credito.client?.name || "Sin cliente"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="ios-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

            {/* Cliente (solo lectura) */}
            <Field label="Cliente" readOnly>
              <div style={{ ...inputBase, display: "flex", alignItems: "center", background: "var(--ios-fill)", color: "var(--ios-label-sec)", fontStyle: "italic" }}>
                {credito.client?.name || "Sin cliente"}
              </div>
            </Field>

            {/* Cobrador */}
            <Field label="Cobrador">
              <select name="userId" value={form.userId} onChange={handleChange} style={inputBase} onFocus={onFocus} onBlur={onBlur}>
                <option value="">Sin asignar</option>
                {cobradores.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>

            {/* Tipo */}
            <Field label="Tipo de crédito">
              <select name="type" value={form.type} onChange={handleChange} style={inputBase} onFocus={onFocus} onBlur={onBlur}>
                {CREDIT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            {/* Estado */}
            <Field label="Estado">
              <select name="status" value={form.status} onChange={handleChange} style={inputBase} onFocus={onFocus} onBlur={onBlur}>
                {CREDIT_STATUS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            {/* Modo cuotas */}
            <Field label="Modo de cuotas" span2>
              <select name="installmentMode" value={form.installmentMode} onChange={handleChange} style={inputBase} onFocus={onFocus} onBlur={onBlur}>
                <option value="ARREARS">Cuotas pagadas</option>
                <option value="ADVANCE">Cuotas de adelanto</option>
              </select>
            </Field>

            {/* Montos */}
            {[
              { label: "Monto base", name: "amount", type: "number", required: true },
              { label: "Monto por cuota", name: "installmentAmount", type: "number" },
              { label: "Cuotas totales", name: "totalInstallments", type: "number" },
              { label: "Cuotas pagadas", name: "paidInstallments", type: "number" },
            ].map(f => (
              <Field key={f.name} label={f.label}>
                <input name={f.name} type={f.type} value={form[f.name]} onChange={handleChange} required={f.required} style={inputBase} onFocus={onFocus} onBlur={onBlur} />
              </Field>
            ))}

            {/* Read-only */}
            {[
              { label: "Monto recibido", name: "receivedAmount" },
              { label: "Próxima cuota", name: "nextInstallmentToCharge" },
            ].map(f => (
              <Field key={f.name} label={f.label} readOnly>
                <div style={{ ...inputBase, display: "flex", alignItems: "center", background: "var(--ios-fill)", color: "var(--ios-label-sec)" }}>{form[f.name] || "—"}</div>
              </Field>
            ))}

            {/* Fechas */}
            <Field label={primaryDateLabel}>
              <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required style={inputBase} onFocus={onFocus} onBlur={onBlur} />
            </Field>

            {!isSinglePayment && (
              <Field label="Fecha del primer pago">
                <input name="firstPaymentDate" type="date" value={form.firstPaymentDate} onChange={handleChange} required style={inputBase} onFocus={onFocus} onBlur={onBlur} />
              </Field>
            )}

            <Field label="Fecha de vencimiento" readOnly>
              <div style={{ ...inputBase, display: "flex", alignItems: "center", background: "var(--ios-fill)", color: "var(--ios-label-sec)" }}>{form.dueDate || "—"}</div>
            </Field>
          </div>

          {/* Acciones */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px", borderTop: "1px solid var(--ios-sep-opaque)" }}>
            <button
              type="button"
              onClick={() => navigate(`/creditos/${id}`)}
              style={{ padding: "12px 20px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", fontSize: "15px", fontWeight: 700, color: "var(--ios-label-sec)", cursor: "pointer" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "12px 22px", borderRadius: "12px", border: "none", background: saving ? "var(--ios-fill)" : "var(--ios-blue)", fontSize: "15px", fontWeight: 700, color: saving ? "var(--ios-label-ter)" : "#fff", cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : "0 4px 12px rgba(0,122,255,0.3)", transition: "all 0.15s" }}
            >
              <HiCheck style={{ width: "16px", height: "16px" }} />
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
