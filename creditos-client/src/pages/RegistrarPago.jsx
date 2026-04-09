import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
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

    const initialSetDone = useRef(false);

    useEffect(() => {
        initialSetDone.current = false;
    }, [creditoId]);

    useEffect(() => {
        if (!canSelectInstallments || initialSetDone.current) return;
        if (!credito || loadingCredit) return;
        
        // Safety check: ensure the credit loaded matches the one in the URL
        if (String(credito.id) !== String(creditoId)) return;

        const pendingCount = Number(pendingOccurrences || 0);
        const preferredCount = pendingCount > 0 ? pendingCount : 1;
        const normalizedCount = Math.min(maxInstallmentsToPay, Math.max(1, Math.floor(preferredCount)));
        
        setCuotasPagadasHoy(normalizedCount);
        setPagos([{ metodo: "efectivo", monto: String(installmentAmount * normalizedCount), id: Date.now() }]);
        
        initialSetDone.current = true;
    }, [canSelectInstallments, installmentAmount, maxInstallmentsToPay, pendingOccurrences, credito, loadingCredit, creditoId]);

    const handleModeChange = (newMode) => {
        setInstallmentMode(newMode);
        if (newMode === "ADVANCE") {
            actualizarCuotasPagadas(1);
        } else {
            const pendingCount = Number(pendingOccurrences || 0);
            actualizarCuotasPagadas(pendingCount > 0 ? pendingCount : 1);
        }
    };

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
        if (valor === "") {
            setCuotasPagadasHoy("");
            return;
        }

        const numeric = Number(valor);
        const normalized = Number.isFinite(numeric)
            ? Math.min(maxInstallmentsToPay, Math.floor(numeric))
            : 1;

        setCuotasPagadasHoy(normalized);

        // Actualizamos el monto solo si el valor es válido y mayor a 0
        if (normalized > 0) {
            setPagos((prev) => {
                if (!canSelectInstallments || prev.length !== 1) return prev;
                return [{ ...prev[0], monto: String(installmentAmount * normalized) }];
            });
        }
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

            toast.success("Pago confirmado", {
                icon: "💰",
                duration: 1800
            });

            setTimeout(() => navigate("/cobrador/pagos"), 1800);
        } catch (error) {
            console.error("Error al registrar pago:", error);
            toast.error("No se pudo registrar el pago. Intenta de nuevo.");
        }
    }    return (
        <div className="min-h-screen bg-[#060b1d] text-white" 
             style={{ backgroundImage: "radial-gradient(circle at 50% -20%, #1a2b5a 0%, #060b1d 80%)", backgroundAttachment: "fixed" }}>
            
            <div className="mx-auto max-w-2xl px-4 py-8 pb-32 animate-fade-in space-y-6">
                
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white backdrop-blur-xl active:scale-90 transition-all"
                    >
                        <HiArrowLeft className="h-6 w-6" />
                    </button>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Carga de Cobro</p>
                        <h1 className="text-2xl font-black tracking-tight text-white">Nuevo Registro</h1>
                    </div>
                </div>

                {/* ── Cliente Card ── */}
                <div className="rounded-[32px] bg-white/5 border border-white/10 p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16" />
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-white tracking-tighter mb-2">{cliente.name}</h2>
                        <div className="space-y-1 text-sm text-slate-400 font-medium">
                            <p>{cliente.address}</p>
                            <div className="flex items-center gap-3 pt-3 border-t border-white/5 mt-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Crédito</p>
                                    <p className="text-md font-bold text-white">${credito.amount.toLocaleString("es-AR")}</p>
                                </div>
                                <div className="h-8 w-px bg-white/10" />
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cuota</p>
                                    <p className="text-md font-bold text-emerald-400">${credito.installmentAmount.toLocaleString("es-AR")}</p>
                                </div>
                            </div>
                        </div>

                        {pendingInfo && (
                            <div className="mt-6 rounded-2xl bg-emerald-500 text-white p-4 shadow-xl shadow-emerald-500/20">
                                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Sugerencia de cobro</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-xl font-black">${Number(pendingAmount || 0).toLocaleString("es-AR")}</p>
                                    <p className="text-xs font-bold uppercase">{pendingOccurrences} {pendingOccurrencesLabel}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Formulario ── */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-[32px] bg-white/5 border border-white/10 p-8 backdrop-blur-2xl shadow-xl space-y-8">
                        
                        {canSelectInstallments && (
                            <div className="space-y-6 p-6 rounded-3xl bg-white/5 border border-white/5">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Modo de Aplicación</label>
                                    <select
                                        value={installmentMode}
                                        onChange={(e) => handleModeChange(e.target.value)}
                                        className="h-14 w-full rounded-2xl bg-white/5 border border-white/10 px-5 text-sm text-white focus:border-emerald-500/50 appearance-none font-bold"
                                    >
                                        <option value="ARREARS" className="bg-slate-900">Cuotas pagadas (Normal)</option>
                                        <option value="ADVANCE" className="bg-slate-900">Cuotas de adelanto</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Cant. de Cuotas</label>
                                        <span className="text-[10px] font-bold text-slate-400 italic">De {remainingInstallments} restantes</span>
                                    </div>
                                    <input
                                        type="number"
                                        min={1}
                                        max={maxInstallmentsToPay}
                                        value={cuotasPagadasHoy}
                                        onChange={(e) => actualizarCuotasPagadas(e.target.value)}
                                        className="h-14 w-full rounded-2xl bg-white/5 border border-white/10 px-5 text-xl font-black text-white focus:border-emerald-500/50"
                                    />
                                    <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-tight">
                                        Monto sugerido: ${suggestedAmount.toLocaleString("es-AR")}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Pagos Dinámicos */}
                        <div className="space-y-6">
                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Detalle de Medios</h3>
                            {pagos.map((p) => (
                                <div key={p.id} className="relative group space-y-4 p-6 rounded-3xl bg-white/5 border border-white/5 animate-slide-up">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-1">Método</label>
                                            <select
                                                value={p.metodo}
                                                onChange={(e) => actualizarPago(p.id, "metodo", e.target.value)}
                                                className="h-14 w-full rounded-2xl bg-white/5 border border-white/10 px-5 text-sm text-white font-bold appearance-none"
                                            >
                                                <option value="efectivo" className="bg-slate-900">Efectivo</option>
                                                <option value="mercadopago" className="bg-slate-900">Mercado Pago</option>
                                                <option value="transferencia" className="bg-slate-900">Transferencia</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-1">Monto ($)</label>
                                            <input
                                                type="number"
                                                value={p.monto}
                                                onChange={(e) => actualizarPago(p.id, "monto", e.target.value)}
                                                placeholder="0.00"
                                                className="h-14 w-full rounded-2xl bg-white/5 border border-white/10 px-5 text-lg font-black text-white"
                                            />
                                        </div>
                                    </div>
                                    
                                    {pagos.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => eliminarPago(p.id)}
                                            className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-rose-500 text-white shadow-lg flex items-center justify-center active:scale-90 transition-all"
                                        >
                                            <HiTrash className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={agregarPago}
                                className="w-full h-12 rounded-2xl bg-white/5 border border-dashed border-white/20 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                <HiPlus className="h-4 w-4" /> Agregar otro medio
                            </button>
                        </div>

                        {/* Nota */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Nota Opcional</label>
                            <textarea
                                value={nota}
                                onChange={(e) => setNota(e.target.value)}
                                placeholder="Escribe un comentario..."
                                rows={3}
                                className="w-full rounded-3xl bg-white/5 border border-white/10 p-5 text-sm text-white font-medium focus:border-white/20 outline-none"
                            />
                        </div>

                        {/* Total Final */}
                        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                            <p className="text-sm font-black text-slate-500 uppercase tracking-widest font-black">Total a Registrar</p>
                            <p className="text-3xl font-black text-white tabular-nums">${total.toLocaleString("es-AR")}</p>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={savingPayment}
                            className="h-20 w-full rounded-[32px] bg-gradient-to-r from-emerald-400 to-emerald-600 text-[#060b1d] font-black text-xl tracking-tighter shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:grayscale"
                        >
                            {savingPayment ? (
                                <div className="h-6 w-6 border-4 border-[#060b1d]/30 border-t-[#060b1d] rounded-full animate-spin" />
                            ) : (
                                "CONFIRMAR PAGO"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
