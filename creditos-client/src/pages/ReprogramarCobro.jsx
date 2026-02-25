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
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                >
                    <HiArrowLeft className="h-5 w-5" />
                    Volver
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Reprogramar cobro</h1>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Credito: {creditoId}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{clientName}</p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-4"
            >
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Motivo
                    </label>
                    <select
                        value={reasonCode}
                        onChange={(event) => setReasonCode(event.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                        {REASON_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Detalle (opcional)
                    </label>
                    <textarea
                        value={reasonDetail}
                        onChange={(event) => setReasonDetail(event.target.value)}
                        rows={3}
                        placeholder="Ej: se rompio el auto en camino al domicilio."
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Reprogramar para
                    </label>
                    <input
                        type="date"
                        value={promisedDate}
                        onChange={(event) => setPromisedDate(event.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-500 disabled:opacity-60"
                >
                    {saving ? "Guardando..." : "Guardar reprogramacion"}
                </button>
            </form>
        </div>
    );
}
