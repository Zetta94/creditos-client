import React from "react";
import { useNavigate } from "react-router-dom";

const FAKE_EMAIL = "demo@imperio.test";
const FAKE_PASS = "DemoPassword123";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 grid place-items-center p-6">
      {/* === Formulario con el markup/clases del ejemplo de Flowbite === */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="mb-5">
          <label
            htmlFor="email"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Your email
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@flowbite.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
                       focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5
                       dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
                       dark:focus:ring-blue-500 dark:focus:border-blue-500"
            autoComplete="username"
          />
        </div>

        <div className="mb-5">
          <label
            htmlFor="password"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Your password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
                       focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5
                       dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
                       dark:focus:ring-blue-500 dark:focus:border-blue-500"
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-start mb-5">
          <div className="flex items-center h-5">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 border border-gray-300 rounded-sm bg-gray-50 focus:ring-3 focus:ring-blue-300
                         dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800
                         dark:focus:ring-offset-gray-800"
            />
          </div>
          <label htmlFor="remember" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
            Remember me
          </label>
        </div>

        {error && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none
                     focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center
                     dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-60"
        >
          {loading ? "Checking..." : "Submit"}
        </button>

        {/* helper opcional para autocompletar demo (no cambia el layout) */}
        <button
          type="button"
          onClick={() => {
            setEmail(FAKE_EMAIL);
            setPassword(FAKE_PASS);
            setError("");
          }}
          className="mt-3 text-xs text-gray-500 dark:text-gray-400 hover:underline"
        >
          Usar credenciales demo ({FAKE_EMAIL} / {FAKE_PASS})
        </button>
      </form>
    </div>
  );
}
