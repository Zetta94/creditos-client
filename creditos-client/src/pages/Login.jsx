import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { HiMail, HiLockClosed, HiEye, HiEyeOff } from "react-icons/hi";
import logoMinimal from "../assets/LogoMinimalista.png";
import { login } from "../store/authSlice";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [localError, setLocalError] = React.useState("");
  const [installPrompt, setInstallPrompt] = React.useState(null);
  const [installing, setInstalling] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [installTarget, setInstallTarget] = React.useState(null);
  const [isIOS, setIsIOS] = React.useState(false);

  React.useEffect(() => {
    const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone;
    setIsStandalone(Boolean(standalone));
    const ua = navigator.userAgent || "";
    const iOS = /iPhone|iPad|iPod/i.test(ua);
    setIsIOS(iOS);
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    setInstallTarget(isMobile ? "mobile" : "desktop");

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onAppInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleInstallApp() {
    if (!installPrompt) return;
    try {
      setInstalling(true);
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } finally {
      setInstalling(false);
      setInstallPrompt(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    if (!normalizedEmail || !normalizedPassword) {
      setLocalError("Completá email y contraseña.");
      return;
    }
    try {
      const result = await dispatch(login({ email: normalizedEmail, password: normalizedPassword })).unwrap();
      const role = result.user?.role;
      const isCobrador = role === "cobrador" || role === "employee";
      navigate(isCobrador ? "/cobrador/dashboard" : "/", { replace: true });
    } catch (errMsg) {
      setLocalError(typeof errMsg === "string" ? errMsg : "Email o contraseña incorrectos.");
    }
  }

  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: "100vh",
        background: "var(--ios-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "380px" }}>

        {/* Logo + Marca */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "22px",
            background: "#1c2b4a",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(28,43,74,0.28), 0 2px 8px rgba(28,43,74,0.15)",
          }}>
            <img src={logoMinimal} style={{ width: "54px", height: "54px", objectFit: "contain" }} alt="El Imperio" />
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Dashboard Créditos
          </h1>
          <p style={{ fontSize: "15px", color: "var(--ios-label-sec)", margin: 0 }}>
            Ingresá para continuar
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--ios-bg-card)",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "var(--ios-shadow-md)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Campo Email */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ios-label-sec)", marginBottom: "8px" }}>
              Email
            </label>
            <div style={{ position: "relative" }}>
              <HiMail style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "18px",
                height: "18px",
                color: "var(--ios-label-ter)",
                pointerEvents: "none",
              }} />
              <input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="username"
                className="ios-input"
                style={{ paddingLeft: "42px" }}
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ios-label-sec)", marginBottom: "8px" }}>
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <HiLockClosed style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "18px",
                height: "18px",
                color: "var(--ios-label-ter)",
                pointerEvents: "none",
              }} />
              <input
                id="password"
                type={showPass ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                className="ios-input"
                style={{ paddingLeft: "42px", paddingRight: "48px" }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{
                  position: "absolute",
                  right: "4px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  border: "none",
                  background: "transparent",
                  color: "var(--ios-label-ter)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--ios-label-sec)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--ios-label-ter)"}
              >
                {showPass ? <HiEyeOff style={{ width: "18px", height: "18px" }} /> : <HiEye style={{ width: "18px", height: "18px" }} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {(localError || error) && (
            <div style={{
              padding: "11px 14px",
              borderRadius: "12px",
              background: "var(--ios-red-bg)",
              border: "1px solid rgba(255,59,48,0.2)",
              fontSize: "14px",
              color: "var(--ios-red)",
              fontWeight: 500,
            }}>
              {localError || error}
            </div>
          )}

          {/* Botón principal */}
          <button
            type="submit"
            disabled={loading}
            className="ios-btn ios-btn-primary"
            style={{
              width: "100%",
              height: "50px",
              borderRadius: "14px",
              fontSize: "16px",
              fontWeight: 700,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          {/* Olvidé contraseña */}
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            style={{
              background: "none",
              border: "none",
              color: "var(--ios-blue)",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "center",
              padding: "4px",
              borderRadius: "8px",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            ¿Olvidaste la contraseña?
          </button>
        </form>

        {/* Instalar app */}
        {!isStandalone && installPrompt && installTarget && (
          <button
            type="button"
            onClick={handleInstallApp}
            disabled={installing}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              marginTop: "12px",
              padding: "14px",
              borderRadius: "14px",
              border: "1.5px solid rgba(0,122,255,0.3)",
              background: "rgba(0,122,255,0.06)",
              color: "var(--ios-blue)",
              fontSize: "15px",
              fontWeight: 600,
              cursor: installing ? "not-allowed" : "pointer",
              opacity: installing ? 0.7 : 1,
              transition: "all 0.15s",
            }}
          >
            {installing
              ? "Abriendo instalador..."
              : installTarget === "mobile"
                ? "📲 Descargar app para celular"
                : "💻 Descargar app para escritorio"}
          </button>
        )}

        {!isStandalone && isIOS && !installPrompt && (
          <div style={{
            marginTop: "12px",
            padding: "14px",
            borderRadius: "14px",
            border: "1px solid rgba(0,122,255,0.2)",
            background: "rgba(0,122,255,0.05)",
            fontSize: "14px",
            color: "var(--ios-label-sec)",
            textAlign: "center",
          }}>
            Para instalar en iPhone: Safari › Compartir › Agregar a pantalla de inicio
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: "28px", fontSize: "12px", color: "var(--ios-label-ter)" }}>
          © {new Date().getFullYear()} El Imperio — Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
