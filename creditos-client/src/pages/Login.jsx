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

  React.useEffect(() => {
    const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone;
    setIsStandalone(Boolean(standalone));
    const ua = navigator.userAgent || "";
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
    <div className="min-h-screen bg-gradient-to-b from-[#020b24] via-[#071a46] to-[#0b1f55] px-4 py-10">
      <div className="mx-auto flex max-w-md flex-col items-center">
        {/* Marca / logo */}
        <div className="mb-6 text-center">
          <img
            className="mx-auto mb-3 h-16 w-16 rounded-2xl border border-slate-500/70 bg-slate-900/70 p-1 shadow-xl ring-1 ring-blue-400/50"
            src={logoMinimal}
            alt="El Imperio"
          />
          <h1 className="text-xl font-semibold text-gray-100">
            Dashboard Créditos
          </h1>
          <p className="text-sm text-gray-300">
            Ingresá para continuar
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl border border-slate-700 bg-slate-900/85 p-5 shadow-sm sm:p-6"
        >
          {/* Email */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-200"
            >
              Email
            </label>
            <div className="relative">
              <HiMail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                placeholder="usuario@tuempresa.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-600 bg-slate-800 pl-10 pr-3 text-sm text-gray-100 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-200"
            >
              Contraseña
            </label>
            <div className="relative">
              <HiLockClosed className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                type={showPass ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-600 bg-slate-800 pl-10 pr-10 text-sm text-gray-100 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-400 hover:bg-slate-700 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {showPass ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {(localError || error) && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              {localError || error}
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              ¿Olvidaste la contraseña?
            </button>
          </div>
        </form>

        {!isStandalone && installPrompt && installTarget && (
          <button
            type="button"
            onClick={handleInstallApp}
            disabled={installing}
            className="mt-3 w-full rounded-lg border border-cyan-500/60 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-60"
          >
            {installing
              ? "Abriendo instalador..."
              : installTarget === "mobile"
                ? "Descargar app para celular"
                : "Descargar app para escritorio"}
          </button>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} El Imperio — Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}


