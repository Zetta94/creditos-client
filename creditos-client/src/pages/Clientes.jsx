import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    HiPencilAlt,
    HiEye,
    HiUserAdd,
    HiUserRemove,
    HiPlus,
    HiFilter,
    HiX,
    HiSearch,
} from "react-icons/hi";
import { mockClients, mockCredits } from "../mocks/mockData";

// === Transformación: unimos clientes con su estado de pago y confianza ===
const clientsData = mockClients.map((c) => {
    // buscamos créditos activos del cliente
    const credits = mockCredits.filter((cr) => cr.clientId === c.id);
    const pending = credits.filter((cr) => cr.status === "PENDING").length;
    const overdue = credits.filter((cr) => cr.status === "OVERDUE").length;
    const paid = credits.filter((cr) => cr.status === "PAID").length;

    // definimos estado de pago en base a créditos
    let pago = "Regular";
    if (overdue > 0) pago = "Atrasado";
    else if (pending > 0 && overdue === 0) pago = "Al día";
    else if (paid === credits.length && credits.length > 0) pago = "Al día";

    // estado de confianza (ya viene en mock)
    const confianza =
        c.reliability === "ALTA"
            ? "Alta"
            : c.reliability === "MEDIA"
                ? "Media"
                : "Baja";

    // algunos clientes estarán “inactivos” aleatoriamente
    const activo = !["MOROSO", "Baja"].includes(confianza);

    return {
        id: c.id,
        nombre: c.name,
        telefono: c.phone,
        activo,
        confianza,
        pago,
    };
});

export default function Clientes() {
    const navigate = useNavigate();

    const [q, setQ] = useState("");
    const [activo, setActivo] = useState("todos");
    const [pago, setPago] = useState("todos");
    const [confianza, setConfianza] = useState("todas");
    const [showFilters, setShowFilters] = useState(false);

    const toggleActivo = (id) => {
        const cliente = clientsData.find((c) => c.id === id);
        if (cliente) {
            cliente.activo = !cliente.activo;
            console.log("Cliente actualizado:", cliente);
        }
    };

    const rows = useMemo(() => {
        const qn = q.trim().toLowerCase();
        return clientsData.filter((c) => {
            const matchesText = !qn || c.nombre.toLowerCase().includes(qn) || c.telefono.toLowerCase().includes(qn);
            const matchesActivo = activo === "todos" || (activo === "si" ? c.activo : !c.activo);
            const matchesPago = pago === "todos" || c.pago === pago;
            const matchesConf = confianza === "todas" || c.confianza === confianza;
            return matchesText && matchesActivo && matchesPago && matchesConf;
        });
    }, [q, activo, pago, confianza]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-bold sm:text-2xl">Clientes</h1>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowFilters((s) => !s)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 sm:hidden"
                        aria-expanded={showFilters}
                        title="Mostrar filtros"
                    >
                        {showFilters ? <HiX className="h-4 w-4" /> : <HiFilter className="h-4 w-4" />}
                        Filtros
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/clientes/nuevo")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-[0.98]"
                    >
                        <HiPlus className="h-4 w-4" />
                        Agregar cliente
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="mb-4 grid gap-3 sm:mb-6">
                <div
                    id="filters-panel"
                    className={`grid gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800 sm:hidden ${showFilters ? "grid" : "hidden"}`}
                >
                    <SearchInput q={q} setQ={setQ} />
                    <FiltersRow
                        activo={activo}
                        setActivo={setActivo}
                        pago={pago}
                        setPago={setPago}
                        confianza={confianza}
                        setConfianza={setConfianza}
                    />
                </div>

                <div className="hidden items-end gap-3 sm:flex">
                    <SearchInput q={q} setQ={setQ} />
                    <FiltersRow
                        activo={activo}
                        setActivo={setActivo}
                        pago={pago}
                        setPago={setPago}
                        confianza={confianza}
                        setConfianza={setConfianza}
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:block">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-50/80 text-gray-600 backdrop-blur dark:bg-gray-800/80 dark:text-gray-300">
                        <tr>
                            <th className="px-4 py-3 font-medium">Nombre</th>
                            <th className="px-4 py-3 font-medium">Teléfono</th>
                            <th className="px-4 py-3 font-medium">Activo</th>
                            <th className="px-4 py-3 font-medium">Pago</th>
                            <th className="px-4 py-3 font-medium">Confianza</th>
                            <th className="px-4 py-3 font-medium">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {rows.map((c) => (
                            <tr key={c.id} className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/70">
                                <td className="px-4 py-3">{c.nombre}</td>
                                <td className="px-4 py-3">{c.telefono}</td>
                                <td className="px-4 py-3">
                                    <StatusPill ok={c.activo} okText="Activo" badText="Inactivo" />
                                </td>
                                <td className="px-4 py-3">
                                    <PagoPill estado={c.pago} />
                                </td>
                                <td className="px-4 py-3">{c.confianza}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            className="rounded-md bg-gray-100 p-2 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                            onClick={() => navigate(`/clientes/${c.id}/editar`)}
                                        >
                                            <HiPencilAlt className="h-4 w-4" />
                                        </button>
                                        <button
                                            className={`rounded-md p-2 ${c.activo
                                                ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-700 dark:text-white dark:hover:bg-red-600"
                                                : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-700 dark:text-white dark:hover:bg-green-600"
                                                }`}
                                            onClick={() => toggleActivo(c.id)}
                                        >
                                            {c.activo ? <HiUserRemove className="h-4 w-4" /> : <HiUserAdd className="h-4 w-4" />}
                                        </button>
                                        <button
                                            className="rounded-md bg-sky-100 p-2 text-sky-700 hover:bg-sky-200 dark:bg-sky-700 dark:text-white dark:hover:bg-sky-600"
                                            onClick={() => navigate(`/clientes/${c.id}`)}
                                        >
                                            <HiEye className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No hay clientes con esos filtros.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


/* === Subcomponentes (JS puro) === */

function SearchInput({ q, setQ }) {
    return (
        <div className="relative w-full sm:max-w-xs">
            <HiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre o teléfono..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
        </div>
    );
}

function FiltersRow({ activo, setActivo, pago, setPago, confianza, setConfianza }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <div className="grid gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Activo</label>
                <select
                    value={activo}
                    onChange={(e) => setActivo(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                    <option value="todos">Todos</option>
                    <option value="si">Activos</option>
                    <option value="no">Inactivos</option>
                </select>
            </div>

            <div className="grid gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Estatus de pago</label>
                <select
                    value={pago}
                    onChange={(e) => setPago(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                    <option value="todos">Todos</option>
                    <option value="Al día">Al día</option>
                    <option value="Atrasado">Atrasado</option>
                    <option value="Regular">Regular</option>
                </select>
            </div>

            <div className="grid gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Confianza</label>
                <select
                    value={confianza}
                    onChange={(e) => setConfianza(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                    <option value="todas">Todas</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                </select>
            </div>

            <div className="hidden md:block" />
        </div>
    );
}

function StatusPill({ ok, okText, badText }) {
    return (
        <span
            className={[
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border",
                ok
                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                    : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
            ].join(" ")}
        >
            <span className={`h-2 w-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />
            {ok ? okText : badText}
        </span>
    );
}

function PagoPill({ estado }) {
    const cls =
        estado === "Al día"
            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
            : estado === "Atrasado"
                ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";

    return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border ${cls}`}>{estado}</span>;
}

function EmptyState({ onCreate }) {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No hay clientes con esos filtros.{" "}
            <button onClick={onCreate} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                Crear nuevo
            </button>
        </div>
    );
}
