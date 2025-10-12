import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiPlus, HiEye, HiSearch } from "react-icons/hi";

const usuariosMock = [
    { id: 1, nombre: "Admin General", email: "admin@imperio.test", rol: "ADMIN", creditosCargados: 120, pagosRecibidos: 430 },
    { id: 2, nombre: "María López", email: "maria@imperio.test", rol: "USER", creditosCargados: 35, pagosRecibidos: 110 },
    { id: 3, nombre: "Jorge Nuñez", email: "jorge@imperio.test", rol: "USER", creditosCargados: 58, pagosRecibidos: 190 },
];

export default function Usuarios() {
    const navigate = useNavigate();
    const [q, setQ] = useState("");
    const [rol, setRol] = useState("TODOS"); // TODOS | ADMIN | USER

    const rows = useMemo(() => {
        const qn = q.trim().toLowerCase();
        return usuariosMock.filter((u) => {
            const textOk =
                !qn ||
                u.nombre.toLowerCase().includes(qn) ||
                u.email.toLowerCase().includes(qn);
            const rolOk = rol === "TODOS" || u.rol === rol;
            return textOk && rolOk;
        });
    }, [q, rol]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-bold sm:text-2xl">Usuarios</h1>
                <button
                    onClick={() => navigate("/usuarios/nuevo")}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    <HiPlus className="h-5 w-5" />
                    Agregar Usuario
                </button>
            </div>

            {/* Filtros */}
            <div className="grid gap-3 sm:flex sm:items-end">
                <SearchInput q={q} setQ={setQ} />
                <div className="grid gap-1 sm:w-48">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Rol</label>
                    <select
                        value={rol}
                        onChange={(e) => setRol(e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                        <option value="TODOS">Todos</option>
                        <option value="ADMIN">Admin</option>
                        <option value="USER">Usuario</option>
                    </select>
                </div>
            </div>

            {/* ===== MOBILE: Cards ===== */}
            <div className="grid gap-3 sm:hidden">
                {rows.length === 0 ? (
                    <EmptyState onCreate={() => navigate("/usuarios/nuevo")} />
                ) : (
                    rows.map((u) => <UsuarioCard key={u.id} u={u} onView={() => navigate(`/usuarios/${u.id}`)} />)
                )}
            </div>

            {/* ===== DESKTOP: Tabla ===== */}
            <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:block">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-50/80 text-gray-600 backdrop-blur dark:bg-gray-800/80 dark:text-gray-300">
                        <tr>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[200px]">Nombre</th>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[220px]">Email</th>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[120px]">Rol</th>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[150px]">Créditos cargados</th>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[150px]">Pagos recibidos</th>
                            <th className="px-4 py-3 text-center font-medium whitespace-nowrap min-w-[140px]">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No se encontraron usuarios.
                                </td>
                            </tr>
                        ) : (
                            rows.map((u) => (
                                <tr key={u.id} className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800/70">
                                    <td className="px-4 py-3 align-middle text-gray-900 dark:text-gray-100">{u.nombre}</td>
                                    <td className="px-4 py-3 align-middle text-gray-900 dark:text-gray-100">{u.email}</td>
                                    <td className="px-4 py-3 align-middle">
                                        <RolPill rol={u.rol} />
                                    </td>
                                    <td className="px-4 py-3 align-middle">{u.creditosCargados}</td>
                                    <td className="px-4 py-3 align-middle">{u.pagosRecibidos}</td>
                                    <td className="px-4 py-3 text-center align-middle">
                                        <button
                                            onClick={() => navigate(`/usuarios/${u.id}`)}
                                            className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-white hover:bg-sky-500"
                                        >
                                            <HiEye className="h-4 w-4" />
                                            Ver detalle
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ==== Subcomponentes (JS puro) ==== */

function SearchInput({ q, setQ }) {
    return (
        <div className="relative w-full sm:max-w-xs">
            <HiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre o email…"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
        </div>
    );
}

function RolPill({ rol }) {
    const cls =
        rol === "ADMIN"
            ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
            : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800";
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${cls}`}>
            {rol}
        </span>
    );
}

function UsuarioCard({ u, onView }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {u.nombre}
                    </div>
                    <RolPill rol={u.rol} />
                </div>
                <button
                    onClick={onView}
                    className="shrink-0 rounded-md bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500"
                >
                    <HiEye className="mr-1 inline h-4 w-4" />
                    Ver
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500 dark:text-gray-400">Email</div>
                <div className="truncate text-gray-900 dark:text-gray-100">{u.email}</div>

                <div className="text-gray-500 dark:text-gray-400">Créditos</div>
                <div className="text-gray-900 dark:text-gray-100">{u.creditosCargados}</div>

                <div className="text-gray-500 dark:text-gray-400">Pagos</div>
                <div className="text-gray-900 dark:text-gray-100">{u.pagosRecibidos}</div>
            </div>
        </div>
    );
}

function EmptyState({ onCreate }) {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No se encontraron usuarios.{" "}
            <button onClick={onCreate} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                Crear nuevo
            </button>
        </div>
    );
}
