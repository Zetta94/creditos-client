import { useEffect, useMemo, useRef, useState } from "react";
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
  const initials = useMemo(() => {
    const source = (displayName || "Usuario").trim();
    const words = source.split(/\s+/).filter(Boolean);
    if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
    return source.slice(0, 2).toUpperCase();
  }, [displayName]);
  const roleLabel = role === "admin" ? "Administrador" : "Cobrador";

  const handleLogoClick = () => {
    const target = role === "cobrador" || role === "employee" ? "/cobrador/dashboard" : "/";
    setOpen(false);
    navigate(target);
  };

  useEffect(() => {
    setOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const el = document.documentElement;
    if (open) el.classList.add("overflow-hidden");
    else el.classList.remove("overflow-hidden");
    return () => el.classList.remove("overflow-hidden");
  }, [open]);

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
      <nav className="fixed top-0 z-50 w-full border-b border-slate-700 bg-[#0b1738]">
        <div className="flex items-center justify-between px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center rounded-lg p-2 text-sm text-slate-300 hover:bg-slate-700 sm:hidden"
            >
              <HiMenu className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={handleLogoClick}
              className="ml-4 me-6 flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <img src="/imperio-app-icon.svg" className="h-9 w-9 rounded-xl" alt="El Imperio" />
              <div className="hidden sm:flex flex-col leading-none text-left">
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-300">El Imperio</span>
                <span className="text-sm font-semibold text-white">Dashboard</span>
              </div>
            </button>
          </div>

          <div className="relative ms-3 flex items-center" ref={userRef}>
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-slate-600 bg-slate-900/90 p-1 pr-2 text-sm transition hover:border-slate-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-xs font-semibold text-white shadow-inner">
                {initials}
              </span>
              <span className="hidden max-w-[140px] truncate text-xs font-medium text-slate-100 md:block">
                {displayName}
              </span>
              <HiChevronDown className="text-slate-300" />
            </button>

            {userOpen && (
              <div className="absolute right-0 top-12 z-50 my-2 w-64 overflow-hidden rounded-xl border border-slate-600 bg-slate-900/95 text-base shadow-xl backdrop-blur">
                <div className="border-b border-slate-700 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-semibold text-white">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">{displayName}</p>
                      <p className="text-xs text-cyan-300">{roleLabel}</p>
                    </div>
                  </div>
                  {email && <p className="mt-2 truncate text-xs text-slate-300">{email}</p>}
                </div>
                <ul className="p-2">
                  <li>
                    <button
                      onClick={() => {
                        dispatch(resetTrayecto());
                        localStorage.clear();
                        setUserOpen(false);
                        navigate("/login", { replace: true });
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-200 transition hover:bg-rose-500/15 hover:text-rose-100"
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

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 border-r border-slate-700 bg-[#0b1738] pt-20 transition-transform
        sm:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}`}
      >
        <div className="h-full overflow-y-auto px-3 pb-4">
          {role === "admin" ? <SidebarAdmin /> : <SidebarCobrador />}
        </div>
      </aside>
    </>
  );
}
