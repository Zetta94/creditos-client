import { useEffect, useMemo, useRef, useState } from "react";
import logo3 from "../../assets/logoListo.png";
import { useLocation, useNavigate } from "react-router-dom";
import { HiMenu, HiChevronDown } from "react-icons/hi";
import SidebarAdmin from "./SideBarAdmin.jsx";
import SidebarCobrador from "./SideBarCobrador";
import { useDispatch, useSelector } from "react-redux";
import { resetTrayecto } from "../../store/trayectoSlice";

export default function SideBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);
  const authUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const user = useMemo(() => {
    if (authUser) return authUser;
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (_) {
      return null;
    }
  }, [authUser]);

  const rawRole = user?.role ?? localStorage.getItem("role") ?? "admin";
  const role = typeof rawRole === "string" ? rawRole.toLowerCase() : "admin";
  const email = user?.email || "";
  const displayName = user?.name || (email ? email.split("@")[0] : "Usuario");

  // Cerrar drawer al navegar
  useEffect(() => {
    setOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  // Bloquear scroll al abrir menú móvil
  useEffect(() => {
    const el = document.documentElement;
    if (open) el.classList.add("overflow-hidden");
    else el.classList.remove("overflow-hidden");
    return () => el.classList.remove("overflow-hidden");
  }, [open]);

  // Cerrar dropdown usuario al hacer click fuera
  useEffect(() => {
    function handleClick(e) {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    }
    if (userOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userOpen]);

  return (
    <>
      {/* === Topbar === */}
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="px-3 py-3 lg:px-5 lg:pl-3 flex items-center justify-between">
          <div className="flex items-center">
            {/* Menú móvil */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <HiMenu className="h-6 w-6" />
            </button>
            <img src={logo3} className="h-10 me-10 ml-5" alt="Logo" />
          </div>

          {/* Avatar */}
          <div className="flex items-center ms-3 relative" ref={userRef}>
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full bg-gray-800 p-1 pr-2 text-sm focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
            >
              <img
                className="w-8 h-8 rounded-full"
                src="https://flowbite.com/docs/images/people/profile-picture-5.jpg"
                alt="user"
              />
              <HiChevronDown className="text-gray-300" />
            </button>

            {/* Dropdown usuario */}
            {userOpen && (
              <div className="absolute right-0 top-12 z-50 my-2 w-56 rounded-md border border-gray-200 bg-white text-base shadow-md dark:border-gray-700 dark:bg-gray-700">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {displayName}
                  </p>
                  {email && (
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-300">
                      {email}
                    </p>
                  )}
                </div>
                <ul className="py-1">
                  <li>
                    <button
                      onClick={() => {
                        dispatch(resetTrayecto());
                        localStorage.clear();
                        setUserOpen(false);
                        navigate("/login", { replace: true });
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      Cerrar sesión
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* === Backdrop móvil === */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* === Sidebar === */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 pt-20 border-r border-gray-200 bg-white transition-transform dark:border-gray-700 dark:bg-gray-800
        sm:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}`}
      >
        <div className="h-full px-3 pb-4 overflow-y-auto">
          {role === "admin" ? <SidebarAdmin /> : <SidebarCobrador />}
        </div>
      </aside>
    </>
  );
}
