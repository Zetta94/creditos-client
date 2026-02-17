import { NavLink, useLocation } from "react-router-dom";

export default function SidebarItem({ to, label, icon, disabled = false }) {
    const icons = {
        dashboard: "▦",
        stats: "◷",
        grid: "◫",
        clients: "◉",
        message: "✉",
        users: "◎",
        payments: "◍",
    };

    const location = useLocation();
    const pathname = location.pathname || "";
    const isRoot = to === "/";
    const isActive = !disabled && (isRoot ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`));

    const baseClasses = "flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm transition-colors";
    const stateClasses = isActive
        ? "bg-slate-700/85 border-slate-600 text-white font-semibold shadow-sm"
        : "text-slate-200 hover:bg-slate-800/75 hover:text-white";
    const disabledClasses = disabled ? "text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60" : "";

    const content = (
        <>
            <span className="inline-flex w-5 justify-center">{icons[icon] || "•"}</span>
            <span>{label}</span>
        </>
    );

    return (
        <li>
            {disabled ? (
                <div className={`${baseClasses} ${disabledClasses}`} aria-disabled="true">
                    {content}
                </div>
            ) : (
                <NavLink to={to} className={`${baseClasses} ${stateClasses}`}>
                    {content}
                </NavLink>
            )}
        </li>
    );
}
