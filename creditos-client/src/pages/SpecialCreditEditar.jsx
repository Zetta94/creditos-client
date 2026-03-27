import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchSpecialCredit, updateSpecialCredit } from "../services/specialCreditsService";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0
});

export default function SpecialCreditEditar() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [specialCredit, setSpecialCredit] = useState(null);
    const [name, setName] = useState("");

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        fetchSpecialCredit(id)
            .then((response) => {
                const item = response.data;
                setSpecialCredit(item);
                setName(item?.name ?? "");
            })
            .catch((error) => {
                const message = error?.response?.data?.message || "No se pudo cargar el grupo especial";
                toast.error(message);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const linkedCredits = useMemo(
        () => (Array.isArray(specialCredit?.credits) ? specialCredit.credits : []),
        [specialCredit]
    );
    const linkedExpenses = useMemo(
        () => (Array.isArray(specialCredit?.expenses) ? specialCredit.expenses : []),
        [specialCredit]
    );

    const handleSubmit = async (event) => {
        event.preventDefault();

        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error("Ingresá un nombre válido");
            return;
        }

        try {
            setSaving(true);
            const response = await updateSpecialCredit(id, { name: trimmedName });
            setSpecialCredit((prev) => ({ ...prev, ...response.data }));
            setName(response.data?.name ?? trimmedName);
            toast.success("Grupo especial actualizado");
        } catch (error) {
            const message = error?.response?.data?.message || "No se pudo actualizar el grupo especial";
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="mx-auto max-w-5xl px-4 py-6 text-gray-500">Cargando grupo especial...</div>;
    }

    if (!specialCredit) {
        return <div className="mx-auto max-w-5xl px-4 py-6 text-red-500">Grupo especial no encontrado.</div>;
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Editar grupo especial</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Actualizá el nombre del grupo y revisá qué créditos y gastos tiene vinculados.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                    Volver
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Créditos asociados" value={linkedCredits.length} />
                <StatCard label="Gastos asociados" value={linkedExpenses.length} />
                <StatCard label="Creado" value={specialCredit.createdAt ? new Date(specialCredit.createdAt).toLocaleDateString("es-AR") : "—"} />
            </div>

            <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        placeholder="Ej. Comisión premium"
                    />
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
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

            <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Créditos vinculados</h2>
                    <div className="mt-4 space-y-3">
                        {linkedCredits.length ? (
                            linkedCredits.map((credit) => (
                                <button
                                    key={credit.id}
                                    type="button"
                                    onClick={() => navigate(`/creditos/${credit.id}`)}
                                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Crédito {credit.id.slice(0, 8)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Estado: {credit.status}</p>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {currencyFormatter.format(Number(credit.amount || 0))}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">No hay créditos vinculados.</p>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Gastos vinculados</h2>
                    <div className="mt-4 space-y-3">
                        {linkedExpenses.length ? (
                            linkedExpenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    className="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{expense.description || "Sin descripción"}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {expense.incurredOn ? new Date(expense.incurredOn).toLocaleDateString("es-AR") : "Sin fecha"}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {currencyFormatter.format(Number(expense.amount || 0))}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">No hay gastos vinculados.</p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    );
}