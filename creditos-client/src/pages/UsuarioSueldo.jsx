import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import toast from "react-hot-toast";
import { fetchUser } from "../services/usersService";
import { fetchWeeklyPayrollHistory, fetchWeeklyPayrollPreview, recordWeeklyPayrollPayment } from "../services/reportsService";

export default function UsuarioSueldo() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState(null);
    const [payrollPreview, setPayrollPreview] = useState(null);
    const [payrollHistory, setPayrollHistory] = useState([]);
    const [selectedPayrollWeekStart, setSelectedPayrollWeekStart] = useState("");
    const [payrollForm, setPayrollForm] = useState(() => buildPayrollFormState(null));
    const [loading, setLoading] = useState(true);
    const [savingPayroll, setSavingPayroll] = useState(false);

    useEffect(() => {
        if (!id) return;

        const loadUser = async () => {
            setLoading(true);
            try {
                const response = await fetchUser(id);
                const data = response?.data ?? null;
                setUsuario(data);
            } catch (error) {
                console.error("Error al cargar cobrador", error);
                setUsuario(null);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [id]);

    useEffect(() => {
        const role = (usuario?.role || "").toUpperCase();
        const isCollector = role === "COBRADOR" || role === "EMPLOYEE";

        if (!id || !isCollector) {
            setPayrollPreview(null);
            setPayrollHistory([]);
            setSelectedPayrollWeekStart("");
            setPayrollForm(buildPayrollFormState(null));
            return;
        }

        const loadPayroll = async () => {
            setLoading(true);
            try {
                const [previewRes, historyRes] = await Promise.all([
                    fetchWeeklyPayrollPreview({
                        userId: id,
                        ...(selectedPayrollWeekStart ? { weekStart: selectedPayrollWeekStart } : {})
                    }),
                    fetchWeeklyPayrollHistory({ userId: id, weeks: 10 })
                ]);
                const nextPreview = previewRes?.data ?? null;
                const nextHistory = Array.isArray(historyRes?.data?.data) ? historyRes.data.data : [];
                setPayrollPreview(nextPreview);
                setPayrollHistory(nextHistory);
                setPayrollForm(buildPayrollFormState(nextPreview));
                if (!selectedPayrollWeekStart && nextPreview?.weekStart) {
                    setSelectedPayrollWeekStart(nextPreview.weekStart);
                }
            } catch (error) {
                console.error("Error al cargar sueldo del cobrador", error);
                setPayrollPreview(null);
                setPayrollHistory([]);
                setPayrollForm(buildPayrollFormState(null));
            } finally {
                setLoading(false);
            }
        };

        loadPayroll();
    }, [id, usuario?.role, selectedPayrollWeekStart]);

    const payrollWeekOptions = useMemo(() => {
        const seen = new Set();
        const options = [];

        const appendOption = (item) => {
            if (!item?.weekStart || seen.has(item.weekStart)) return;
            seen.add(item.weekStart);
            options.push({
                value: item.weekStart,
                label: `${formatDate(item.weekStart)} al ${formatDate(item.weekEnd)}`
            });
        };

        appendOption(payrollPreview);
        payrollHistory.forEach(appendOption);
        return options;
    }, [payrollPreview, payrollHistory]);

    const payrollSuggestedTotal = Number(payrollPreview?.weeklySalary || 0) + Number(payrollPreview?.totalCommission || 0);
    const payrollRecordedTotal = Number(payrollForm.paidSalaryAmount || 0) + (payrollForm.commissionPaid ? Number(payrollForm.paidCommissionAmount || 0) : 0);

    const handleBack = () => {
        navigate(`/usuarios/${id}`);
    };

    const handlePayrollFieldChange = (field, value) => {
        setPayrollForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleCommissionToggle = () => {
        setPayrollForm((prev) => {
            const nextCommissionPaid = !prev.commissionPaid;
            return {
                ...prev,
                commissionPaid: nextCommissionPaid,
                paidCommissionAmount: nextCommissionPaid && !prev.paidCommissionAmount
                    ? String(Number(payrollPreview?.totalCommission || 0))
                    : prev.paidCommissionAmount
            };
        });
    };

    const handleSavePayroll = async () => {
        if (!payrollPreview) return;

        const paidSalaryAmount = Number(payrollForm.paidSalaryAmount);
        const paidCommissionAmount = payrollForm.commissionPaid ? Number(payrollForm.paidCommissionAmount) : 0;

        if (!Number.isFinite(paidSalaryAmount) || paidSalaryAmount < 0) {
            toast.error("Indica un sueldo pagado válido.");
            return;
        }

        if (payrollForm.commissionPaid && (!Number.isFinite(paidCommissionAmount) || paidCommissionAmount <= 0)) {
            toast.error("Indica cuánto se pagó de comisión.");
            return;
        }

        setSavingPayroll(true);
        try {
            await recordWeeklyPayrollPayment({
                userId: id,
                weekStart: selectedPayrollWeekStart || payrollPreview.weekStart,
                paidSalaryAmount,
                commissionPaid: payrollForm.commissionPaid,
                paidCommissionAmount,
                notes: payrollForm.notes?.trim() || undefined
            });

            const [previewRes, historyRes] = await Promise.all([
                fetchWeeklyPayrollPreview({
                    userId: id,
                    ...(selectedPayrollWeekStart || payrollPreview.weekStart ? { weekStart: selectedPayrollWeekStart || payrollPreview.weekStart } : {})
                }),
                fetchWeeklyPayrollHistory({ userId: id, weeks: 10 })
            ]);
            const nextPreview = previewRes?.data ?? null;
            setPayrollPreview(nextPreview);
            setPayrollHistory(Array.isArray(historyRes?.data?.data) ? historyRes.data.data : []);
            setPayrollForm(buildPayrollFormState(nextPreview));
            toast.success("Pago registrado correctamente.");
        } catch (error) {
            console.error("Error al registrar pago", error);
            toast.error(error?.response?.data?.error || "No se pudo registrar el pago.");
        } finally {
            setSavingPayroll(false);
        }
    };

    if (loading && !usuario) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-6">
                <p className="text-center text-gray-500 dark:text-gray-400">Cargando sueldo del cobrador...</p>
            </div>
        );
    }

    if (!usuario) {
        return (
            <div className="text-center text-red-400 mt-10">
                Usuario no encontrado.
            </div>
        );
    }

    const role = (usuario.role || "").toUpperCase();
    const isCollector = role === "COBRADOR" || role === "EMPLOYEE";

    if (!isCollector) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-10">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Sueldo del usuario</h1>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                        Esta pantalla solo aplica para usuarios cobradores.
                    </p>
                    <button
                        type="button"
                        onClick={handleBack}
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                        <HiOutlineArrowLeft className="h-4 w-4" />
                        Volver al usuario
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 space-y-8 sm:px-6 xl:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                        Usuarios
                    </p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        Sueldo y comision del cobrador
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                        Registra cuánto se pagó en la semana, si hubo comisión y revisa el historial de liquidaciones de {usuario.name}.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white"
                >
                    <HiOutlineArrowLeft className="h-4 w-4" />
                    Volver al usuario
                </button>
            </div>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950">
                <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_42%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(30,41,59,0.96))] px-6 py-7 text-white sm:px-8 lg:px-10">
                    <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 space-y-4 xl:max-w-xl">
                            <div>
                                <h2 className="max-w-full break-words text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-[2.1rem]">
                                    {usuario.name}
                                </h2>
                                <p className="mt-1 text-sm text-slate-300">{usuario.email}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <HeaderPill label={`ID ${usuario.id?.slice?.(0, 8) || usuario.id}`} tone="slate" />
                                <HeaderPill label={role === "EMPLOYEE" ? "COBRADOR" : role} tone="amber" />
                                <HeaderPill label={usuario.salaryType || "N_A"} tone="blue" />
                            </div>
                        </div>

                        <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[34rem]">
                            <InfoStatCard label="Sueldo sugerido" value={formatCurrency(payrollPreview?.weeklySalary || 0)} tone="blue" />
                            <InfoStatCard label="Comision sugerida" value={formatCurrency(payrollPreview?.totalCommission || 0)} tone="emerald" />
                            <InfoStatCard label="Total sugerido" value={formatCurrency(payrollSuggestedTotal)} tone="amber" />
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 px-6 py-6 sm:px-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.9fr)] lg:px-10 lg:py-8">
                    <div className="space-y-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                Liquidacion
                            </p>
                            <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                Registrar pago semanal
                            </h3>
                        </div>

                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                        Semana a liquidar
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {formatDate(payrollPreview?.weekStart)} al {formatDate(payrollPreview?.weekEnd)}
                                    </p>
                                </div>
                                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${payrollPreview?.payment
                                    ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                                    : "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-200"
                                    }`}>
                                    {payrollPreview?.payment ? "Pago registrado" : "Pendiente de registrar"}
                                </span>
                            </div>

                            <div className="mt-4">
                                <SelectField
                                    label="Semana"
                                    value={selectedPayrollWeekStart || payrollPreview?.weekStart || ""}
                                    onChange={setSelectedPayrollWeekStart}
                                    options={payrollWeekOptions}
                                />
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <FormField
                                    label="Sueldo pagado"
                                    type="number"
                                    value={payrollForm.paidSalaryAmount}
                                    onChange={(value) => handlePayrollFieldChange("paidSalaryAmount", value)}
                                />
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                        Comision pagada
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleCommissionToggle}
                                        className={`inline-flex h-12 items-center justify-between rounded-2xl border px-4 text-sm font-semibold transition ${payrollForm.commissionPaid
                                            ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                                            : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                            }`}
                                    >
                                        <span>{payrollForm.commissionPaid ? "Si, se pago comision" : "No, no se pago comision"}</span>
                                        <span>{payrollForm.commissionPaid ? "Si" : "No"}</span>
                                    </button>
                                </div>
                                <FormField
                                    label="Monto de comision pagada"
                                    type="number"
                                    value={payrollForm.paidCommissionAmount}
                                    onChange={(value) => handlePayrollFieldChange("paidCommissionAmount", value)}
                                    disabled={!payrollForm.commissionPaid}
                                />
                                <StaticField label="Total registrado" value={formatCurrency(payrollRecordedTotal)} />
                            </div>

                            <div className="mt-4 grid gap-4">
                                <TextAreaField
                                    label="Notas del pago"
                                    value={payrollForm.notes}
                                    onChange={(value) => handlePayrollFieldChange("notes", value)}
                                    placeholder="Ej: se liquido sueldo completo y comision por nuevos creditos"
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSavePayroll}
                                        disabled={savingPayroll}
                                        className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-blue-500 bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {savingPayroll ? "Guardando..." : "Registrar pago"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            Historial reciente
                        </p>
                        <div className="mt-4 space-y-3">
                            {payrollHistory.length ? payrollHistory.map((item) => (
                                <article key={item.payrollKey} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            Semana {formatDate(item.weekStart)}
                                        </p>
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${item.payment
                                            ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                                            : "border-slate-300/30 bg-slate-500/10 text-slate-600 dark:text-slate-300"
                                            }`}>
                                            {item.payment ? "Pagado" : "Sin registrar"}
                                        </span>
                                    </div>
                                    <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Sueldo</span>
                                            <strong className="text-slate-900 dark:text-slate-100">{item.payment ? formatCurrency(item.payment.paidSalaryAmount) : "—"}</strong>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Comision</span>
                                            <strong className="text-slate-900 dark:text-slate-100">{item.payment?.commissionPaid ? formatCurrency(item.payment.paidCommissionAmount) : "No pagada"}</strong>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Total</span>
                                            <strong className="text-slate-900 dark:text-slate-100">{item.payment ? formatCurrency(item.payment.totalPaid) : "—"}</strong>
                                        </div>
                                    </div>
                                    {item.payment?.notes ? (
                                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{item.payment.notes}</p>
                                    ) : null}
                                </article>
                            )) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                                    No hay pagos semanales registrados para este cobrador.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function buildPayrollFormState(summary) {
    const payment = summary?.payment;
    return {
        paidSalaryAmount: payment?.paidSalaryAmount != null ? String(payment.paidSalaryAmount) : String(Number(summary?.weeklySalary || 0)),
        commissionPaid: Boolean(payment?.commissionPaid),
        paidCommissionAmount: payment?.paidCommissionAmount != null ? String(payment.paidCommissionAmount) : String(Number(summary?.totalCommission || 0)),
        notes: payment?.notes || ""
    };
}

