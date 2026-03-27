import { useEffect, useMemo, useRef, useState } from "react";
import logo3 from "../../assets/logoListo.png";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { HiMenu, HiChevronDown, HiHome, HiCash, HiCurrencyDollar, HiChartBar, HiUserCircle, HiLogout } from "react-icons/hi";
import SidebarAdmin from "./SideBarAdmin.jsx";
import SidebarCobrador from "./SideBarCobrador";
import { useDispatch, useSelector } from "react-redux";
import { resetTrayecto } from "../../store/trayectoSlice";
import { logout } from "../../store/authSlice";

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
  const isCollector = role === "cobrador" || role === "employee";
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

  const handleLogout = async () => {
    dispatch(resetTrayecto());
    await dispatch(logout());
    setUserOpen(false);
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    setOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const el = document.documentElement;
    if (open && !isCollector) el.classList.add("overflow-hidden");
    else el.classList.remove("overflow-hidden");
    return () => el.classList.remove("overflow-hidden");
  }, [open, isCollector]);

  useEffect(() => {
    function handleClick(e) {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    }
    if (userOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userOpen]);

  const collectorNavItems = [
    { to: "/cobrador/dashboard", label: "Inicio", icon: HiHome },
    { to: "/cobrador/pagos", label: "Cobros", icon: HiCash },
    { to: "/cobrador/sueldo", label: "Sueldo", icon: HiCurrencyDollar },
    { to: "/cobrador/reportes", label: "Reportes", icon: HiChartBar },
  ];

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-slate-700 bg-[#0b1738]">
        <div className="relative flex items-center justify-between px-3 py-3 lg:px-5 lg:pl-3">
          <div className="z-10 flex min-w-[44px] items-center">
            {!isCollector ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center rounded-lg p-2 text-sm text-slate-300 hover:bg-slate-700 sm:hidden"
              >
                <HiMenu className="h-6 w-6" />
              </button>
            ) : <div className="h-10 w-10 sm:hidden" />}
            <button
              type="button"
              onClick={handleLogoClick}
              className={`${isCollector ? "ml-0" : "ml-4"} me-3 hidden items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 sm:me-6 sm:flex`}
            >
              <img src={logo3} className="h-10 w-auto rounded-md border border-slate-600/60 bg-slate-900/50 p-1" alt="El Imperio" />
              <div className="hidden sm:flex flex-col leading-none text-left">
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-300">El Imperio</span>
                <span className="text-sm font-semibold text-white">Dashboard</span>
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogoClick}
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center rounded-lg px-2 py-1.5 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 sm:hidden"
          >
            <img src={logo3} className="h-10 w-auto rounded-md border border-slate-600/60 bg-slate-900/50 p-1" alt="El Imperio" />
          </button>

          <div className="relative z-10 ms-3 flex min-w-[44px] items-center justify-end gap-2" ref={userRef}>
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              className="hidden items-center gap-2 rounded-full border border-slate-600 bg-slate-900/90 p-1 pr-2 text-sm transition hover:border-slate-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 sm:flex"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-xs font-semibold text-white shadow-inner">
                {initials}
              </span>
              <span className="hidden max-w-[140px] truncate text-xs font-medium text-slate-100 md:block">
                {displayName}
              </span>
              <HiChevronDown className="text-slate-300" />
            </button>

            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-slate-900/90 text-slate-200 transition hover:border-slate-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 sm:hidden"
              aria-label="Abrir menú de usuario"
            >
              <HiUserCircle className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/20 focus:outline-none focus:ring-2 focus:ring-rose-300 sm:hidden"
              aria-label="Cerrar sesión"
            >
              <HiLogout className="h-5 w-5" />
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
                      onClick={handleLogout}
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

      {open && !isCollector && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`${isCollector ? "hidden sm:block" : ""} fixed top-0 left-0 z-40 h-screen w-64 border-r border-slate-700 bg-[#0b1738] pt-20 transition-transform
        sm:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}`}
      >
        <div className="h-full overflow-y-auto px-3 pb-4">
          {role === "admin" ? <SidebarAdmin /> : <SidebarCobrador />}
        </div>
      </aside>

      {isCollector ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] sm:hidden">
          <div className="pointer-events-auto mx-auto max-w-md rounded-[28px] border border-slate-700/80 bg-slate-900/92 p-2 shadow-[0_22px_50px_-22px_rgba(15,23,42,1)] backdrop-blur-xl">
            <div className="grid grid-cols-4 gap-2">
              {collectorNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${isActive
                      ? "bg-gradient-to-b from-cyan-500/20 to-blue-500/20 text-cyan-100"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-cyan-300" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}


