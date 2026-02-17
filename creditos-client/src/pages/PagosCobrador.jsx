import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi";
import { toast } from "react-hot-toast";
import { fetchAssignmentsEnriched, postponeAssignment } from "../services/assignmentsService";

const isCreditFinalized = (credit) => {
    if (!credit) return true;
    if (String(credit.status || "").toUpperCase() === "PAID") return true;

    const totalInstallments = Number(credit.totalInstallments ?? 0);
    const paidInstallments = Number(credit.paidInstallments ?? 0);
    if (totalInstallments > 0 && paidInstallments >= totalInstallments) return true;

    const totalAmount = Number(credit.amount ?? 0);
    const receivedAmount = Number(credit.receivedAmount ?? 0);
    if (totalAmount > 0 && receivedAmount >= totalAmount) return true;

    return false;
};

export default function ClientesAsignadosCobrador({ cobradorId }) {
    const [tipo, setTipo] = useState("todos");
    const [clientesHoy, setClientesHoy] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [postponiendo, setPostponiendo] = useState(null);
    const navigate = useNavigate();

    const toLocalDateKey = (value) => {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        cargarClientes(tipo);
    }, [tipo, cobradorId]);

    async function cargarClientes(filtro) {
        setLoading(true);
        try {
            const hoy = new Date();
            const storedUser = localStorage.getItem("user");
            const currentUser = storedUser ? JSON.parse(storedUser) : null;
            const id = cobradorId || currentUser?.id;
            if (!id) {
                setClientesHoy([]);
                return;
            }

            const params = { cobradorId: id };
            if (filtro && filtro !== "todos") params.tipo = filtro.toUpperCase();

            const response = await fetchAssignmentsEnriched({ page: 1, pageSize: 500, dueOnly: true, ...params });
            const enriched = response.data?.data ?? [];
            const clientesDisponibles = [];
            const hoyKey = toLocalDateKey(hoy);

            for (const asig of enriched) {
                const cliente = asig.client;
                const credit = asig.credit;
                if (!credit) continue;
                if (isCreditFinalized(credit)) continue;

                const tipoAsignado = asig.tipoPago?.toLowerCase();
                const filtroCoincide = filtro === "todos" || tipoAsignado === filtro;
                if (!filtroCoincide) continue;

                const inicio = new Date(credit.startDate);
                const diffDias = Math.floor((hoy - inicio) / (1000 * 60 * 60 * 24));
                let venceHoy = false;
                if (tipoAsignado === "diario") venceHoy = true;
                if (tipoAsignado === "semanal") venceHoy = diffDias % 7 === 0;
                if (tipoAsignado === "mensual") venceHoy = hoy.getDate() === inicio.getDate();

                const cuotaActual = credit.paidInstallments + 1;
                const cuotasRestantes = credit.totalInstallments - credit.paidInstallments;
                const pendingAmount = asig.pendingAmount ?? credit.installmentAmount ?? 0;
                const pendingOccurrences = asig.effectiveOccurrences ?? 1;
                const pendingDates = Array.isArray(asig.pendingDates) ? asig.pendingDates : [];
                const pendingSince = asig.pendingSince || asig.nextVisitDate;
                const pendingDatesFormatted = pendingDates.map((d) => new Date(d).toLocaleDateString("es-AR"));

                const creditStartKey = toLocalDateKey(credit.startDate);
                const nextVisitKey = toLocalDateKey(asig.nextVisitDate);
                const habilitadoPorFechaInicio = !creditStartKey || creditStartKey <= hoyKey;
                const habilitadoPorVisita = !nextVisitKey || nextVisitKey <= hoyKey;
                const disponibleHoy = habilitadoPorFechaInicio && habilitadoPorVisita;
                if (!disponibleHoy) continue;

                const item = {
                    assignmentId: asig.id,
                    ...cliente,
                    creditoId: credit.id,
                    monto: credit.installmentAmount,
                    estado: credit.status,
                    tipoPago: tipoAsignado,
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
                    disponibleHoy
                };

                clientesDisponibles.push(item);
            }

            setClientesHoy(clientesDisponibles);
            setError(null);
        } catch (err) {
            const status = err?.response?.status;
            setError(status === 403 ? "No tenes permisos para ver estas asignaciones." : "Ocurrio un error al cargar los clientes.");
            setClientesHoy([]);
        } finally {
            setLoading(false);
        }
    }

    async function reprogramarCliente(assignmentId, nombre) {
        if (!assignmentId) return;
        try {
            setPostponiendo(assignmentId);
            await postponeAssignment(assignmentId);
            toast.success(`Reprogramado ${nombre} para el proximo dia.`);
            await cargarClientes(tipo);
        } catch {
            toast.error("No se pudo reprogramar al cliente.");
        } finally {
            setPostponiendo(null);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#08122f] to-[#0b1f55] px-3 py-4 sm:px-4 sm:py-6">
            <div className="mx-auto max-w-5xl space-y-4">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-sm">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
                        Cobros del dia
                    </h1>
                    <p className="mt-1 text-sm text-slate-300">
                        Solo se muestran clientes habilitados para hoy.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                    {["todos", "diario", "semanal", "mensual"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setTipo(f)}
                            className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium transition sm:w-auto ${tipo === f
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-slate-900/80 text-slate-200 hover:bg-slate-700"
                                }`}
                        >
                            {f === "todos" ? "Todos" : `${f[0].toUpperCase()}${f.slice(1)}`}
                        </button>
                    ))}
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 shadow-sm">
                <div className="border-b border-slate-700 p-4">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-100">
                        Cobros a realizar hoy ({clientesHoy.length})
                    </h2>
                </div>

                {loading ? (
                    <p className="p-4 text-gray-500 dark:text-gray-400">Cargando clientes...</p>
                ) : error ? (
                    <p className="p-4 text-red-500 dark:text-red-400">{error}</p>
                ) : clientesHoy.length === 0 ? (
                    <p className="p-4 text-gray-500 dark:text-gray-400">No hay pagos programados para hoy.</p>
                ) : (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {clientesHoy.map((c) => (
                            <li key={c.creditoId} className="flex flex-col gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                                        {c.orden ? `${c.orden}. ` : ""}{c.name}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {c.address || "Sin direccion"}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Ultimo pago: <span className="font-medium text-slate-700 dark:text-slate-200">{c.lastPayment ? new Date(c.lastPayment).toLocaleDateString("es-AR") : "Sin pagos"}</span>
                                    </p>
                                    <div className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs sm:text-sm text-slate-600 dark:bg-slate-800/70 dark:text-slate-300 space-y-1">
                                        <p>Tipo: {c.tipoPago ? `${c.tipoPago[0].toUpperCase()}${c.tipoPago.slice(1)}` : "-"}</p>
                                        <p>Monto cuota: <span className="font-semibold text-slate-800 dark:text-slate-200">${Number(c.monto || 0).toLocaleString("es-AR")}</span></p>
                                        <p>Cuota: <span className="font-semibold text-slate-700 dark:text-slate-200">{c.cuotaActual}/{c.totalCuotas}</span> ({c.cuotasRestantes} restantes)</p>
                                        <p>Estado: <span className="capitalize">{String(c.estado || "").toLowerCase()}</span></p>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {c.paidToday ? (
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Cobrado hoy</span>
                                        ) : c.venceHoy ? (
                                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Vence hoy</span>
                                        ) : null}
                                    </div>
                                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 space-y-1">
                                        <p>
                                            Monto pendiente estimado: <span className="font-semibold">${Number(c.pendingAmount || 0).toLocaleString("es-AR")}</span>
                                            {c.pendingOccurrences > 1 && ` (${c.pendingOccurrences} dias)`}
                                        </p>
                                        {c.pendingDatesFormatted?.length > 0 && <p>Correspondiente a: {c.pendingDatesFormatted.join(" - ")}</p>}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 sm:items-center pt-1">
                                    <button
                                        onClick={() => navigate(`/cobrador/pagos/${c.creditoId}`, {
                                            state: {
                                                pendingInfo: {
                                                    pendingAmount: c.pendingAmount,
                                                    pendingOccurrences: c.pendingOccurrences,
                                                    pendingDates: c.pendingDates,
                                                    pendingSince: c.pendingSince
                                                }
                                            }
                                        })}
                                        disabled={c.paidToday}
                                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none w-full sm:w-auto ${c.paidToday ? "bg-gray-400 text-white cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-500 shadow-sm"}`}
                                    >
                                        {c.paidToday ? "Ya cobrado" : "Cobrar"}
                                        <HiArrowRight className="h-4 w-4" />
                                    </button>

                                    {!c.paidToday && (
                                        <button
                                            type="button"
                                            onClick={() => reprogramarCliente(c.assignmentId, c.name)}
                                            disabled={postponiendo === c.assignmentId}
                                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 w-full sm:w-auto"
                                        >
                                            {postponiendo === c.assignmentId ? "Reprogramando..." : "No pude cobrar"}
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            </div>
        </div>
    );
}