function formatCurrency(value) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleDateString("es-AR");
}

function HeaderPill({ label, tone = "slate" }) {
    const toneClasses = {
        slate: "border-white/15 bg-white/10 text-slate-100",
        amber: "border-amber-300/25 bg-amber-400/15 text-amber-100",
        blue: "border-blue-300/25 bg-blue-400/15 text-blue-100",
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${toneClasses[tone] || toneClasses.slate}`}>
            {label}
        </span>
    );
}

function InfoStatCard({ label, value, tone = "blue" }) {
    const toneClasses = {
        blue: "border-blue-400/30 bg-blue-500/10",
        emerald: "border-emerald-400/30 bg-emerald-500/10",
        amber: "border-amber-400/30 bg-amber-500/10",
    };

    return (
        <div className={`rounded-[22px] border p-4 text-left shadow-[0_16px_35px_-32px_rgba(15,23,42,0.75)] ${toneClasses[tone] || toneClasses.blue}`}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">{label}</div>
            <div className="mt-3 text-xl font-black tracking-tight text-white sm:text-[1.9rem]">{value}</div>
        </div>
    );
}

function FormField({ label, value, onChange, type = "text", disabled = false }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</label>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

function TextAreaField({ label, value, onChange, placeholder }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</label>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                rows={3}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
        </div>
    );
}

function StaticField({ label, value }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</label>
            <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                {value}
            </div>
        </div>
    );
}