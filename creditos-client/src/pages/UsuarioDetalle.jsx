import { useEffect, useMemo, useRef, useState } from "react";
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
    const assignedPortfolioRef = useRef(null);

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

    const inicioSemana = useMemo(() => {
        const now = new Date();
        const start = new Date(now);
        const day = start.getDay();
        const diff = day === 0 ? 6 : day - 1;
        start.setDate(start.getDate() - diff);
        start.setHours(0, 0, 0, 0);
        return start;
    }, []);

    const cobrosSemana = cobrosUsuario
        .filter((c) => {
            const fechaPago = new Date(c.fecha);
            return !Number.isNaN(fechaPago.getTime()) && fechaPago >= inicioSemana;
        });

    const totalCobradoSemana = cobrosSemana.reduce((acc, c) => acc + c.monto, 0);
    const creditosCargados = creditos.filter((c) => {
        if (c.userId !== id) return false;
        const fechaCredito = new Date(c.createdAt || c.startDate);
        return !Number.isNaN(fechaCredito.getTime()) && fechaCredito >= inicioSemana;
    }).length;
    const pagosRecibidos = cobrosSemana.length;

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
    const isCollector = roleDisplay === "COBRADOR" || roleDisplay === "EMPLOYEE";
    const birthDateDisplay = (() => {
        if (!usuario.birthDate) return "—";
        const parsed = new Date(usuario.birthDate);
        if (Number.isNaN(parsed.getTime())) return "—";
        return parsed.toLocaleDateString("es-AR", { timeZone: "UTC" });
    })();
    const detailItems = [
        { label: "Telefono", value: usuario.phone },
        { label: "Telefono alternativo", value: usuario.alternatePhone },
        { label: "Direccion", value: usuario.address },
        { label: "Documento", value: usuario.document },
        { label: "Cumpleanos", value: birthDateDisplay },
        { label: "Responsabilidad", value: usuario.responsability },
        { label: "Sueldo", value: `$${usuario.salary?.toLocaleString("es-AR")}` },
        { label: "Tipo de sueldo", value: usuario.salaryType },
        { label: "Comision por credito o cliente nuevo", value: formatCommissionValue(usuario.comisions) },
    ];

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate("/usuarios");
        }
    };

    const handleGoToAssignedPortfolio = () => {
        assignedPortfolioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 space-y-8 sm:px-6 xl:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                        Usuario
                    </p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        Perfil y rendimiento
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                        Visualiza la informacion principal del usuario, sus indicadores semanales y accesos rapidos a gestion y reportes.
                    </p>
                </div>
                <button
                    onClick={handleBack}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white"
                >
                    <HiOutlineArrowLeft className="h-4 w-4" />
                    Volver
                </button>
            </div>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950">
                <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_42%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(30,41,59,0.96))] px-6 py-7 text-white sm:px-8 lg:px-10">
                    <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 space-y-4 xl:max-w-xl 2xl:max-w-2xl">
                            <div>
                                <h2 className="max-w-full break-words text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-[2.1rem]">
                                    {usuario.name}
                                </h2>
                                <p className="mt-1 text-sm text-slate-300">{usuario.email}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100">
                                    ID {usuario.id?.slice?.(0, 8) || usuario.id}
                                </span>
                                <span
                                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${roleDisplay === "ADMIN"
                                        ? "border-fuchsia-300/25 bg-fuchsia-400/15 text-fuchsia-100"
                                        : "border-amber-300/25 bg-amber-400/15 text-amber-100"
                                        }`}
                                >
                                    {isCollector ? "Cobrador" : roleDisplay}
                                </span>
                                <span
                                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${statusDisplay === "ACTIVE"
                                        ? "border-emerald-300/25 bg-emerald-400/15 text-emerald-100"
                                        : "border-slate-300/20 bg-slate-200/10 text-slate-200"
                                        }`}
                                >
                                    {statusDisplay === "ACTIVE" ? "Activo" : "Inactivo"}
                                </span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                <HighlightCard
                                    label="Rol operativo"
                                    value={isCollector ? "Cobrador" : roleDisplay}
                                    tone="blue"
                                />
                                <HighlightCard
                                    label="Responsabilidad"
                                    value={usuario.responsability}
                                    tone="emerald"
                                />
                                <HighlightCard
                                    label="Esquema salarial"
                                    value={usuario.salaryType}
                                    tone="amber"
                                />
                            </div>
                        </div>

                        <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[34rem]">
                            <Kpi label="Creditos cargados" value={creditosCargados} hint="Esta semana" accent="blue" />
                            <Kpi label="Pagos recibidos" value={pagosRecibidos} hint="Esta semana" accent="emerald" />
                            <Kpi
                                label="Total cobrado"
                                value={totalCobradoSemana.toLocaleString("es-AR", {
                                    style: "currency",
                                    currency: "ARS",
                                    maximumFractionDigits: 0,
                                })}
                                hint="Semana actual"
                                accent="amber"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.4fr)_340px] lg:px-10 lg:py-8">
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                Ficha personal
                            </p>
                            <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                Informacion del usuario
                            </h3>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {detailItems.map((item) => (
                                <DetailItem key={item.label} label={item.label} value={item.value} />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/70">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                Acciones
                            </p>
                            <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                                Gestion rapida
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                Actualiza la ficha del usuario o entra directo a sus reportes sin salir de esta vista.
                            </p>
                        </div>

                        <div className="grid gap-3">
                            {isCollector ? (
                                <>
                                    <ActionButton
                                        onClick={handleGoToAssignedPortfolio}
                                        tone="amber"
                                    >
                                        Ordenar clientes asignados
                                    </ActionButton>

                                    <ActionButton
                                        onClick={() => navigate(`/usuarios/${usuario.id}/sueldo`)}
                                        tone="emerald"
                                    >
                                        Sueldo y comision
                                    </ActionButton>
                                </>
                            ) : null}

                            <ActionButton
                                onClick={() => navigate(`/usuarios/${usuario.id}/reportes`)}
                                tone="blue"
                            >
                                Ver reportes
                            </ActionButton>

                            <ActionButton
                                onClick={() => navigate(`/usuarios/${usuario.id}/editar`)}
                                tone="neutral"
                                icon={<HiPencil className="h-4 w-4" />}
                            >
                                Editar informacion
                            </ActionButton>
                        </div>
                    </div>
                </div>
            </section>

            {isCollector ? (
                <div ref={assignedPortfolioRef} className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950">
                    <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                            Cartera asignada
                        </p>
                        <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                            Orden de clientes del cobrador
                        </h3>
                    </div>
                    <OrdenarClientes cobradorId={usuario.id} />
                </div>
            ) : null}

            {isCollector && (
                <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                Inicio futuro
                            </p>
                            <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                                Creditos asignados aun no iniciados
                            </h3>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                            {upcomingMeta.totalItems ?? upcomingStarts.length} pendientes
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Esta seccion es visible para administracion y muestra los creditos de este cobrador que inician en el futuro.
                    </p>
                    {loadingUpcoming ? (
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Cargando creditos pendientes de inicio...</p>
                    ) : upcomingStarts.length === 0 ? (
                        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                            No hay creditos pendientes de inicio.
                        </div>
                    ) : (
                        <div className="mt-4 space-y-4">
                            <div className="grid gap-3 sm:hidden">
                                {upcomingStarts.map((item) => (
                                    <article
                                        key={item.creditId}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                                    >
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {item.client?.name || "Cliente"}
                                        </p>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
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
                            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 sm:block dark:border-slate-800">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                                            <th className="px-3 py-2">Cliente</th>
                                            <th className="px-3 py-2">Producto</th>
                                            <th className="px-3 py-2">Monto</th>
                                            <th className="px-3 py-2">Inicio cobro</th>
                                            <th className="px-3 py-2">Proxima visita</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {upcomingStarts.map((item) => (
                                            <tr key={item.creditId} className="border-b border-slate-100 dark:border-slate-900">
                                                <td className="px-3 py-3 text-slate-900 dark:text-slate-100">{item.client?.name || "Cliente"}</td>
                                                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{item.product || "Credito"}</td>
                                                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">${Number(item.amount || 0).toLocaleString("es-AR")}</td>
                                                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{item.startDate ? new Date(item.startDate).toLocaleDateString("es-AR") : "-"}</td>
                                                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{item.assignment?.nextVisitDate ? new Date(item.assignment.nextVisitDate).toLocaleDateString("es-AR") : "-"}</td>
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
                </section>
            )}


        </div>
    );
}

function formatCommissionValue(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return "Sin comision";
    }

    if (numericValue <= 100) {
        return `${numericValue}%`;
    }

    return formatCurrency(numericValue);
}

function DetailItem({ label, value }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</div>
            <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 break-words">
                {value}
            </div>
        </div>
    );
}

function HighlightCard({ label, value, tone = "blue" }) {
    const toneClasses = {
        blue: "border-blue-300/20 bg-blue-400/10 text-blue-50",
        emerald: "border-emerald-300/20 bg-emerald-400/10 text-emerald-50",
        amber: "border-amber-300/20 bg-amber-400/10 text-amber-50",
    };

    return (
        <div className={`rounded-2xl border px-4 py-3 backdrop-blur ${toneClasses[tone] || toneClasses.blue}`}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">{label}</div>
            <div className="mt-1 text-sm font-semibold text-white">{value}</div>
        </div>
    );
}

function ActionButton({ children, onClick, tone = "neutral", icon = null }) {
    const toneClasses = {
        blue: "border-blue-400/35 bg-blue-500/10 text-blue-100 hover:border-blue-300/50 hover:bg-blue-500/16",
        emerald: "border-emerald-400/35 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300/50 hover:bg-emerald-500/16",
        amber: "border-amber-400/35 bg-amber-500/10 text-amber-100 hover:border-amber-300/50 hover:bg-amber-500/16",
        neutral: "border-slate-300/80 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-900 dark:hover:text-white",
    };

    return (
        <button
            onClick={onClick}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${toneClasses[tone] || toneClasses.neutral}`}
        >
            {icon}
            {children}
        </button>
    );
}

function Kpi({ label, value, hint, accent = "blue" }) {
    const accentClasses = {
        blue: "border-blue-400/30 bg-blue-500/10",
        emerald: "border-emerald-400/30 bg-emerald-500/10",
        amber: "border-amber-400/30 bg-amber-500/10",
    };

    return (
        <div className={`rounded-[22px] border p-4 text-left shadow-[0_16px_35px_-32px_rgba(15,23,42,0.75)] ${accentClasses[accent] || accentClasses.blue}`}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">{label}</div>
            <div className="mt-3 text-2xl font-black tracking-tight text-white sm:text-[1.9rem]">
                {value}
            </div>
            {hint ? (
                <div className="mt-2 text-xs font-medium text-slate-300/80">
                    {hint}
                </div>
            ) : null}
        </div>
    );
}
