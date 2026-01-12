import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi";
import { toast } from "react-hot-toast";
import { fetchAssignmentsEnriched, postponeAssignment } from "../services/assignmentsService";

export default function ClientesAsignadosCobrador({ cobradorId }) {
    const [tipo, setTipo] = useState("todos");
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [postponiendo, setPostponiendo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        cargarClientes(tipo);
    }, [tipo, cobradorId]);

    async function cargarClientes(filtro) {
        setLoading(true);
        try {
            const hoy = new Date();

            // Determinamos el cobrador actual
            const storedUser = localStorage.getItem("user");
            const currentUser = storedUser ? JSON.parse(storedUser) : null;
            const id = cobradorId || currentUser?.id;
            if (!id) {
                setClientes([]);
                return;
            }

            // 🔍 Traemos asignaciones enriquecidas (cada asignación incluye 'credit' y 'paidToday')
            const params = { cobradorId: id };
            if (filtro && filtro !== "todos") {
                params.tipo = filtro.toUpperCase();
            }

            const response = await fetchAssignmentsEnriched({ page: 1, pageSize: 500, dueOnly: true, ...params });
            const enriched = response.data?.data ?? [];

            // Para cada asignación enriquecida, verificamos que tenga crédito y si le toca pagar hoy (el backend ya calculó paidToday)
            const clientesOrdenados = [];

            for (const asig of enriched) {
                const cliente = asig.client;
                const credit = asig.credit;
                if (!credit) continue; // sin crédito activo

                const tipoAsignado = asig.tipoPago?.toLowerCase();
                const filtroCoincide = filtro === "todos" || tipoAsignado === filtro;
                if (!filtroCoincide) continue;

                // Calculamos referencia de vencimiento para pintar indicadores
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

                clientesOrdenados.push({
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
                    nextVisitDate: asig.nextVisitDate
                });
            }

            setClientes(clientesOrdenados);
        } catch (err) {
            const status = err?.response?.status;
            if (status === 403) {
                setError("No tenés permisos para ver las asignaciones de este cobrador.");
            } else {
                setError("Ocurrió un error al cargar los clientes.");
                console.error(err);
            }
            setClientes([]);
        } finally {
            setLoading(false);
        }
    }

    async function reprogramarCliente(assignmentId, nombre) {
        if (!assignmentId) return;
        try {
            setPostponiendo(assignmentId);
            await postponeAssignment(assignmentId);
            toast.success(`Reprogramado ${nombre} para el próximo día.`);
            await cargarClientes(tipo);
        } catch (err) {
            console.error(err);
            toast.error("No se pudo reprogramar al cliente.");
        } finally {
            setPostponiendo(null);
        }
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Pagos del día
            </h1>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2">
                {["todos", "diario", "semanal", "mensual"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setTipo(f)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tipo === f
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            }`}
                    >
                        {f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Lista */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Cobros a realizar hoy ({clientes.length})
                    </h2>
                </div>

                {loading ? (
                    <p className="p-4 text-gray-500 dark:text-gray-400">Cargando clientes...</p>
                ) : error ? (
                    <p className="p-4 text-red-500 dark:text-red-400">{error}</p>
                ) : clientes.length === 0 ? (
                    <p className="p-4 text-gray-500 dark:text-gray-400">No hay pagos programados para hoy.</p>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {clientes.map((c) => (
                            <li
                                key={c.creditoId}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {c.orden ? `${c.orden}. ` : ""}{c.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {c.address || "Sin dirección"}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Último pago: <span className="font-medium text-gray-700 dark:text-gray-200">{c.lastPayment ? new Date(c.lastPayment).toLocaleDateString("es-AR") : "Sin pagos"}</span>
                                    </p>

                                    {/* 💰 Info de pago */}
                                    <p className="text-sm text-gray-400 dark:text-gray-500">
                                        <span>
                                            Tipo: {c.tipoPago ? c.tipoPago.charAt(0).toUpperCase() + c.tipoPago.slice(1) : "-"}
                                        </span>{" "}
                                        <span>
                                            — Monto cuota:
                                            <span className="font-semibold text-gray-800 dark:text-gray-200"> ${c.monto.toLocaleString("es-AR")}</span>
                                        </span>{" "}
                                        <span>
                                            — Cuota:
                                            <span className="font-semibold text-gray-700 dark:text-gray-200"> {c.cuotaActual}/{c.totalCuotas}</span>{" "}
                                            ({c.cuotasRestantes} restantes)
                                        </span>{" "}
                                        <span>
                                            — Estado: <span className="capitalize">{c.estado.toLowerCase()}</span>
                                        </span>
                                        {c.paidToday ? (
                                            <span className="ml-3 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Cobrado hoy</span>
                                        ) : c.venceHoy ? (
                                            <span className="ml-3 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Vence hoy</span>
                                        ) : null}
                                    </p>

                                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 space-y-1">
                                        <p>
                                            Monto pendiente estimado:
                                            <span className="font-semibold"> ${Number(c.pendingAmount || 0).toLocaleString("es-AR")}</span>
                                            {c.pendingOccurrences > 1 && ` (${c.pendingOccurrences} días)`}
                                        </p>
                                        {c.pendingDatesFormatted?.length > 0 && (
                                            <p>
                                                Correspondiente a: {c.pendingDatesFormatted.join(" • ")}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
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
                                        className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm focus:outline-none ${c.paidToday ? "bg-gray-400 text-white cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-500"}`}
                                    >
                                        {c.paidToday ? "Ya cobrado" : "Cobrar"}
                                        <HiArrowRight className="h-4 w-4" />
                                    </button>

                                    {!c.paidToday && (
                                        <button
                                            type="button"
                                            onClick={() => reprogramarCliente(c.assignmentId, c.name)}
                                            disabled={postponiendo === c.assignmentId}
                                            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
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
    );
}
