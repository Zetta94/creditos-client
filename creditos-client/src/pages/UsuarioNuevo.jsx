import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { HiArrowLeft, HiEye, HiEyeOff } from "react-icons/hi";
import { addUser } from "../store/employeeSlice";

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

export default function UsuarioNuevo() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.employees ?? { loading: false });
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "COBRADOR",
    phone: "", alternatePhone: "", address: "", document: "",
    birthDate: "", responsability: "MEDIA", salary: "", salaryType: "MENSUAL", comisions: "",
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(s => ({ ...s, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error("Nombre, email y contraseña son requeridos"); return;
    }
    const payload = {
      ...form,
      phone: form.phone.trim() === "" ? undefined : form.phone.trim(),
      alternatePhone: form.alternatePhone.trim() === "" ? undefined : form.alternatePhone.trim(),
      salary: form.salary === "" ? 0 : Number(form.salary),
      comisions: form.comisions === "" ? 0 : Number(form.comisions),
      status: "ACTIVE",
      birthDate: form.birthDate ? form.birthDate : undefined,
    };
    try {
      await dispatch(addUser(payload)).unwrap();
      toast.success("Usuario creado con éxito");
      navigate("/usuarios");
    } catch (error) {
      const msg = typeof error === "string" ? error : error?.message || "Error al crear usuario";
      toast.error(msg);
    }
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">

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
            Nuevo usuario
          </h1>
          <p style={{ fontSize: "13px", color: "var(--ios-label-ter)", margin: "2px 0 0" }}>
            Completá la información para crear el usuario
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Datos personales */}
        <IosSection title="Datos personales">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Nombre completo *" name="name" value={form.name} onChange={handleChange} placeholder="Ej: Juan Pérez" required />
            <Field label="Email *" name="email" value={form.email} onChange={handleChange} type="email" required placeholder="usuario@imperio.test" />
            <Field label="Teléfono" name="phone" value={form.phone} onChange={handleChange} placeholder="Ej: 3815551234" />
            <Field label="Teléfono alternativo" name="alternatePhone" value={form.alternatePhone} onChange={handleChange} placeholder="Ej: 3815555678" />
            <Field label="Dirección" name="address" value={form.address} onChange={handleChange} placeholder="Ej: Lamadrid 123" />
            <Field label="Documento" name="document" value={form.document} onChange={handleChange} placeholder="Ej: 35123456" />
            <Field label="Fecha de nacimiento" name="birthDate" value={form.birthDate} onChange={handleChange} type="date" />
          </div>
        </IosSection>

        {/* Seguridad */}
        <IosSection title="Seguridad & Acceso">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Contraseña */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-sec)" }}>Contraseña *</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password" name="password"
                  type={showPass ? "text" : "password"}
                  value={form.password} onChange={handleChange} required
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  onFocus={onFocus} onBlur={onBlur}
                />
                <button
                  type="button" onClick={() => setShowPass(s => !s)}
                  style={{
                    position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--ios-label-ter)", display: "flex",
                  }}
                >
                  {showPass ? <HiEyeOff style={{ width: "18px", height: "18px" }} /> : <HiEye style={{ width: "18px", height: "18px" }} />}
                </button>
              </div>
            </div>
            {/* Rol */}
            <IosSelect label="Rol" name="role" value={form.role} onChange={handleChange}>
              <option value="COBRADOR">Cobrador</option>
              <option value="EMPLOYEE">Empleado</option>
              <option value="ADMIN">Admin</option>
            </IosSelect>
          </div>
        </IosSection>

        {/* Datos laborales */}
        <IosSection title="Datos laborales">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <IosSelect label="Responsabilidad" name="responsability" value={form.responsability} onChange={handleChange}>
              <option value="EXCELENTE">Excelente</option>
              <option value="ALTA">Alta</option>
              <option value="BUENA">Buena</option>
              <option value="MEDIA">Media</option>
              <option value="MALA">Mala</option>
            </IosSelect>
            <Field label="Sueldo base (ARS)" name="salary" value={form.salary} onChange={handleChange} type="number" placeholder="Ej: 500000" />
            <IosSelect label="Tipo de sueldo" name="salaryType" value={form.salaryType} onChange={handleChange}>
              <option value="N_A">N/A</option>
              <option value="MENSUAL">Mensual</option>
              <option value="SEMANAL">Semanal</option>
              <option value="DIARIO">Diario</option>
            </IosSelect>
            <Field label="Comisión (% o monto)" name="comisions" value={form.comisions} onChange={handleChange} type="number" placeholder="Ej: 10 o 5000" />
            <div style={{ gridColumn: "1 / -1", borderRadius: "12px", background: "#FFFBEB", border: "1.5px solid #F59E0B40", padding: "12px 14px" }}>
              <p style={{ fontSize: "13px", color: "#7C4A00", margin: 0, lineHeight: 1.5 }}>
                ⚠️ La comisión se paga aparte del sueldo y se usa como referencia por crédito o cliente nuevo.
              </p>
            </div>
          </div>
        </IosSection>

        {/* Botones */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            type="button" onClick={() => navigate(-1)}
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
            type="submit" disabled={loading}
            style={{
              padding: "12px 24px", borderRadius: "12px", border: "none",
              background: loading ? "#A8C8FF" : "var(--ios-blue)", color: "#fff",
              fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(0,122,255,0.3)", transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "var(--ios-blue-dark)"; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "var(--ios-blue)"; }}
          >
            {loading ? "Guardando..." : "Crear usuario"}
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
      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-sec)" }}>{label}</label>
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
      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-sec)" }}>{label}</label>
      <select name={name} value={value} onChange={onChange} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
        {children}
      </select>
    </div>
  );
}
