import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { HiArrowLeft, HiCheck } from "react-icons/hi";
import toast from "react-hot-toast";
import { fetchUser, updateUser } from "../services/usersService";

function formatCommissionValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "Sin comisión";
  return n <= 100 ? `${n}%` : `$ ${n.toLocaleString("es-AR")}`;
}

/* ── Shared input style ── */
const inputBase = {
  height: "46px", padding: "0 14px", borderRadius: "12px",
  border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)",
  fontSize: "15px", color: "var(--ios-label)", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s",
  WebkitAppearance: "none", appearance: "none", width: "100%",
};
const onFocus = e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; e.target.style.background = "#fff"; };
const onBlur  = e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--ios-fill)"; };

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

function NoticeBanner({ text }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: "12px", background: "#FFF3E0", border: "1.5px solid #FFE5A0", fontSize: "13px", fontWeight: 600, color: "#7C5600", gridColumn: "1 / -1" }}>
      ⚠️ {text}
    </div>
  );
}

export default function UsuarioEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await fetchUser(id);
        setUsuario({
          ...data,
          phone: data.phone || "", alternatePhone: data.alternatePhone || "",
          address: data.address || "", document: data.document || "",
          responsability: data.responsability || "", salary: data.salary ?? "",
          salaryType: data.salaryType || "", comisions: data.comisions ?? "",
          role: data.role || "",
          birthDate: data.birthDate ? data.birthDate.slice(0, 10) : "",
        });
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleChange = (field, value) => setUsuario(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    const basePayload = {
      name: usuario.name, email: usuario.email, phone: usuario.phone,
      alternatePhone: usuario.alternatePhone, address: usuario.address, document: usuario.document,
      responsability: usuario.responsability ? usuario.responsability.toUpperCase() : undefined,
      salary: usuario.salary === "" ? undefined : Number(usuario.salary),
      salaryType: usuario.salaryType ? usuario.salaryType.toUpperCase() : undefined,
      comisions: usuario.comisions === "" ? undefined : Number(usuario.comisions),
      role: usuario.role ? usuario.role.toUpperCase() : undefined,
      birthDate: usuario.birthDate === "" ? null : usuario.birthDate,
      ...(usuario.password ? { password: usuario.password } : {}),
    };
    const payload = Object.fromEntries(
      Object.entries(basePayload).filter(([, v]) => v !== undefined && v !== "" && v !== null && !(typeof v === "number" && Number.isNaN(v)))
    );
    try {
      await updateUser(id, payload);
      toast.success("Usuario actualizado con éxito");
      navigate(`/usuarios/${id}`);
    } catch (err) {
      const msg = err.response?.data?.details ? JSON.stringify(err.response.data.details) : err.response?.data?.error || "No se pudo guardar.";
      toast.error(msg);
    }
  };

  const handleBack = () => window.history.length > 2 ? navigate(-1) : navigate(`/usuarios/${id}`);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "720px", margin: "0 auto" }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: "60px", borderRadius: "12px" }} />)}
    </div>
  );

  if (!usuario) return (
    <div style={{ textAlign: "center", padding: "60px", color: "var(--ios-red)", fontSize: "16px" }}>Usuario no encontrado.</div>
  );

  const commissionDisplay = formatCommissionValue(usuario.comisions);
  const initials = usuario.name?.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";

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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #007AFF, #32ADE6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 900, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.02em" }}>Editar usuario</h1>
            <p style={{ fontSize: "13px", color: "var(--ios-label-sec)", margin: "2px 0 0" }}>{usuario.name} · {usuario.email}</p>
          </div>
        </div>
      </div>

      {/* Vista rápida */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
        {[
          { label: "Responsabilidad", value: usuario.responsability || "—" },
          { label: "Tipo de sueldo",  value: usuario.salaryType || "—"     },
          { label: "Comisión",        value: commissionDisplay              },
        ].map(item => (
          <div key={item.label} className="ios-card" style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", margin: "0 0 6px" }}>{item.label}</p>
            <p style={{ fontSize: "14px", fontWeight: 800, color: "var(--ios-label)", margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Formulario */}
      <div className="ios-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ios-label)", margin: 0 }}>Información editable</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

          <Field label="Nombre completo" span2>
            <input type="text" value={usuario.name || ""} onChange={e => handleChange("name", e.target.value)} style={inputBase} onFocus={onFocus} onBlur={onBlur} />
          </Field>

          <Field label="Email">
            <input type="email" value={usuario.email || ""} onChange={e => handleChange("email", e.target.value)} style={inputBase} onFocus={onFocus} onBlur={onBlur} />
          </Field>

          <Field label="Teléfono">
            <input type="tel" value={usuario.phone} onChange={e => handleChange("phone", e.target.value)} style={inputBase} onFocus={onFocus} onBlur={onBlur} />
          </Field>

          <Field label="Teléfono alternativo">
            <input type="tel" value={usuario.alternatePhone} onChange={e => handleChange("alternatePhone", e.target.value)} style={inputBase} onFocus={onFocus} onBlur={onBlur} />
          </Field>

          <Field label="Dirección">
            <input type="text" value={usuario.address} onChange={e => handleChange("address", e.target.value)} style={inputBase} onFocus={onFocus} onBlur={onBlur} />
          </Field>

          <Field label="Documento">
            <input type="text" value={usuario.document} onChange={e => handleChange("document", e.target.value)} style={inputBase} onFocus={onFocus} onBlur={onBlur} />
          </Field>

          <Field label="Fecha de nacimiento">
            <input type="date" value={usuario.birthDate} onChange={e => handleChange("birthDate", e.target.value)} style={inputBase} onFocus={onFocus} onBlur={onBlur} />
          </Field>

          <Field label="Responsabilidad">
            <select value={usuario.responsability || ""} onChange={e => handleChange("responsability", e.target.value)} style={inputBase} onFocus={onFocus} onBlur={onBlur}>
              <option value="">Seleccionar...</option>
              <option value="EXCELENTE">Excelente</option>
              <option value="ALTA">Alta</option>
              <option value="BUENA">Buena</option>
              <option value="MEDIA">Media</option>
              <option value="MALA">Mala</option>
            </select>
          </Field>

          <Field label="Sueldo base (ARS)">
            <input type="number" value={usuario.salary} onChange={e => handleChange("salary", e.target.value)} style={inputBase} onFocus={onFocus} onBlur={onBlur} />
          </Field>

          <Field label="Tipo de sueldo">
            <select value={usuario.salaryType || ""} onChange={e => handleChange("salaryType", e.target.value)} style={inputBase} onFocus={onFocus} onBlur={onBlur}>
              <option value="">Seleccionar...</option>
              <option value="N_A">N/A</option>
              <option value="MENSUAL">Mensual</option>
              <option value="SEMANAL">Semanal</option>
              <option value="DIARIO">Diario</option>
            </select>
          </Field>

          <Field label="Comisión (% o monto)">
            <input type="number" value={usuario.comisions} onChange={e => handleChange("comisions", e.target.value)} style={inputBase} onFocus={onFocus} onBlur={onBlur} />
          </Field>

          <NoticeBanner text="La comisión se paga aparte del sueldo. No forma parte del sueldo base." />
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px", borderTop: "1px solid var(--ios-sep-opaque)" }}>
          <button
            type="button"
            onClick={() => navigate(`/usuarios/${id}`)}
            style={{ padding: "12px 20px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", fontSize: "15px", fontWeight: 700, color: "var(--ios-label-sec)", cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "12px 22px", borderRadius: "12px", border: "none", background: "var(--ios-blue)", fontSize: "15px", fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,122,255,0.3)", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--ios-blue-dark)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--ios-blue)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <HiCheck style={{ width: "16px", height: "16px" }} />
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
