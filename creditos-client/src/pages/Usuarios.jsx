import { useEffect, useMemo, useRef, useState } from "react";
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

    const lastRequestRef = useRef({ page: null, pageSize: null, q: null });

    useEffect(() => {
        const normalizedQuery = q.trim() ? q.trim() : undefined;
        const params = { page, pageSize, q: normalizedQuery };
        const last = lastRequestRef.current;
        const sameRequest =
            last.page === params.page &&
            last.pageSize === params.pageSize &&
            last.q === params.q;

        if (sameRequest) {
            return;
        }

        const timeout = setTimeout(() => {
            lastRequestRef.current = params;
            dispatch(loadUsers(params));
        }, 200);

        return () => {
            clearTimeout(timeout);
        };
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
            <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 shadow-xl dark:border-slate-700 dark:bg-slate-900/80 sm:block">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-white/70 text-slate-500 backdrop-blur-lg dark:bg-slate-900/70 dark:text-slate-200">
                        <tr>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300 min-w-[200px]">Nombre</th>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300 min-w-[150px]">Créditos asignados</th>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300 min-w-[160px]">Responsabilidad</th>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300 min-w-[120px]">Rol</th>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300 min-w-[150px]">Estado</th>
                            <th className="border-x border-slate-200 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-slate-300 min-w-[160px]">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/80">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="border-x border-slate-200 px-4 py-8 text-center text-gray-500 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-gray-400">
                                    Cargando usuarios...
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="border-x border-slate-200 px-4 py-8 text-center text-gray-500 first:border-l-0 last:border-r-0 dark:border-slate-700 dark:text-gray-400">
                                    No se encontraron usuarios.
                                </td>
                            </tr>
                        ) : (
                            rows.map((u) => (
                                <tr
                                    key={u.id}
                                    className="transition hover:bg-sky-50/40 odd:bg-white/95 even:bg-slate-50/80 dark:odd:bg-slate-900/50 dark:even:bg-slate-900/35 dark:hover:bg-slate-900/55"
                                >
                                    <td className="border-x border-slate-100 px-5 py-4 text-center text-slate-700 first:border-l-0 last:border-r-0 dark:border-slate-800 dark:text-slate-100">{u.nombre}</td>
                                    <td className="border-x border-slate-100 px-5 py-4 text-center text-slate-600 first:border-l-0 last:border-r-0 dark:border-slate-800 dark:text-slate-200">{u.creditos}</td>
                                    <td className="border-x border-slate-100 px-5 py-4 text-center first:border-l-0 last:border-r-0 dark:border-slate-800">
                                        <NivelPill nivel={u.nivel} />
                                    </td>
                                    <td className="border-x border-slate-100 px-5 py-4 text-center first:border-l-0 last:border-r-0 dark:border-slate-800">
                                        <RolPill rol={u.rol} />
                                    </td>
                                    <td className="border-x border-slate-100 px-5 py-4 text-center first:border-l-0 last:border-r-0 dark:border-slate-800">
                                        <EstadoPill status={u.status} />
                                    </td>
                                    <td className="border-x border-slate-100 px-5 py-4 text-center first:border-l-0 last:border-r-0 dark:border-slate-800">
                                        <button
                                            onClick={() => navigate(`/usuarios/${u.id}`)}
                                            className="inline-flex min-w-[118px] items-center justify-center gap-1.5 rounded-full border border-sky-200 bg-white/80 px-3 py-1.5 font-semibold text-sky-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-sky-500/50 dark:bg-sky-500/15 dark:text-sky-200 dark:hover:bg-sky-500/25"
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
            ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700"
            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700";
    return (
        <span className={`inline-flex min-w-[110px] items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide text-center ${cls}`}>
            {rol === "EMPLOYEE" ? "Cobrador" : rol}
        </span>
    );
}

function NivelPill({ nivel }) {
    const colors = {
        ALTA: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
        EXCELENTE: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
        MEDIA: "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700",
        MALA: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700",
    };
    return (
        <span className={`inline-flex min-w-[110px] items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide text-center ${colors[nivel] || colors.MEDIA}`}>
            {nivel}
        </span>
    );
}

function EstadoPill({ status }) {
    const isActive = status === "ACTIVE";
    const cls = isActive
        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
        : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700";
    const label = isActive ? "Activo" : "Inactivo";

    return (
        <span className={`inline-flex min-w-[110px] items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide text-center ${cls}`}>
            {label}
        </span>
    );
}
