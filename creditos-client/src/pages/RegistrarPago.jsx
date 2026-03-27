import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { loadCredit } from "../store/creditsSlice";
import { loadClient } from "../store/clientsSlice";
import { addPayment } from "../store/paymentsSlice";
import { HiArrowLeft, HiTrash, HiPlus } from "react-icons/hi";

export default function RegistrarPago() {
    const { creditoId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const { current: credito, loading: loadingCredit } = useSelector(state => state.credits) || { current: null, loading: false };
    const { current: clienteStore } = useSelector(state => state.clients) || { current: null };
    const { loading: savingPayment } = useSelector(state => state.payments) || { loading: false };

    const cliente = credito?.client || (clienteStore?.id === credito?.clientId ? clienteStore : null);

    const [pagos, setPagos] = useState([{ metodo: "efectivo", monto: "", id: Date.now() }]);
    const [nota, setNota] = useState("");
    const [cuotasPagadasHoy, setCuotasPagadasHoy] = useState(1);
    const [installmentMode, setInstallmentMode] = useState("ARREARS");

    const pendingInfo = location.state?.pendingInfo;
    const pendingAmount = pendingInfo?.pendingAmount;
    const pendingOccurrences = pendingInfo?.pendingOccurrences;
    const pendingDates = Array.isArray(pendingInfo?.pendingDates)
        ? pendingInfo.pendingDates.map((d) => new Date(d).toLocaleDateString("es-AR"))
        : null;
    const pendingOccurrencesLabel = Number(pendingOccurrences || 0) === 1 ? "cuota" : "cuotas";
    const totalInstallments = Number(credito?.totalInstallments || 0);
    const paidInstallments = Number(credito?.paidInstallments || 0);
    const installmentAmount = Number(credito?.installmentAmount || 0);
    const remainingInstallments = Math.max(0, totalInstallments - paidInstallments);
    const canSelectInstallments = totalInstallments > 0 && installmentAmount > 0;
    const maxInstallmentsToPay = canSelectInstallments ? Math.max(1, remainingInstallments) : 1;
    const suggestedAmount = canSelectInstallments ? installmentAmount * cuotasPagadasHoy : 0;

    useEffect(() => {
        if (creditoId) {
            dispatch(loadCredit(creditoId));
        }
    }, [creditoId, dispatch]);

    useEffect(() => {
        if (credito?.clientId && !credito?.client) {
            dispatch(loadClient(credito.clientId));
        }
    }, [credito?.clientId, credito?.client, dispatch]);

    useEffect(() => {
        if (!canSelectInstallments) return;

        const pendingCount = Number(pendingOccurrences || 0);
        const preferredCount = pendingCount > 0 ? pendingCount : 1;
        const normalizedCount = Math.min(maxInstallmentsToPay, Math.max(1, Math.floor(preferredCount)));
        setCuotasPagadasHoy(normalizedCount);

        setPagos((prev) => {
            if (prev.length !== 1) return prev;
            return [{ ...prev[0], monto: String(installmentAmount * normalizedCount) }];
        });
    }, [canSelectInstallments, installmentAmount, maxInstallmentsToPay, pendingOccurrences]);

    if (loadingCredit) {
        return (
            <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Cargando...</p>
            </div>
        );
    }

    if (!credito || !cliente) {
        return (
            <div className="p-6 text-center text-red-500">
                Crédito o cliente no encontrado.
            </div>
        );
    }

    const total = pagos.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

    function agregarPago() {
        setPagos((prev) => [...prev, { metodo: "efectivo", monto: "", id: Date.now() }]);
    }

    function eliminarPago(id) {
        setPagos((prev) => prev.filter((p) => p.id !== id));
    }

    function actualizarPago(id, campo, valor) {
        setPagos((prev) => prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)));
    }

    function actualizarCuotasPagadas(valor) {
        const numeric = Number(valor);
        const normalized = Number.isFinite(numeric)
            ? Math.min(maxInstallmentsToPay, Math.max(1, Math.floor(numeric)))
            : 1;
        setCuotasPagadasHoy(normalized);

        setPagos((prev) => {
            if (!canSelectInstallments || prev.length !== 1) return prev;
            return [{ ...prev[0], monto: String(installmentAmount * normalized) }];
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const pagosValidos = pagos
            .map((p) => ({ ...p, monto: Number(p.monto) }))
            .filter((p) => p.metodo && p.monto > 0);
        if (pagosValidos.length === 0) {
            toast.error("Debes ingresar al menos un pago valido");
            return;
        }
        if (canSelectInstallments && cuotasPagadasHoy < 1) {
            toast.error("Ingresa al menos 1 cuota");
            return;
        }

        try {
            const breakdown = pagosValidos.map((p) => ({
                method: p.metodo,
                amount: p.monto,
            }));

            const totalRegistrado = breakdown.reduce((sum, b) => sum + b.amount, 0);

            await dispatch(addPayment({
                creditId: creditoId,
                payments: breakdown,
                installmentCount: canSelectInstallments ? cuotasPagadasHoy : undefined,
                installmentMode,
                date: new Date().toISOString(),
                note: nota
            })).unwrap();

            toast.success(`Pago total registrado: $${totalRegistrado.toLocaleString("es-AR")}`, {
                icon: "💰",
                duration: 1800
            });

            setTimeout(() => navigate("/cobrador/pagos"), 1800);
        } catch (error) {
            console.error("Error al registrar pago:", error);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#08122f] via-[#0b1f55] to-[#112b6d] px-3 py-4 sm:px-4 sm:py-6">
            <div className="mx-auto max-w-2xl space-y-5">
                {/* Header */}
                <div className="flex flex-col gap-3 rounded-[28px] border border-slate-700/80 bg-slate-900/85 p-4 shadow-[0_22px_50px_-30px_rgba(15,23,42,0.95)] sm:flex-row sm:items-center sm:justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex min-h-11 items-center gap-2 self-start rounded-2xl border border-slate-700 bg-slate-950/30 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-100"
                    >
                        <HiArrowLeft className="h-5 w-5" /> Volver
                    </button>
                    <div className="sm:text-right">
                        <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Registrar pago</h1>
                        <p className="mt-1 text-sm text-slate-400">Carga optimizada para trabajo desde el celular.</p>
                    </div>
                </div>

                {/* Cliente */}
                <div className="rounded-[28px] border border-slate-700/80 bg-slate-900/80 p-4 shadow-sm">
                    <p className="text-lg font-semibold text-slate-100">
                        {cliente.name}
                    </p>
                    <p className="text-sm text-slate-400">{cliente.address}</p>
                    <p className="mt-2 text-sm text-slate-300">
                        Crédito activo:{" "}
                        <strong>{`$${credito.amount.toLocaleString("es-AR")}`}</strong> — Cuota:{" "}
                        <strong>{`$${credito.installmentAmount.toLocaleString("es-AR")}`}</strong>
                    </p>
                    {pendingInfo && (
                        <div className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-3 text-xs text-cyan-100">
                            <p>
                                Monto sugerido según adeudos:
                                <span className="font-semibold"> ${Number(pendingAmount || 0).toLocaleString("es-AR")}</span>
                                {pendingOccurrences > 0 && ` (${pendingOccurrences} ${pendingOccurrencesLabel})`}
                            </p>
                            {pendingDates && pendingDates.length > 0 && (
                                <p>Fechas pendientes: {pendingDates.join(" • ")}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Formulario */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 rounded-[28px] border border-slate-700/80 bg-slate-900/80 p-4 shadow-sm sm:p-5"
                >
                    <h2 className="text-sm font-semibold text-slate-200">
                        Detalle de pagos
                    </h2>

                    {canSelectInstallments && (
                        <div className="rounded-2xl border border-blue-400/25 bg-blue-500/10 p-3">
                            <label className="mb-1 block text-xs font-medium text-blue-100">
                                Aplicar cuotas como
                            </label>
                            <select
                                value={installmentMode}
                                onChange={(e) => setInstallmentMode(e.target.value)}
                                className="mb-3 min-h-12 w-full rounded-2xl border border-blue-400/30 bg-slate-950/30 px-3 py-2 text-sm text-slate-100 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300/20"
                            >
                                <option value="ARREARS">Cuotas pagadas (recomendado)</option>
                                <option value="ADVANCE">Cuotas de adelanto</option>
                            </select>

                            <label className="mb-1 block text-xs font-medium text-blue-100">
                                Cuotas pagadas en esta cobranza
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={maxInstallmentsToPay}
                                value={cuotasPagadasHoy}
                                onChange={(e) => actualizarCuotasPagadas(e.target.value)}
                                className="min-h-12 w-full rounded-2xl border border-blue-400/30 bg-slate-950/30 px-3 py-2 text-sm text-slate-100 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300/20"
                            />
                            <p className="mt-1 text-xs text-blue-100/90">
                                Restantes: {remainingInstallments} cuotas. Monto sugerido: ${suggestedAmount.toLocaleString("es-AR")}
                            </p>
                            <p className="mt-1 text-xs text-blue-100/90">
                                {installmentMode === "ARREARS"
                                    ? "La proxima visita se mantiene en el proximo ciclo normal."
                                    : "Se adelanta la agenda segun la cantidad de cuotas seleccionadas."}
                            </p>
                        </div>
                    )}

                    {pagos.map((p) => (
                        <div key={p.id} className="flex flex-col gap-3 border-b border-slate-700/70 pb-4 last:border-none sm:flex-row sm:items-end">
                            {/* Método */}
                            <div className="flex-1">
                                <label className="mb-1 block text-xs font-medium text-slate-300">
                                    Medio de pago
                                </label>
                                <select
                                    value={p.metodo}
                                    onChange={(e) => actualizarPago(p.id, "metodo", e.target.value)}
                                    className="min-h-12 w-full rounded-2xl border border-slate-700 bg-slate-950/30 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/20"
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="mercadopago">Mercado Pago</option>
                                    <option value="transferencia">Transferencia</option>
                                </select>
                            </div>

                            {/* Monto */}
                            <div className="flex-1">
                                <label className="mb-1 block text-xs font-medium text-slate-300">
                                    Monto abonado
                                </label>
                                <input
                                    type="number"
                                    value={p.monto}
                                    onChange={(e) => actualizarPago(p.id, "monto", e.target.value)}
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    className="min-h-12 w-full rounded-2xl border border-slate-700 bg-slate-950/30 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/20"
                                />
                            </div>

                            {/* Eliminar */}
                            {pagos.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => eliminarPago(p.id)}
                                    className="mt-1 flex min-h-11 items-center gap-1 self-start rounded-2xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 sm:mt-0"
                                >
                                    <HiTrash className="h-4 w-4" /> Quitar
                                </button>
                            )}
                        </div>
                    ))}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={agregarPago}
                            className="flex min-h-11 items-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/20"
                        >
                            <HiPlus className="h-4 w-4" /> Agregar otro medio de pago
                        </button>
                    </div>

                    <div className="border-t border-slate-700 pt-3 text-right text-sm font-medium text-slate-200">
                        Total a registrar:{" "}
                        <span className="text-lg font-bold text-cyan-300">
                            ${total.toLocaleString("es-AR")}
                        </span>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-300">
                            Nota (opcional)
                        </label>
                        <textarea
                            value={nota}
                            onChange={(e) => setNota(e.target.value)}
                            placeholder="Ej: parte en efectivo, parte por MP."
                            rows={3}
                            className="w-full rounded-2xl border border-slate-700 bg-slate-950/30 px-3 py-3 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/20"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={savingPayment}
                        className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-white font-semibold shadow-[0_18px_30px_-22px_rgba(59,130,246,0.95)] transition hover:from-blue-500 hover:to-cyan-400 focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {savingPayment ? "Registrando..." : "Registrar pago"}
                    </button>
                </form>
            </div>
        </div>
    );
}
