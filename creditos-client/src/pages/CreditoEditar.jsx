import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchCredit, updateCredit } from "../services/creditsService";
import { loadUsers } from "../store/employeeSlice";

const CREDIT_TYPES = [
    { value: "DAILY", label: "Diario" },
    { value: "WEEKLY", label: "Semanal" },
    { value: "QUINCENAL", label: "Quincenal" },
    { value: "MONTHLY", label: "Mensual" },
    { value: "ONE_TIME", label: "Pago unico" }
];

const CREDIT_STATUS = [
    { value: "PENDING", label: "Pendiente" },
    { value: "OVERDUE", label: "Vencido" },
    { value: "PAID", label: "Pagado" }
];

const toDateInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const computeDueDate = (startDate, totalInstallments, type) => {
    if (!startDate || !totalInstallments || Number(totalInstallments) <= 0) return "";

    const due = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(due.getTime())) return "";
    const periods = Math.max(1, Number(totalInstallments) || 0);

    switch (type) {
        case "ONE_TIME":
            break;
        case "DAILY":
            due.setDate(due.getDate() + periods);
            break;
        case "WEEKLY":
            due.setDate(due.getDate() + periods * 7);
            break;
        case "QUINCENAL":
            due.setDate(due.getDate() + periods * 15);
            break;
        case "MONTHLY":
        default:
            due.setMonth(due.getMonth() + periods);
            break;
    }

    return toDateInput(due);
};

