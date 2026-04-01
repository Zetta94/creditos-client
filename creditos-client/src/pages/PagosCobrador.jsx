import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi";
import { fetchAssignmentsEnriched } from "../services/assignmentsService";
import { useSelector } from "react-redux";
import Pagination from "../components/Pagination";

const CREDIT_TYPE_TO_FILTER = {
    DAILY: "diario",
    WEEKLY: "semanal",
    QUINCENAL: "quincenal",
    MONTHLY: "mensual",
    ONE_TIME: "mensual",
};

const isCreditFinalized = (credit) => {
    if (!credit) return true;
    if (String(credit.status || "").toUpperCase() === "PAID") return true;

    const totalInstallments = Number(credit.totalInstallments ?? 0);
    const paidInstallments = Number(credit.paidInstallments ?? 0);
    if (totalInstallments > 0 && paidInstallments >= totalInstallments) return true;

    const totalAmount = Number(credit.amount ?? 0);
    const installmentAmount = Number(
        credit.installmentAmount ?? (totalInstallments > 0 ? totalAmount / totalInstallments : 0)
    );
    const receivedAmount = Number(credit.receivedAmount ?? 0);

    if (totalInstallments > 0 && installmentAmount > 0) {
        const paidInstallmentsByAmount = Math.floor(receivedAmount / installmentAmount);
        return paidInstallmentsByAmount >= totalInstallments;
    }

    if (totalInstallments <= 0 && totalAmount > 0 && receivedAmount >= totalAmount) return true;

    return false;
};

