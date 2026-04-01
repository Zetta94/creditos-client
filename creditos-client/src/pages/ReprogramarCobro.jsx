import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { HiArrowLeft } from "react-icons/hi";
import { rescheduleAssignment } from "../services/assignmentsService";

const REASON_OPTIONS = [
    { value: "NO_ENCONTRADO", label: "No encontre al cliente" },
    { value: "PROBLEMA_MOVILIDAD", label: "Problema de movilidad/vehiculo" },
    { value: "SIN_DINERO", label: "Cliente sin dinero disponible" },
    { value: "OTRO", label: "Otro motivo" }
];

const toDateInput = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

export default function ReprogramarCobro() {
    const navigate = useNavigate();
    const { creditoId } = useParams();
    const location = useLocation();
    const state = location.state || {};

    const assignmentId = state.assignmentId;
    const clientName = state.clientName || "Cliente";
    const [saving, setSaving] = useState(false);
    const [reasonCode, setReasonCode] = useState(REASON_OPTIONS[0].value);
    const [reasonDetail, setReasonDetail] = useState("");
    const [promisedDate, setPromisedDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return toDateInput(date);
    });

    const reasonLabel = useMemo(
        () => REASON_OPTIONS.find((option) => option.value === reasonCode)?.label || "Motivo no informado",
        [reasonCode]
    );

    const buildReason = () => {
        const detail = reasonDetail.trim();
        if (!detail) return reasonLabel;
        return `${reasonLabel}. ${detail}`;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!assignmentId) {
            toast.error("No se encontro la asignacion para reprogramar.");
            return;
        }
        if (!promisedDate) {
            toast.error("Selecciona una fecha de reprogramacion.");
            return;
        }

        const promised = new Date(`${promisedDate}T00:00:00`);
        if (Number.isNaN(promised.getTime())) {
            toast.error("Fecha invalida.");
            return;
        }

        try {
            setSaving(true);
            await rescheduleAssignment(assignmentId, {
                promisedDate: promised.toISOString(),
                reason: buildReason()
            });
            toast.success("Cobro reprogramado con exito.");
            navigate("/cobrador/pagos");
        } catch (error) {
            const message = error?.response?.data?.error || "No se pudo reprogramar el cobro.";
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
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
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80 mb-1">Incidencia</p>
                        <h1 className="text-2xl font-black tracking-tight text-white">Reprogramar</h1>
                    </div>
                </div>

                {/* ── Info Card ── */}
                <div className="rounded-[32px] bg-white/5 border border-white/10 p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cliente</p>
                        <h2 className="text-2xl font-black text-white tracking-tighter">{clientName}</h2>
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Crédito ID: {creditoId?.slice(-8)}</p>
                        </div>
                    </div>
                </div>

                {/* ── Formulario ── */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-[32px] bg-white/5 border border-white/10 p-8 backdrop-blur-2xl shadow-xl space-y-8">
                        
                        <div className="space-y-6">
                            {/* Motivo */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Motivo del Incumplimiento</label>
                                <div className="relative">
                                    <select
                                        value={reasonCode}
                                        onChange={(e) => setReasonCode(e.target.value)}
                                        className="h-14 w-full rounded-2xl bg-white/5 border border-white/10 px-5 text-sm text-white font-bold appearance-none focus:border-amber-500/50 outline-none transition-all"
                                    >
                                        {REASON_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value} className="bg-slate-900 font-bold">
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                        ▼
                                    </div>
                                </div>
                            </div>

                            {/* Detalle */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Detalle Adicional</label>
                                <textarea
                                    value={reasonDetail}
                                    onChange={(e) => setReasonDetail(e.target.value)}
                                    rows={3}
                                    placeholder="Escribe más detalles aquí..."
                                    className="w-full rounded-3xl bg-white/5 border border-white/10 p-5 text-sm text-white font-medium focus:border-amber-500/30 outline-none transition-all placeholder:text-slate-600"
                                />
                            </div>

                            {/* Fecha */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Nueva Fecha Prometida</label>
                                <input
                                    type="date"
                                    value={promisedDate}
                                    onChange={(e) => setPromisedDate(e.target.value)}
                                    className="h-14 w-full rounded-2xl bg-white/5 border border-white/10 px-5 text-lg font-black text-white focus:border-amber-500/50 outline-none transition-all color-scheme-dark"
                                    style={{ colorScheme: 'dark' }}
                                />
                                <p className="text-[10px] text-slate-500 font-bold italic px-1">
                                    * Esta fecha moverá el registro a la agenda del día seleccionado.
                                </p>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-20 w-full rounded-[32px] bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xl tracking-tighter shadow-2xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:grayscale"
                        >
                            {saving ? (
                                <div className="h-6 w-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "REPROGRAMAR COBRO"
                            )}
                        </button>
                        
                        <p className="text-center text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            Esta acción quedará registrada en el historial.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