export default function CreditoEditar() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { list: users = [] } = useSelector((state) => state.employees ?? { list: [] });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [credito, setCredito] = useState(null);
    const [form, setForm] = useState({
        userId: "",
        type: "MONTHLY",
        amount: "",
        installmentAmount: "",
        totalInstallments: "",
        paidInstallments: "",
        receivedAmount: "",
        nextInstallmentToCharge: "",
        startDate: "",
        dueDate: "",
        status: "PENDING"
    });

    const cobradores = useMemo(
        () => users.filter((user) => user.role === "COBRADOR" || user.role === "EMPLOYEE"),
        [users]
    );

    useEffect(() => {
        if (!users.length) dispatch(loadUsers());
    }, [users.length, dispatch]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetchCredit(id)
            .then((res) => {
                const data = res.data;
                setCredito(data);
                setForm({
                    userId: data.userId || "",
                    type: data.type || "MONTHLY",
                    amount: data.amount ?? "",
                    installmentAmount: data.installmentAmount ?? "",
                    totalInstallments: data.totalInstallments ?? "",
                    paidInstallments: data.paidInstallments ?? "",
                    receivedAmount: data.receivedAmount ?? "",
                    nextInstallmentToCharge: data.nextInstallmentToCharge ?? "",
                    startDate: toDateInput(data.startDate),
                    dueDate: toDateInput(data.dueDate),
                    status: data.status || "PENDING"
                });
            })
            .catch(() => {
                toast.error("No se pudo cargar el credito");
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        setForm((prev) => {
            const installmentAmount = Number(prev.installmentAmount || 0);
            const totalInstallments = Number(prev.totalInstallments || 0);
            const paidInstallmentsRaw = Number(prev.paidInstallments || 0);
            const normalizedPaidInstallments = totalInstallments > 0
                ? Math.min(Math.max(0, paidInstallmentsRaw), totalInstallments)
                : Math.max(0, paidInstallmentsRaw);

            const receivedAmount = installmentAmount > 0
                ? installmentAmount * normalizedPaidInstallments
                : 0;
            const nextInstallment = totalInstallments > 0
                ? (normalizedPaidInstallments >= totalInstallments ? "" : String(normalizedPaidInstallments + 1))
                : "";
            const dueDate = computeDueDate(prev.startDate, totalInstallments, prev.type);
            const status = totalInstallments > 0 && normalizedPaidInstallments >= totalInstallments
                ? "PAID"
                : prev.status === "PAID"
                    ? "PENDING"
                    : prev.status;

            if (
                String(prev.paidInstallments ?? "") === String(normalizedPaidInstallments) &&
                String(prev.receivedAmount ?? "") === String(receivedAmount) &&
                String(prev.nextInstallmentToCharge ?? "") === String(nextInstallment) &&
                String(prev.dueDate ?? "") === String(dueDate) &&
                String(prev.status ?? "") === String(status)
            ) {
                return prev;
            }

            return {
                ...prev,
                paidInstallments: String(normalizedPaidInstallments),
                receivedAmount: String(receivedAmount),
                nextInstallmentToCharge: nextInstallment,
                dueDate,
                status
            };
        });
    }, [form.installmentAmount, form.totalInstallments, form.paidInstallments, form.startDate, form.type]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!form.amount || Number(form.amount) <= 0) {
            toast.error("Ingresa un monto valido");
            return;
        }
        if (!form.startDate) {
            toast.error("La fecha de inicio es obligatoria");
            return;
        }

        const payload = {
            userId: form.userId || null,
            type: form.type,
            amount: Number(form.amount),
            installmentAmount: form.installmentAmount === "" ? null : Number(form.installmentAmount),
            totalInstallments: form.totalInstallments === "" ? null : Number(form.totalInstallments),
            paidInstallments: form.paidInstallments === "" ? 0 : Number(form.paidInstallments),
            receivedAmount: form.receivedAmount === "" ? 0 : Number(form.receivedAmount),
            nextInstallmentToCharge: form.nextInstallmentToCharge === "" ? null : Number(form.nextInstallmentToCharge),
            startDate: new Date(`${form.startDate}T00:00:00`).toISOString(),
            dueDate: form.dueDate ? new Date(`${form.dueDate}T00:00:00`).toISOString() : null,
            status: form.status
        };

        try {
            setSaving(true);
            await updateCredit(id, payload);
            toast.success("Credito actualizado con exito");
            navigate(`/creditos/${id}`);
        } catch (error) {
            const msg = error?.response?.data?.message || "No se pudo actualizar el credito";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="mx-auto max-w-5xl px-4 py-6 text-gray-500">Cargando credito...</div>;
    }

    if (!credito) {
        return <div className="mx-auto max-w-5xl px-4 py-6 text-red-400">Credito no encontrado.</div>;
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-6">
            <div className="mb-5 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Editar credito</h1>
                <button
                    type="button"
                    onClick={() => navigate(`/creditos/${id}`)}
                    className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                    Volver
                </button>
            </div>

            <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Cliente" value={credito.client?.name || "Sin cliente"} readOnly />

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cobrador</label>
                        <select
                            name="userId"
                            value={form.userId}
                            onChange={handleChange}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        >
                            <option value="">Sin asignar</option>
                            {cobradores.map((collector) => (
                                <option key={collector.id} value={collector.id}>
                                    {collector.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                        <select
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        >
                            {CREDIT_TYPES.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                        <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        >
                            {CREDIT_STATUS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Field label="Monto" name="amount" type="number" value={form.amount} onChange={handleChange} required />
                    <Field label="Monto de cuota" name="installmentAmount" type="number" value={form.installmentAmount} onChange={handleChange} />
                    <Field label="Cuotas totales" name="totalInstallments" type="number" value={form.totalInstallments} onChange={handleChange} />
                    <Field label="Cuotas pagadas" name="paidInstallments" type="number" value={form.paidInstallments} onChange={handleChange} />
                    <Field label="Monto recibido" name="receivedAmount" type="number" value={form.receivedAmount} readOnly />
                    <Field label="Proxima cuota a cobrar" name="nextInstallmentToCharge" type="number" value={form.nextInstallmentToCharge} readOnly />
                    <Field label="Fecha inicio" name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
                    <Field label="Fecha vencimiento" name="dueDate" type="date" value={form.dueDate} readOnly />
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => navigate(`/creditos/${id}`)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 sm:w-auto"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60 sm:w-auto"
                    >
                        {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({ label, readOnly = false, ...props }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <input
                {...props}
                readOnly={readOnly}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
        </div>
    );
}
