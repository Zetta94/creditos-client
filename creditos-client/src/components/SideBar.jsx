import { useEffect, useRef, useState } from "react";
import logo3 from "../assets/logoListo.png";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { HiMenu, HiX, HiChevronDown } from "react-icons/hi";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);       // drawer móvil
  const [userOpen, setUserOpen] = useState(false); // dropdown usuario
  const userRef = useRef(null);

  const item =
    "flex items-center p-2 rounded-lg transition text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700";
  const active =
    "!bg-gray-200 dark:!bg-gray-700 !text-gray-900 dark:!text-white";

  // Cerrar drawer y dropdown al cambiar de ruta
  useEffect(() => {
    setOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  // Bloquear scroll del body sólo con drawer abierto (y limpiar siempre)
  useEffect(() => {
    const el = document.documentElement;
    if (open) el.classList.add("overflow-hidden");
    else el.classList.remove("overflow-hidden");
    return () => el.classList.remove("overflow-hidden");
  }, [open]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function onDocClick(e) {
      if (!userRef.current) return;
      if (!userRef.current.contains(e.target)) setUserOpen(false);
    }
    if (userOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [userOpen]);

  return (
    <>
      {/* Topbar */}
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* toggle drawer móvil (React controlado) */}
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                aria-label="Abrir menú"
                aria-haspopup="dialog"
                aria-expanded={open}
              >
                <HiMenu className="h-6 w-6" />
              </button>

              <img src={logo3} className="h-10 me-10 ml-5" alt="Logo" />
            </div>

            {/* Avatar / menú usuario (React controlado) */}
            <div className="flex items-center ms-3" ref={userRef}>
              <button
                type="button"
                onClick={() => setUserOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-gray-800 p-1 pr-2 text-sm focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                aria-expanded={userOpen}
                aria-haspopup="menu"
              >
                <img
                  className="w-8 h-8 rounded-full"
                  src="https://flowbite.com/docs/images/people/profile-picture-5.jpg"
                  alt="user"
                />
                <HiChevronDown className="text-gray-300" />
              </button>

              {userOpen && (
                <div
                  role="menu"
                  className="absolute right-3 top-14 z-50 my-2 w-56 rounded-sm border border-gray-200 bg-white text-base shadow-sm dark:border-gray-700 dark:bg-gray-700"
                >
                  <div className="px-4 py-3" role="none">
                    <p className="text-sm text-gray-900 dark:text-white" role="none">
                      Usuario Administrador
                    </p>
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-300" role="none">
                      demo@imperio.test
                    </p>
                  </div>
                  <ul className="py-1" role="none">
                    <li>
                      <NavLink
                        to="/"
                        end
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                        role="menuitem"
                        onClick={() => setUserOpen(false)}
                      >
                        Dashboard
                      </NavLink>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          // limpiar sesión si corresponde
                          localStorage.removeItem("token");
                          setUserOpen(false);
                          navigate("/login", { replace: true });
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop móvil (se monta SOLO cuando open === true) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] sm:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="logo-sidebar"
        className={`fixed top-0 left-0 z-50 h-screen w-64 pt-20 border-r border-gray-200 bg-white transition-transform dark:border-gray-700 dark:bg-gray-800
          sm:translate-x-0 sm:z-40
          ${open ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}`}
        aria-label="Sidebar"
        role="dialog"
        aria-modal="true"
      >
        <div className="h-full px-3 pb-4 overflow-y-auto">
          <ul className="space-y-2 font-medium">
            <li>
              {/* Ruta canónica al dashboard: "/" (no "/dashboard") */}
              <NavLink to="/" end className={({ isActive }) => `${item} ${isActive ? active : ""}`}>
                <svg className="w-5 h-5 me-2 text-gray-500 dark:text-gray-400" viewBox="0 0 22 21" fill="currentColor">
                  <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z" />
                  <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z" />
                </svg>
                <span>Dashboard</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/creditos" className={({ isActive }) => `${item} ${isActive ? active : ""}`}>
                <svg className="w-5 h-5 me-2 text-gray-500 dark:text-gray-400" viewBox="0 0 18 18" fill="currentColor">
                  <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z" />
                </svg>
                <span>Créditos</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/clientes" className={({ isActive }) => `${item} ${isActive ? active : ""}`}>
                <svg className="w-5 h-5 me-2 text-gray-500 dark:text-gray-400" viewBox="0 0 18 20" fill="currentColor">
                  <path d="M17 5.923A1 1 0 0 0 16 5h-3V4a4 4 0 1 0-8 0v1H2a1 1 0 0 0-1 .923L.086 17.846A2 2 0 0 0 2.08 20h13.84a2 2 0 0 0 1.994-2.153L17 5.923ZM7 9a1 1 0 0 1-2 0V7h2v2Zm0-5a2 2 0 1 1 4 0v1H7V4Zm6 5a1 1 0 1 1-2 0V7h2v2Z" />
                </svg>
                <span>Clientes</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/mensajes" className={({ isActive }) => `${item} ${isActive ? active : ""}`}>
                <svg className="w-5 h-5 me-2 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="m17.418 3.623-.018-.008a6.713 6.713 0 0 0-2.4-.569V2h1a1 1 0 1 0 0-2h-2a1 1 0 0 0-1 1v2H9.89A6.977 6.977 0 0 1 12 8v5h-2V8A5 5 0 1 0 0 8v6a1 1 0 0 0 1 1h8v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-4h6a1 1 0 0 0 1-1V8a5 5 0 0 0-2.582-4.377ZM6 12H4a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2Z" />
                </svg>
                <span className="flex-1">Mensajes</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/usuarios" className={({ isActive }) => `${item} ${isActive ? active : ""}`}>
                <svg className="w-5 h-5 me-2 text-gray-500 dark:text-gray-400" viewBox="0 0 20 18" fill="currentColor">
                  <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                </svg>
                <span>Usuarios</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
