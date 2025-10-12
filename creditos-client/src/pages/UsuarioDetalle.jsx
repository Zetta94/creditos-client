import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HiFilter, HiX } from "react-icons/hi";

// Mock de usuarios
const usuarios = [
    { id: 1, nombre: "Admin General", email: "admin@imperio.test", rol: "ADMIN", creditosCargados: 120, pagosRecibidos: 430 },
    { id: 2, nombre: "María López", email: "maria@imperio.test", rol: "USER", creditosCargados: 35, pagosRecibidos: 110 },
    { id: 3, nombre: "Jorge Nuñez", email: "jorge@imperio.test", rol: "USER", creditosCargados: 58, pagosRecibidos: 190 },
];

// Mock de cobros del usuario
const cobrosMock = [
    { id: "c1", usuarioId: 1, fecha: "2025-10-08", monto: 12000, cliente: "Juan Pérez" },
    { id: "c2", usuarioId: 1, fecha: "2025-10-09", monto: 8500, cliente: "Laura Gómez" },
    { id: "c3", usuarioId: 1, fecha: "2025-10-10", monto: 15000, cliente: "Carlos Díaz" },
    { id: "c4", usuarioId: 2, fecha: "2025-10-01", monto: 7000, cliente: "Pedro Ruiz" },
    { id: "c5", usuarioId: 2, fecha: "2025-10-10", monto: 10500, cliente: "Ana Torres" },
    { id: "c6", usuarioId: 3, fecha: "2025-09-30", monto: 5000, cliente: "Sofía Lima" },
];

function formatCurrency(n) {
    return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export default function UsuarioDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const usuario = usuarios.find((u) => String(u.id) === String(id));

    const [filtros, setFiltros] = useState({ desde: "", hasta: "", montoMin: "", montoMax: "" });
    const [openFilters, setOpenFilters] = useState(false);

    const cobrosUsuario = useMemo(
        () => cobrosMock.filter((c) => String(c.usuarioId) === String(id)),
        [id]
    );

    const cobrosFiltrados = useMemo(() => {
        return cobrosUsuario
            .filter((c) => {
                if (filtros.desde && c.fecha < filtros.desde) return false;
                if (filtros.hasta && c.fecha > filtros.hasta) return false;
                if (filtros.montoMin && c.monto < Number(filtros.montoMin)) return false;
                if (filtros.montoMax && c.monto > Number(filtros.montoMax)) return false;
                return true;
            })
            .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    }, [cobrosUsuario, filtros]);

    if (!usuario) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-6">
                <p className="mb-4 text-red-400">Usuario no encontrado.</p>
                <button onClick={() => navigate("/usuarios")} className="rounded-md bg-gray-700 px-4 py-2 hover:bg-gray-600">
                    Volver
                </button>
            </div>
        );
    }

    const totalFiltrado = cobrosFiltrados.reduce((acc, c) => acc + c.monto, 0);

    return (
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold sm:text-2xl">{usuario.nombre}</h1>
                    <p className="text-sm text-gray-400">{usuario.email}</p>
                    <span
                        className={[
                            "mt-2 inline-block rounded-full border px-2 py-1 text-xs",
                            usuario.rol === "ADMIN"
                                ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
                        ].join(" ")}
                    >
                        {usuario.rol}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:min-w-[520px]">
                    <Kpi label="Créditos cargados" value={usuario.creditosCargados} />
                    <Kpi label="Pagos recibidos" value={usuario.pagosRecibidos} />
                    <Kpi label="Total filtrado" value={formatCurrency(totalFiltrado)} />
                </div>
            </div>

            {/* Toolbar filtros */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setOpenFilters((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 sm:hidden"
                    aria-expanded={openFilters}
                >
                    {openFilters ? <HiX className="h-4 w-4" /> : <HiFilter className="h-4 w-4" />}
                    Filtros
                </button>

                <div className="hidden sm:block" />
                <button
                    onClick={() => setFiltros({ desde: "", hasta: "", montoMin: "", montoMax: "" })}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                    Limpiar filtros
                </button>
            </div>

            {/* Filtros: móvil (plegable) */}
            <div
                className={`grid gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:hidden ${openFilters ? "grid" : "hidden"
                    }`}
            >
                <Filters filtros={filtros} setFiltros={setFiltros} />
            </div>

            {/* Filtros: desktop */}
            <div className="hidden rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:block">
                <Filters filtros={filtros} setFiltros={setFiltros} />
            </div>

            {/* Lista/Tabla de cobros */}
            {/* Cards en móvil */}
            <div className="grid gap-3 sm:hidden">
                {cobrosFiltrados.length === 0 ? (
                    <EmptyState />
                ) : (
                    cobrosFiltrados.map((c) => (
                        <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="mb-1 flex items-center justify-between text-sm">
                                <span className="font-medium">{c.cliente}</span>
                                <span className="text-gray-500">{c.fecha}</span>
                            </div>
                            <div className="text-base font-semibold">{formatCurrency(c.monto)}</div>
                        </div>
                    ))
                )}
            </div>

            {/* Tabla en desktop */}
            <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:block">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-50/80 text-gray-600 backdrop-blur dark:bg-gray-800/80 dark:text-gray-300">
                        <tr>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[140px]">Fecha</th>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[220px]">Cliente</th>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[140px]">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {cobrosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No hay cobros con los filtros actuales.
                                </td>
                            </tr>
                        ) : (
                            cobrosFiltrados.map((c) => (
                                <tr key={c.id} className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800/70">
                                    <td className="px-4 py-3">{c.fecha}</td>
                                    <td className="px-4 py-3">{c.cliente}</td>
                                    <td className="px-4 py-3">{formatCurrency(c.monto)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end">
                <button onClick={() => navigate("/usuarios")} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
                    Volver a la lista
                </button>
            </div>
        </div>
    );
}

/* Subcomponentes */

function Kpi({ label, value }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
        </div>
    );
}

function Filters({ filtros, setFiltros }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <div className="grid gap-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">Desde (fecha)</label>
                <input
                    type="date"
                    value={filtros.desde}
                    onChange={(e) => setFiltros((s) => ({ ...s, desde: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
            </div>
            <div className="grid gap-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">Hasta (fecha)</label>
                <input
                    type="date"
                    value={filtros.hasta}
                    onChange={(e) => setFiltros((s) => ({ ...s, hasta: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
            </div>
            <div className="grid gap-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">Monto mínimo</label>
                <input
                    type="number"
                    min={0}
                    value={filtros.montoMin}
                    onChange={(e) => setFiltros((s) => ({ ...s, montoMin: e.target.value }))}
                    placeholder="0"
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
            </div>
            <div className="grid gap-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">Monto máximo</label>
                <input
                    type="number"
                    min={0}
                    value={filtros.montoMax}
                    onChange={(e) => setFiltros((s) => ({ ...s, montoMax: e.target.value }))}
                    placeholder="100000"
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
            </div>
            <div className="flex items-end">
                <button
                    onClick={() => setFiltros({ desde: "", hasta: "", montoMin: "", montoMax: "" })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                    Limpiar
                </button>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No hay cobros con los filtros actuales.
        </div>
    );
}
