import React from "react";
import { useNavigate } from "react-router-dom";
import { HiMail, HiLockClosed, HiEye, HiEyeOff } from "react-icons/hi";
import logoMinimal from "../assets/LogoMinimalista.png";

const FAKE_EMAIL = "demo@imperio.test";
const FAKE_PASS = "DemoPassword123";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Completá email y contraseña.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (email.toLowerCase() === FAKE_EMAIL && password === FAKE_PASS) {
        navigate("/", { replace: true });
      } else {
        setError("Email o contraseña incorrectos.");
      }
    }, 400);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 px-4 py-10">
      <div className="mx-auto flex max-w-md flex-col items-center">
        {/* Marca / logo (opcional) */}
        <div className="mb-6 text-center">
          <img className="mx-auto p-0.2 mb-3 h-15 w-15 rounded-2xl bg-blue-600/90 shadow-lg ring-1 ring-blue-500/50" src={logoMinimal} alt="Logo" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard Créditos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ingresá para continuar</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6"
        >
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                autoComplete="username"
                inputMode="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <label htmlFor="remember" className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
              />
              Recordarme
            </label>
            <button
              type="button"
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              onClick={() => alert("Demo estética: enlace de recuperar contraseña")}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setEmail(FAKE_EMAIL);
                setPassword(FAKE_PASS);
                setError("");
              }}
              className="text-xs text-gray-500 hover:underline dark:text-gray-400 sm:order-none"
            >
              Usar credenciales demo ({FAKE_EMAIL} / {FAKE_PASS})
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 sm:w-auto"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </div>
        </form>

        {/* Footercito */}
        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} El Imperio  — Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
