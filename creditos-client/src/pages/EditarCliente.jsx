import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { HiArrowLeft, HiCheck } from "react-icons/hi";
import { loadClient, saveClient } from "../store/clientsSlice";

/* ── Shared field component ── */
function Field({ label, children, span2 = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", gridColumn: span2 ? "1 / -1" : undefined }}>
      <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ios-label-sec)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = {
  height: "46px", padding: "0 14px", borderRadius: "12px",
  border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)",
  fontSize: "15px", color: "var(--ios-label)", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s",
  WebkitAppearance: "none", appearance: "none", width: "100%",
};
const onFocus = e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; e.target.style.background = "#fff"; };
const onBlur  = e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--ios-fill)"; };

export default function ClienteEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current, loading } = useSelector(state => state.clients) || { current: null, loading: false };

  const [form, setForm] = useState({
    name: "", phone: "", alternatePhone: "", document: "",
    address: "", city: "", province: "", email: "",
    reliability: "MEDIA", birthDate: "", status: "ACTIVE", notes: "",
  });

  useEffect(() => { dispatch(loadClient(id)); }, [dispatch, id]);

  useEffect(() => {
    if (current?.id === id) {
      setForm({
        name: current.name || "", phone: current.phone || "",
        alternatePhone: current.alternatePhone || "", document: current.document || "",
        address: current.address || "", city: current.city || "",
        province: current.province || "", email: current.email || "",
        reliability: (current.reliability || "MEDIA").toUpperCase(),
        birthDate: current.birthDate ? current.birthDate.substring(0, 10) : "",
        status: (current.status || "ACTIVE").toUpperCase(), notes: current.notes || "",
      });
    }
  }, [current, id]);

  const handle = e => setForm(s => ({ ...s, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre del cliente es requerido"); return; }
    const payload = {
      name: form.name, phone: form.phone, document: form.document,
      address: form.address, city: form.city, province: form.province, email: form.email,
      reliability: form.reliability?.toUpperCase(), status: form.status, notes: form.notes,
      alternatePhone: form.alternatePhone.trim() || undefined,
      birthDate: form.birthDate || undefined,
    };
    try {
      await dispatch(saveClient({ id, payload })).unwrap();
      toast.success("Cliente actualizado con éxito");
      navigate("/clientes", { replace: true });
    } catch (err) {
      toast.error(typeof err === "string" ? err : err?.message || "No se pudo actualizar");
    }
  };

  const handleBack = () => window.history.length > 2 ? navigate(-1) : navigate("/clientes");

  if (loading || (!current && loading !== false)) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "60px", borderRadius: "12px" }} />)}
      </div>
    );
  }

  if (!current) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <p style={{ color: "var(--ios-red)", fontSize: "16px", marginBottom: "16px" }}>Cliente no encontrado.</p>
        <button onClick={handleBack} style={{ padding: "11px 22px", borderRadius: "12px", background: "var(--ios-fill)", border: "none", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>Volver</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "720px", margin: "0 auto" }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={handleBack}
          style={{ width: "40px", height: "40px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-bg-card)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <HiArrowLeft style={{ width: "18px", height: "18px", color: "var(--ios-label-sec)" }} />
        </button>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.02em" }}>Editar cliente</h1>
          <p style={{ fontSize: "13px", color: "var(--ios-label-sec)", margin: "3px 0 0" }}>{current.name}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={submit}>
        <div className="ios-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

            <Field label="Nombre completo" span2>
              <input name="name" value={form.name} onChange={handle} required placeholder="Ej: Juan Pérez" autoComplete="name" style={inputCls} onFocus={onFocus} onBlur={onBlur} />
            </Field>

            <Field label="Teléfono">
              <input name="phone" value={form.phone} onChange={handle} required type="tel" placeholder="+54 9 ..." style={inputCls} onFocus={onFocus} onBlur={onBlur} />
            </Field>

            <Field label="Teléfono alternativo">
              <input name="alternatePhone" value={form.alternatePhone} onChange={handle} type="tel" placeholder="Opcional" style={inputCls} onFocus={onFocus} onBlur={onBlur} />
            </Field>

            <Field label="Documento">
              <input name="document" value={form.document} onChange={handle} required placeholder="DNI / CUIT" style={inputCls} onFocus={onFocus} onBlur={onBlur} />
            </Field>

            <Field label="Email">
              <input name="email" value={form.email} onChange={handle} type="email" placeholder="Opcional" style={inputCls} onFocus={onFocus} onBlur={onBlur} />
            </Field>

            <Field label="Confianza">
              <select name="reliability" value={form.reliability} onChange={handle} style={inputCls} onFocus={onFocus} onBlur={onBlur}>
                <option value="MUYALTA">Muy alta</option>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
                <option value="MOROSO">Moroso</option>
              </select>
            </Field>

            <Field label="Estado">
              <select name="status" value={form.status} onChange={handle} style={inputCls} onFocus={onFocus} onBlur={onBlur}>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </Field>

            <Field label="Fecha de nacimiento">
              <input name="birthDate" value={form.birthDate} onChange={handle} type="date" style={inputCls} onFocus={onFocus} onBlur={onBlur} />
            </Field>

            <Field label="Dirección" span2>
              <input name="address" value={form.address} onChange={handle} placeholder="Calle y número" style={inputCls} onFocus={onFocus} onBlur={onBlur} />
            </Field>

            <Field label="Ciudad">
              <input name="city" value={form.city} onChange={handle} placeholder="Ej: San Luis" style={inputCls} onFocus={onFocus} onBlur={onBlur} />
            </Field>

            <Field label="Provincia">
              <input name="province" value={form.province} onChange={handle} placeholder="Ej: San Luis" style={inputCls} onFocus={onFocus} onBlur={onBlur} />
            </Field>

            <Field label="Notas" span2>
              <textarea
                name="notes" value={form.notes} onChange={handle} rows={3}
                placeholder="Observaciones del cliente…"
                style={{ ...inputCls, height: "auto", padding: "12px 14px", resize: "vertical", lineHeight: 1.5 }}
                onFocus={onFocus} onBlur={onBlur}
              />
            </Field>
          </div>

          {/* Acciones */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px", borderTop: "1px solid var(--ios-sep-opaque)" }}>
            <button
              type="button"
              onClick={handleBack}
              style={{ padding: "12px 20px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", fontSize: "15px", fontWeight: 700, color: "var(--ios-label-sec)", cursor: "pointer" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "12px 22px", borderRadius: "12px", border: "none", background: loading ? "var(--ios-fill)" : "var(--ios-blue)", fontSize: "15px", fontWeight: 700, color: loading ? "var(--ios-label-ter)" : "#fff", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.15s", boxShadow: loading ? "none" : "0 4px 12px rgba(0,122,255,0.3)" }}
            >
              <HiCheck style={{ width: "16px", height: "16px" }} />
              {loading ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
