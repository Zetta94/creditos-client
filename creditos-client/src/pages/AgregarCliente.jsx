import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { HiArrowLeft } from "react-icons/hi";
import { addClient } from "../store/clientsSlice";

const inputStyle = {
  height: "44px", padding: "0 14px", borderRadius: "12px",
  border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)",
  fontSize: "15px", color: "var(--ios-label)", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
  WebkitAppearance: "none", appearance: "none", width: "100%",
};
const onFocus = e => {
  e.target.style.borderColor = "var(--ios-blue)";
  e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)";
  e.target.style.background = "#fff";
};
const onBlur = e => {
  e.target.style.borderColor = "var(--ios-sep-opaque)";
  e.target.style.boxShadow = "none";
  e.target.style.background = "var(--ios-fill)";
};

export default function AgregarCliente() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.clients) || { loading: false };

  const [form, setForm] = useState({
    name: "", phone: "", alternatePhone: "", document: "",
    address: "", city: "", province: "", email: "",
    reliability: "MEDIA", birthDate: "", status: "ACTIVE",
  });

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre del cliente es requerido"); return; }
    const payload = {
      name: form.name, phone: form.phone,
      alternatePhone: form.alternatePhone.trim() ? form.alternatePhone.trim() : undefined,
      document: form.document, address: form.address,
      city: form.city, province: form.province,
      reliability: form.reliability.toUpperCase(),
      birthDate: form.birthDate ? form.birthDate : undefined,
      status: form.status,
    };
    try {
      await dispatch(addClient(payload)).unwrap();
      toast.success("Cliente creado con éxito");
      navigate("/clientes");
    } catch (error) {
      const msg = typeof error === "string" ? error : error?.message || "No se pudo crear el cliente";
      toast.error(msg);
    }
  };

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: "40px", height: "40px", borderRadius: "12px",
            border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-bg-card)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0, transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--ios-fill)"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--ios-bg-card)"}
        >
          <HiArrowLeft style={{ width: "18px", height: "18px", color: "var(--ios-blue)" }} />
        </button>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.025em" }}>
            Nuevo cliente
          </h1>
          <p style={{ fontSize: "13px", color: "var(--ios-label-ter)", margin: "2px 0 0" }}>
            Completá la información para registrar al cliente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Sección: Información personal */}
        <IosSection title="Información personal">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Nombre completo *" name="name" value={form.name} onChange={handleChange} placeholder="Ej: Laura Gómez" required />
            <Field label="Documento (DNI)" name="document" value={form.document} onChange={handleChange} placeholder="35100221" />
            <Field label="Teléfono *" name="phone" value={form.phone} onChange={handleChange} placeholder="+54 9 381 555 1234" required />
            <Field label="Teléfono alternativo" name="alternatePhone" value={form.alternatePhone} onChange={handleChange} placeholder="Opcional" />
            <Field label="Fecha de nacimiento" name="birthDate" value={form.birthDate} onChange={handleChange} type="date" />
            <Field label="Email" name="email" value={form.email} onChange={handleChange} type="email" placeholder="cliente@mail.com" />
          </div>
        </IosSection>

        {/* Sección: Dirección */}
        <IosSection title="Dirección">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Calle y número" name="address" value={form.address} onChange={handleChange} placeholder="Ej: Av. Mitre 560" />
            </div>
            <Field label="Ciudad" name="city" value={form.city} onChange={handleChange} placeholder="Tucumán" />
            <Field label="Provincia" name="province" value={form.province} onChange={handleChange} placeholder="Tucumán" />
          </div>
        </IosSection>

        {/* Sección: Estado */}
        <IosSection title="Clasificación">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <IosSelect label="Nivel de confiabilidad" name="reliability" value={form.reliability} onChange={handleChange}>
              <option value="MUYALTA">Muy alta</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
              <option value="MOROSO">Moroso</option>
            </IosSelect>
            <IosSelect label="Estado" name="status" value={form.status} onChange={handleChange}>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </IosSelect>
          </div>
        </IosSection>

        {/* Botones */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: "12px 20px", borderRadius: "12px",
              border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)",
              color: "var(--ios-label-sec)", fontSize: "15px", fontWeight: 600, cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#E5E5EA"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--ios-fill)"}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px", borderRadius: "12px", border: "none",
              background: loading ? "#A8C8FF" : "var(--ios-blue)", color: "#fff",
              fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(0,122,255,0.3)", transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "var(--ios-blue-dark)"; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "var(--ios-blue)"; }}
          >
            {loading ? "Guardando..." : "Guardar cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}

function IosSection({ title, children }) {
  return (
    <div className="ios-card" style={{ padding: "20px" }}>
      <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", margin: "0 0 14px" }}>{title}</p>
      {children}
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder = "", type = "text", required = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-sec)", letterSpacing: "0.01em" }}>{label}</label>
      <input
        name={name} value={value} onChange={onChange}
        placeholder={placeholder} type={type} required={required}
        style={inputStyle} onFocus={onFocus} onBlur={onBlur}
      />
    </div>
  );
}

function IosSelect({ label, name, value, onChange, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-sec)", letterSpacing: "0.01em" }}>{label}</label>
      <select name={name} value={value} onChange={onChange} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
        {children}
      </select>
    </div>
  );
}
