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
        <div className="min-h-screen bg-gradient-to-b from-[#08122f] via-[#0b1f55] to-[#112b6d] px-3 py-4 sm:px-4 sm:py-6">
            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex flex-col gap-3 rounded-[28px] border border-slate-700/80 bg-slate-900/85 p-4 shadow-[0_22px_50px_-30px_rgba(15,23,42,0.95)] sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex min-h-11 items-center gap-2 self-start rounded-2xl border border-slate-700 bg-slate-950/30 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-100"
                    >
                        <HiArrowLeft className="h-5 w-5" />
                        Volver
                    </button>
                    <div className="sm:text-right">
                        <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Reprogramar cobro</h1>
                        <p className="mt-1 text-sm text-slate-400">Formulario simple y táctil para usar desde iPhone.</p>
                    </div>
                </div>

                <div className="rounded-[28px] border border-slate-700/80 bg-slate-900/80 p-4 shadow-sm">
                    <p className="text-sm text-slate-400">Credito: {creditoId}</p>
                    <p className="text-lg font-semibold text-slate-100">{clientName}</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4 rounded-[28px] border border-slate-700/80 bg-slate-900/80 p-4 shadow-sm sm:p-5"
                >
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-300">
                            Motivo
                        </label>
                        <select
                            value={reasonCode}
                            onChange={(event) => setReasonCode(event.target.value)}
                            className="min-h-12 w-full rounded-2xl border border-slate-700 bg-slate-950/30 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/20"
                        >
                            {REASON_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-300">
                            Detalle (opcional)
                        </label>
                        <textarea
                            value={reasonDetail}
                            onChange={(event) => setReasonDetail(event.target.value)}
                            rows={3}
                            placeholder="Ej: se rompio el auto en camino al domicilio."
                            className="w-full rounded-2xl border border-slate-700 bg-slate-950/30 px-3 py-3 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/20"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-300">
                            Reprogramar para
                        </label>
                        <input
                            type="date"
                            value={promisedDate}
                            onChange={(event) => setPromisedDate(event.target.value)}
                            className="min-h-12 w-full rounded-2xl border border-slate-700 bg-slate-950/30 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/20"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-white font-semibold shadow-[0_18px_30px_-22px_rgba(59,130,246,0.95)] transition hover:from-blue-500 hover:to-cyan-400 disabled:opacity-60"
                    >
                        {saving ? "Guardando..." : "Guardar reprogramacion"}
                    </button>
                </form>
            </div>
        </div>
    );
}