export default function ClientesAsignadosCobrador({ cobradorId }) {
    const [tipo, setTipo] = useState("todos");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ page: 1, pageSize: 20, totalItems: 0, totalPages: 1 });
    const [clientesHoy, setClientesHoy] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const trayectoActivo = useSelector(state => state.trayecto.active);

    const formatCurrency = (value) => `$${Number(value || 0).toLocaleString("es-AR")}`;

    const getPendingCopy = (item) => {
        const count = Number(item.pendingOccurrences || 0);
        if (count <= 0) return null;
        return `${count} ${count === 1 ? "cuota pendiente" : "cuotas pendientes"}`;
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    useEffect(() => {
        cargarClientes(tipo, page, search);
    }, [tipo, cobradorId, page, search]);

    async function cargarClientes(filtro, currentPage = 1, searchText = "") {
        setLoading(true);
        try {
            const hoy = new Date();
            hoy.setHours(23, 59, 59, 999);
            const storedUser = localStorage.getItem("user");
            const currentUser = storedUser ? JSON.parse(storedUser) : null;
            const id = cobradorId || currentUser?.id;
            if (!id) {
                setClientesHoy([]);
                return;
            }

            const params = { cobradorId: id };
            if (searchText) params.q = searchText;

            const response = await fetchAssignmentsEnriched({ page: 1, pageSize: 1000, dueOnly: true, ...params });
            const enriched = response.data?.data ?? [];
            const clientesDisponibles = [];

            for (const asig of enriched) {
                const cliente = asig.client;
                const credit = asig.credit;
                if (!credit) continue;
                if (isCreditFinalized(credit)) continue;

                const tipoCredito = CREDIT_TYPE_TO_FILTER[String(credit.type || "").toUpperCase()] || asig.tipoPago?.toLowerCase() || "mensual";
                const filtroCoincide = filtro === "todos" || tipoCredito === filtro;
                if (!filtroCoincide) continue;

                const pendingSinceDate = asig.pendingSince ? new Date(asig.pendingSince) : null;
                const nextVisitDate = asig.nextVisitDate ? new Date(asig.nextVisitDate) : null;
                const venceHoy = Boolean(
                    (nextVisitDate && nextVisitDate <= hoy) ||
                    (pendingSinceDate && pendingSinceDate <= hoy)
                );

                const cuotaActual = credit.paidInstallments + 1;
                const cuotasRestantes = credit.totalInstallments - credit.paidInstallments;
                const pendingAmount = asig.pendingAmount ?? credit.installmentAmount ?? 0;
                const pendingOccurrences = asig.effectiveOccurrences ?? 1;
                const pendingDates = Array.isArray(asig.pendingDates) ? asig.pendingDates : [];
                const pendingSince = asig.pendingSince || asig.nextVisitDate;
                const pendingDatesFormatted = pendingDates.map((d) => new Date(d).toLocaleDateString("es-AR"));
                const estaHabilitadoHoy = Boolean(
                    (nextVisitDate && nextVisitDate <= hoy) ||
                    (pendingSinceDate && pendingSinceDate <= hoy)
                );

                if (!estaHabilitadoHoy) continue;

                const item = {
                    assignmentId: asig.id,
                    ...cliente,
                    creditoId: credit.id,
                    monto: credit.installmentAmount,
                    estado: credit.status,
                    tipoPago: tipoCredito,
                    cuotaActual,
                    cuotasRestantes,
                    totalCuotas: credit.totalInstallments,
                    paidToday: !!asig.paidToday,
                    lastPayment: asig.lastPayment || null,
                    venceHoy,
                    orden: asig.orden,
                    pendingAmount,
                    pendingOccurrences,
                    pendingDates,
                    pendingDatesFormatted,
                    pendingSince,
                    nextVisitDate: asig.nextVisitDate,
                    disponibleHoy: true
                };

                clientesDisponibles.push(item);
            }

            const pageSize = 20;
            const totalItems = clientesDisponibles.length;
            const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
            const safePage = Math.min(Math.max(1, currentPage), totalPages);
            const startIndex = (safePage - 1) * pageSize;
            const paginatedItems = clientesDisponibles
                .sort((a, b) => Number(a.orden ?? 0) - Number(b.orden ?? 0))
                .slice(startIndex, startIndex + pageSize);

            setClientesHoy(paginatedItems);
            setMeta({
                page: safePage,
                pageSize,
                totalItems,
                totalPages
            });
            setError(null);
        } catch (err) {
            const status = err?.response?.status;
            setError(status === 403 ? "No tenes permisos para ver estas asignaciones." : "Ocurrio un error al cargar los clientes.");
            setClientesHoy([]);
            setMeta({ page: 1, pageSize: 20, totalItems: 0, totalPages: 1 });
        } finally {
            setLoading(false);
        }
    }

    // Cartel si el trayecto no está activo
    if (!trayectoActivo) {
        return (
            <div className="min-h-screen bg-[#060b1d] text-white flex flex-col items-center justify-center px-4"
                 style={{ backgroundImage: "radial-gradient(circle at 50% -20%, #1a2b5a 0%, #060b1d 80%)", backgroundAttachment: "fixed" }}>
                <div className="rounded-[32px] bg-white/5 border border-white/10 p-8 backdrop-blur-2xl shadow-2xl max-w-sm w-full text-center">
                    <div className="mb-4 flex flex-col items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                        <h2 className="text-xl font-black tracking-tight text-white uppercase">Acceso Restringido</h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-6 font-medium leading-relaxed">
                        Debes iniciar tu jornada desde el panel de inicio para poder gestionar los cobros de hoy.
                    </p>
                    <button
                        className="w-full h-14 rounded-2xl bg-white/10 border border-white/20 text-white font-black text-sm tracking-widest uppercase hover:bg-white/20 transition-all active:scale-95 shadow-xl"
                        onClick={() => navigate('/cobrador/dashboard')}
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#060b1d] text-white" 
             style={{ backgroundImage: "radial-gradient(circle at 50% -20%, #1a2b5a 0%, #060b1d 80%)", backgroundAttachment: "fixed" }}>
            <div className="mx-auto max-w-2xl px-4 py-8 pb-32 animate-fade-in space-y-6">
                
                {/* ── Header ── */}
                <header className="rounded-[32px] bg-white/5 border border-white/10 p-8 backdrop-blur-2xl shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Mi Agenda</p>
                        <h1 className="text-3xl font-black tracking-tight text-white mb-1">Cobros del Día</h1>
                        <p className="text-xs text-slate-400 font-medium tracking-wide">
                            Solo se muestran clientes habilitados para hoy.
                        </p>
                    </div>
                </header>

                {/* --- Filtros (Horizontal Scrollable) --- */}
                <div className="relative">
                    <div className="flex overflow-x-auto gap-2 p-1.5 bg-white/5 rounded-[24px] border border-white/5 backdrop-blur-md no-scrollbar scroll-smooth">
                        {["todos", "diario", "semanal", "quincenal", "mensual"].map((f) => (
                            <button
                                key={f}
                                onClick={() => {
                                    setTipo(f);
                                    setPage(1);
                                }}
                                className={`whitespace-nowrap px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${tipo === f
                                    ? "bg-white/95 text-blue-900 shadow-xl shadow-white/10 scale-[1.02]"
                                    : "text-slate-400 hover:text-white hover:bg-white/5 active:scale-95"
                                    }`}
                            >
                                {f === "todos" ? "Todos" : f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- Buscador --- */}
                <div className="rounded-[28px] bg-white/5 border border-white/5 p-6 backdrop-blur-xl shadow-lg">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Buscar Cliente</p>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Nombre, documento o telefono..."
                        className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                    />
                </div>

                <div className="space-y-4">
                    <div className="px-4 flex items-center justify-between">
                        <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            Listado de Cobros ({meta.totalItems})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-slate-500 font-bold animate-pulse">Cargando clientes...</div>
                    ) : error ? (
                        <div className="p-8 text-center text-rose-500 font-bold bg-rose-500/10 rounded-3xl border border-rose-500/20">{error}</div>
                    ) : clientesHoy.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 font-bold bg-white/5 rounded-[32px] border border-white/5">No hay pagos para hoy.</div>
                    ) : (
                        <div className="space-y-6">
                            {clientesHoy.map((c) => (
                                <div key={c.creditoId}>
                                    {/* Desktop Row - Oculto en móvil */}
                                    <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1.5fr] md:items-center md:gap-4 p-5 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all">
                                        <div>
                                            <p className="font-black text-white">{c.name}</p>
                                            <p className="text-[10px] text-slate-500 truncate">{c.address}</p>
                                        </div>
                                        <div className="text-center font-black text-emerald-400">{formatCurrency(c.monto)}</div>
                                        <div className="text-center font-bold text-slate-400">{c.cuotaActual}/{c.totalCuotas}</div>
                                        <div className="flex justify-center">
                                            {c.paidToday ? (
                                                <span className="text-[10px] font-black text-emerald-500 uppercase">COBRADO</span>
                                            ) : (
                                                <span className={`text-[10px] font-black uppercase ${c.venceHoy ? "text-orange-400" : "text-slate-500"}`}>
                                                    {c.venceHoy ? "PARA HOY" : "PENDIENTE"}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => navigate(`/cobrador/pagos/${c.creditoId}`, { state: { pendingInfo: { pendingAmount: c.pendingAmount, pendingOccurrences: c.pendingOccurrences, pendingDates: c.pendingDates, pendingSince: c.pendingSince }}})} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs">Cobrar</button>
                                        </div>
                                    </div>

                                    {/* Mobile card - iPhone Premium */}
                                    <div className="md:hidden rounded-[32px] bg-white/5 border border-white/10 p-6 backdrop-blur-xl shadow-2xl space-y-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xl font-black text-white tracking-tighter truncate">{c.name}</h4>
                                                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-1 mb-2">DIRECCIÓN</p>
                                                <p className="text-sm text-slate-300 line-clamp-2 leading-tight">{c.address || "Sin dirección registrada"}</p>
                                            </div>
                                            <div className="shrink-0 h-10 px-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{c.tipoPago}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Cuota</p>
                                                <p className="text-lg font-black text-white">{c.cuotaActual} <span className="text-xs text-slate-500 font-bold italic">/ {c.totalCuotas}</span></p>
                                            </div>
                                            <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Monto</p>
                                                <p className="text-lg font-black text-emerald-400">{formatCurrency(c.monto)}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            {c.paidToday ? (
                                                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">COBRADO</div>
                                            ) : c.venceHoy ? (
                                                <div className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-orange-400 uppercase tracking-widest">VENCE HOY</div>
                                            ) : (
                                                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">PENDIENTE</div>
                                            )}
                                            {String(c.estado || "").toUpperCase() === "OVERDUE" && (
                                                <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-black text-rose-500 uppercase tracking-widest">ATRASADO</div>
                                            )}
                                        </div>

                                        <div className="pt-2 flex flex-col gap-3">
                                            {!c.paidToday ? (
                                                <>
                                                    <button
                                                        onClick={() => navigate(`/cobrador/pagos/${c.creditoId}`, { state: { pendingInfo: { pendingAmount: c.pendingAmount, pendingOccurrences: c.pendingOccurrences, pendingDates: c.pendingDates, pendingSince: c.pendingSince }}})}
                                                        className="h-16 w-full rounded-3xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-black text-lg tracking-tight shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                                                    >
                                                        COBRAR AHORA
                                                        <HiArrowRight className="h-6 w-6" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/cobrador/pagos/${c.creditoId}/reprogramar`, { state: { assignmentId: c.assignmentId, clientName: c.name }})}
                                                        className="h-12 w-full rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold text-sm tracking-wide transition-all active:scale-95"
                                                    >
                                                        No pude realizar el cobro
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="h-16 w-full rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-3 text-emerald-400 font-black">
                                                    TRANSACCIÓN COMPLETADA
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {!loading && !error && meta.totalPages > 1 && (
                        <div className="pt-8">
                            <Pagination
                                page={meta.page}
                                pageSize={meta.pageSize}
                                totalItems={meta.totalItems}
                                totalPages={meta.totalPages}
                                onPageChange={setPage}
                                variant="dark"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
