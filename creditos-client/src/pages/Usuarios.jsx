import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HiPlus, HiEye, HiSearch } from "react-icons/hi";
import { loadUsers } from "../store/employeeSlice";
import { loadCredits } from "../store/creditsSlice";
import Pagination from "../components/Pagination";

export default function Usuarios() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { list: usuarios, loading, meta } = useSelector(state => state.employees) || { list: [], loading: false, meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 } };
    const { list: creditos } = useSelector(state => state.credits) || { list: [] };

    const [q, setQ] = useState("");
    const [rol, setRol] = useState("todos");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        setPage(meta?.page ?? 1);
        setPageSize(meta?.pageSize ?? 10);
    }, [meta?.page, meta?.pageSize]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            dispatch(loadUsers({ page, pageSize, q: q.trim() ? q.trim() : undefined }));
        }, 200);
        return () => clearTimeout(timeout);
    }, [dispatch, page, pageSize, q]);

    useEffect(() => {
        dispatch(loadCredits({ page: 1, pageSize: 500 }));
    }, [dispatch]);

    useEffect(() => {
        setPage(1);
    }, [q, rol]);

    const usuariosConDatos = useMemo(() => {
        return (usuarios || []).map((u) => {
            const creditosUsuario = creditos.filter((c) => c.userId === u.id);
            const totalCreditos = creditosUsuario.length;

            return {
                id: u.id,
                nombre: u.name,
                rol: (u.role || "").toUpperCase(),
                status: (u.status || "ACTIVE").toUpperCase(),
                creditos: totalCreditos,
                nivel: u.responsability?.toUpperCase() || "MEDIA",
            };
        });
    }, [usuarios, creditos]);

    const rows = useMemo(() => {
        const qn = q.trim().toLowerCase();
        return usuariosConDatos.filter((u) => {
            const textOk = !qn || u.nombre.toLowerCase().includes(qn);
            const rolOk = rol === "todos" || u.rol === rol;
            return textOk && rolOk;
        });
    }, [q, rol, usuariosConDatos]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            {/* === Toolbar === */}
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

            {/* === Filtros === */}
            <div className="grid gap-3 sm:flex sm:items-end">
                <SearchInput q={q} setQ={setQ} />
                <div className="grid gap-1 sm:w-48">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Rol</label>
                    <select
                        value={rol}
                        onChange={(e) => setRol(e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                        <option value="todos">Todos</option>
                        <option value="ADMIN">Admin</option>
                        <option value="COBRADOR">Cobrador</option>
                        <option value="EMPLOYEE">Employee</option>
                    </select>
                </div>
            </div>

            {/* === Mobile: Cards === */}
            <div className="grid gap-4 sm:hidden">
                {loading ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                        Cargando usuarios...
                    </div>
                ) : rows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        No se encontraron usuarios.
                    </div>
                ) : (
                    rows.map((u) => (
                        <div
                            key={u.id}
                            className="rounded-2xl border border-gray-700 bg-gray-900/60 backdrop-blur-sm p-4 shadow-lg"
                        >
                            {/* HEADER */}
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="font-semibold text-lg text-white leading-tight">
                                        {u.nombre}
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate(`/usuarios/${u.id}`)}
                                    className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500 transition"
                                >
                                    <HiEye className="inline-block h-4 w-4" />
                                </button>
                            </div>

                            {/* PILLS */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                <RolPill rol={u.rol} />
                                <NivelPill nivel={u.nivel} />
                                <EstadoPill status={u.status} />
                            </div>

                            {/* INFO */}
                            <div className="flex justify-between items-center text-sm text-gray-300">
                                <span className="font-semibold center">Créditos asignados:</span>
                                <span className="font-medium text-white mr-0.5">{u.creditos}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* === Desktop: Tabla === */}
            <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:block">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-50/80 text-gray-600 backdrop-blur dark:bg-gray-800/80 dark:text-gray-300">
                        <tr>
                            <th className="px-4 py-3 font-medium min-w-[200px]">Nombre</th>
                            <th className="px-4 py-3 font-medium min-w-[150px]">Créditos asignados</th>
                            <th className="px-4 py-3 font-medium min-w-[160px]">Responsabilidad</th>
                            <th className="px-4 py-3 font-medium min-w-[120px]">Rol</th>
                            <th className="px-4 py-3 font-medium min-w-[150px] text-center">Estado</th>
                            <th className="px-4 py-3 text-center font-medium min-w-[140px]">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    Cargando usuarios...
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No se encontraron usuarios.
                                </td>
                            </tr>
                        ) : (
                            rows.map((u) => (
                                <tr
                                    key={u.id}
                                    className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800/70"
                                >
                                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{u.nombre}</td>
                                    <td className="px-4 py-3">{u.creditos}</td>
                                    <td className="px-4 py-3">
                                        <NivelPill nivel={u.nivel} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <RolPill rol={u.rol} />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <EstadoPill status={u.status} />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => navigate(`/usuarios/${u.id}`)}
                                            className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-white hover:bg-sky-500"
                                        >
                                            <HiEye className="h-4 w-4" />
                                            Ver
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6">
                <Pagination
                    page={meta?.page ?? page}
                    pageSize={meta?.pageSize ?? pageSize}
                    totalItems={meta?.totalItems ?? usuarios.length}
                    totalPages={meta?.totalPages ?? 1}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                    }}
                />
            </div>
        </div>
    );
}

/* ==== Subcomponentes ==== */

function SearchInput({ q, setQ }) {
    return (
        <div className="relative w-full sm:max-w-xs">
            <HiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre…"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
        </div>
    );
}

function RolPill({ rol }) {
    const cls =
        rol === "ADMIN"
            ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
            : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
    return (
        <span className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium min-w-[90px] text-center ${cls}`}>
            {rol === "EMPLOYEE" ? "cobrador" : rol}
        </span>
    );
}

function NivelPill({ nivel }) {
    const colors = {
        ALTA: "bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300",
        EXCELENTE: "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300",
        MEDIA: "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300",
        MALA: "bg-red-50 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300",
    };
    return (
        <span className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium min-w-[90px] text-center ${colors[nivel] || colors.MEDIA}`}>
            {nivel}
        </span>
    );
}

function EstadoPill({ status }) {
    const isActive = status === "ACTIVE";
    const cls = isActive
        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
        : "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/50 dark:text-gray-300";
    const label = isActive ? "Activo" : "Inactivo";

    return (
        <span className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium min-w-[90px] text-center ${cls}`}>
            {label}
        </span>
    );
}
