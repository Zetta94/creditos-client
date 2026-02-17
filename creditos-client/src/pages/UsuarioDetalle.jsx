import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OrdenarClientes from "../pages/OrdenarClientes.jsx";
import { HiOutlineArrowLeft, HiPencil } from "react-icons/hi2";
import { fetchUser } from "../services/usersService";
import { fetchCredits } from "../services/creditsService";
import { fetchPayments } from "../services/paymentsService";
import { fetchClients } from "../services/clientsService";
import { fetchUpcomingStarts } from "../services/assignmentsService";
import Pagination from "../components/Pagination";

export default function UsuarioDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState(null);
    const [creditos, setCreditos] = useState([]);
    const [pagos, setPagos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [upcomingStarts, setUpcomingStarts] = useState([]);
    const [upcomingMeta, setUpcomingMeta] = useState({ page: 1, pageSize: 8, totalItems: 0, totalPages: 1 });
    const [upcomingPage, setUpcomingPage] = useState(1);
    const [upcomingPageSize, setUpcomingPageSize] = useState(8);
    const [loadingUpcoming, setLoadingUpcoming] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return; // Salir si no hay id

        const load = async () => {
            setLoading(true);
            try {
                const u = await fetchUser(id).then(r => r.data);
                const [cr, pa, cl] = await Promise.all([
                    fetchCredits({ page: 1, pageSize: 2000 }).then(r => r.data?.data ?? []),
                    fetchPayments({ page: 1, pageSize: 500 }).then(r => r.data?.data ?? []),
                    fetchClients({ page: 1, pageSize: 500 }).then(r => r.data?.data ?? []),
                ]);
                setUsuario({
                    ...u,
                    status: (u.status || "ACTIVE").toUpperCase(),
                    phone: u.phone || "—",
                    alternatePhone: u.alternatePhone || "—",
                    address: u.address || "—",
                    document: u.document || "—",
                    responsability: u.responsability || "MEDIA",
                    salary: u.salary ?? 0,
                    salaryType: u.salaryType || "N_A",
                    comisions: u.comisions ?? 0,
                    birthDate: u.birthDate || null,
                });
                setCreditos(cr);
                setPagos(pa);
                setClientes(cl);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    useEffect(() => {
        setUpcomingPage(1);
    }, [id]);

    useEffect(() => {
        const role = (usuario?.role || "").toUpperCase();
        const isCollector = role === "COBRADOR" || role === "EMPLOYEE";
        if (!id || !isCollector) {
            setUpcomingStarts([]);
            setUpcomingMeta({ page: 1, pageSize: upcomingPageSize, totalItems: 0, totalPages: 1 });
            return;
        }

        const loadUpcoming = async () => {
            setLoadingUpcoming(true);
            try {
                const res = await fetchUpcomingStarts({
                    cobradorId: id,
                    page: upcomingPage,
                    pageSize: upcomingPageSize
                });
                const data = Array.isArray(res?.data?.data) ? res.data.data : [];
                const meta = res?.data?.meta || { page: upcomingPage, pageSize: upcomingPageSize, totalItems: data.length, totalPages: 1 };
                setUpcomingStarts(data);
                setUpcomingMeta(meta);
            } finally {
                setLoadingUpcoming(false);
            }
        };

        loadUpcoming();
    }, [id, usuario?.role, upcomingPage, upcomingPageSize]);

    const cobrosUsuario = useMemo(() => {
        return pagos
            .filter((p) => p.employeeId === id)
            .map((p) => {
                const credito = creditos.find((cr) => cr.id === p.creditId);
                const cliente = clientes.find((c) => c.id === credito?.clientId);
                return {
                    id: p.id,
                    fecha: p.date,
                    monto: p.amount,
                    cliente: cliente ? cliente.name : "Cliente desconocido",
                };
            });
    }, [pagos, creditos, clientes, id]);

    const totalCobrado = cobrosUsuario.reduce((acc, c) => acc + c.monto, 0);
    const creditosCargados = creditos.filter((c) => c.userId === id).length;
    const pagosRecibidos = cobrosUsuario.length;

    if (loading) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-6">
                <p className="text-center text-gray-500 dark:text-gray-400">Cargando usuario...</p>
            </div>
        );
    }

    if (!usuario)
        return (
            <div className="text-center text-red-400 mt-10">
                Usuario no encontrado.
            </div>
        );

    const roleDisplay = (usuario.role || "").toUpperCase();
    const statusDisplay = usuario.status || "ACTIVE";
    const birthDateDisplay = (() => {
        if (!usuario.birthDate) return "—";
        const parsed = new Date(usuario.birthDate);
        if (Number.isNaN(parsed.getTime())) return "—";
        return parsed.toLocaleDateString("es-AR", { timeZone: "UTC" });
    })();

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate("/usuarios");
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-10">

            {/* === BOTÓN VOLVER === */}
            <div className="flex justify-end">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                    <HiOutlineArrowLeft className="h-4 w-4" />
                    Volver
                </button>
            </div>
            {/* === DATOS PERSONALES === */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-8 p-6 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 transition">
                    {/* === Columna izquierda: Info del usuario === */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-1/2">
                        {/* Avatar / Inicial */}
                        <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold shadow-md">
                            {usuario.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Datos personales */}
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {usuario.name}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{usuario.email}</p>

                            <div className="flex flex-wrap gap-2 mt-2">
                                <span
                                    className={`w-fit rounded-full border px-3 py-1 text-xs font-medium tracking-wide ${roleDisplay === "ADMIN"
                                        ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                        : "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                        }`}
                                >
                                    {roleDisplay === "COBRADOR" || roleDisplay === "EMPLOYEE" ? "Cobrador" : roleDisplay}
                                </span>
                                <span
                                    className={`w-fit rounded-full border px-3 py-1 text-xs font-medium tracking-wide ${statusDisplay === "ACTIVE"
                                        ? "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
                                        : "border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300"
                                        }`}
                                >
                                    {statusDisplay === "ACTIVE" ? "Activo" : "Inactivo"}
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-y-1 sm:grid-cols-2 text-sm text-gray-700 dark:text-gray-300">
                                <p className="font-medium">Teléfono:</p>
                                <p>{usuario.phone}</p>
                                <p className="font-medium">Teléfono alternativo:</p>
                                <p>{usuario.alternatePhone}</p>
                                <p className="font-medium">Dirección:</p>
                                <p>{usuario.address}</p>
                                <p className="font-medium">Documento:</p>
                                <p>{usuario.document}</p>
                                <p className="font-medium">Cumpleaños:</p>
                                <p>{birthDateDisplay}</p>
                                <p className="font-medium">Responsabilidad:</p>
                                <p>{usuario.responsability}</p>
                                <p className="font-medium">Sueldo:</p>
                                <p>${usuario.salary?.toLocaleString("es-AR")}</p>
                                <p className="font-medium">Tipo sueldo:</p>
                                <p>{usuario.salaryType}</p>
                                <p className="font-medium">Comisión:</p>
                                <p>{usuario.comisions}%</p>
                            </div>
                        </div>
                    </div>

                    {/* === Columna derecha: KPIs y botón === */}
                    <div className="w-full lg:w-1/2 flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Kpi label="Créditos cargados" value={creditosCargados} />
                            <Kpi label="Pagos recibidos" value={pagosRecibidos} />
                            <Kpi
                                label="Total cobrado"
                                value={totalCobrado.toLocaleString("es-AR", {
                                    style: "currency",
                                    currency: "ARS",
                                    maximumFractionDigits: 0,
                                })}
                            />
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <button
                                onClick={() => navigate(`/usuarios/${usuario.id}/editar`)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-blue-500 bg-blue-600/90 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 hover:shadow-md active:scale-95 dark:bg-blue-700 dark:hover:bg-blue-600"
                            >
                                <HiPencil className="h-5 w-5" />
                                Editar información
                            </button>

                            <button
                                onClick={() => navigate(`/usuarios/${usuario.id}/reportes`)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-emerald-600/90 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 hover:shadow-md active:scale-95 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                            >
                                Ver reportes
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* === ORDENAR CLIENTES === */}
            {roleDisplay === "COBRADOR" || roleDisplay === "EMPLOYEE" ? (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <OrdenarClientes cobradorId={usuario.id} />
                </div>
            ) : null}

            {(roleDisplay === "COBRADOR" || roleDisplay === "EMPLOYEE") && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Creditos asignados aun no iniciados
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Esta seccion es visible para administracion y muestra los creditos de este cobrador que inician en el futuro.
                    </p>
                    {loadingUpcoming ? (
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Cargando creditos pendientes de inicio...</p>
                    ) : upcomingStarts.length === 0 ? (
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No hay creditos pendientes de inicio.</p>
                    ) : (
                        <div className="mt-4 space-y-4">
                            <div className="grid gap-3 sm:hidden">
                                {upcomingStarts.map((item) => (
                                    <article
                                        key={item.creditId}
                                        className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                                    >
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {item.client?.name || "Cliente"}
                                        </p>
                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                                            <span className="font-medium">Producto</span>
                                            <span className="text-right">{item.product || "Credito"}</span>
                                            <span className="font-medium">Monto</span>
                                            <span className="text-right">${Number(item.amount || 0).toLocaleString("es-AR")}</span>
                                            <span className="font-medium">Inicio cobro</span>
                                            <span className="text-right">{item.startDate ? new Date(item.startDate).toLocaleDateString("es-AR") : "-"}</span>
                                            <span className="font-medium">Proxima visita</span>
                                            <span className="text-right">{item.assignment?.nextVisitDate ? new Date(item.assignment.nextVisitDate).toLocaleDateString("es-AR") : "-"}</span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                            <div className="hidden overflow-x-auto sm:block">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                                            <th className="px-3 py-2">Cliente</th>
                                            <th className="px-3 py-2">Producto</th>
                                            <th className="px-3 py-2">Monto</th>
                                            <th className="px-3 py-2">Inicio cobro</th>
                                            <th className="px-3 py-2">Proxima visita</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {upcomingStarts.map((item) => (
                                            <tr key={item.creditId} className="border-b border-gray-100 dark:border-gray-800">
                                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{item.client?.name || "Cliente"}</td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.product || "Credito"}</td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">${Number(item.amount || 0).toLocaleString("es-AR")}</td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.startDate ? new Date(item.startDate).toLocaleDateString("es-AR") : "-"}</td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.assignment?.nextVisitDate ? new Date(item.assignment.nextVisitDate).toLocaleDateString("es-AR") : "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination
                                page={upcomingMeta.page ?? upcomingPage}
                                pageSize={upcomingMeta.pageSize ?? upcomingPageSize}
                                totalItems={upcomingMeta.totalItems ?? upcomingStarts.length}
                                totalPages={upcomingMeta.totalPages ?? 1}
                                onPageChange={setUpcomingPage}
                                onPageSizeChange={(size) => {
                                    setUpcomingPageSize(size);
                                    setUpcomingPage(1);
                                }}
                            />
                        </div>
                    )}
                </div>
            )}


        </div>
    );
}

function Kpi({ label, value }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {value}
            </div>
        </div>
    );
}
