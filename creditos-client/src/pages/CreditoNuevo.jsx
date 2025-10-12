import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const clientesMock = [
    { id: "c1", nombre: "Juan Pérez" },
    { id: "c2", nombre: "Laura Gómez" },
    { id: "c3", nombre: "Carlos Díaz" },
];

export default function CreditoNuevo() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        clienteId: "",
        monto: "",
        cuotas: "",
        plan: "Mensual",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        // estética: no validamos acá, solo guardamos
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Nuevo crédito:", form); // TODO: POST /api/creditos
        navigate("/creditos");
    };

    const montoNumber = Number(form.monto) || 0;
    const cuotasNumber = Math.max(0, Number(form.cuotas) || 0);

    const cuotaEstim = useMemo(() => {
        if (!montoNumber || !cuotasNumber) return 0;
        return Math.floor(montoNumber / cuotasNumber);
    }, [montoNumber, cuotasNumber]);

    const preview = useMemo(() => {
        // solo estética: generamos 1..min(6, cuotas) para previsualizar
        const n = Math.min(6, cuotasNumber);
        return Array.from({ length: n }, (_, i) => ({
            nro: i + 1,
            importe: cuotaEstim,
        }));
    }, [cuotasNumber, cuotaEstim]);

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            <h1 className="text-xl font-bold sm:text-2xl">Nuevo crédito</h1>

            <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6 lg:grid-cols-3"
            >
                {/* Columna izquierda: formulario */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Cliente */}
                    <div className="grid gap-1.5">
                        <label className="text-sm text-gray-600 dark:text-gray-300">Cliente</label>
                        <select
                            name="clienteId"
                            value={form.clienteId}
                            onChange={handleChange}
                            required
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        >
                            <option value="">Seleccionar cliente…</option>
                            {clientesMock.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => navigate("/clientes/agregar")}
                            className="self-start text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                            + Crear nuevo cliente
                        </button>
                    </div>

                    {/* Monto / Cuotas */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-300">Monto total</label>
                            <input
                                name="monto"
                                type="number"
                                min={0}
                                step="100"
                                value={form.monto}
                                onChange={handleChange}
                                placeholder="Ej: 100000"
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                ≈ {montoNumber.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
                            </p>
                        </div>

                        <div className="grid gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-300">Cantidad de cuotas</label>
                            <input
                                name="cuotas"
                                type="number"
                                min={1}
                                step="1"
                                value={form.cuotas}
                                onChange={handleChange}
                                placeholder="Ej: 10"
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {cuotasNumber > 0 ? `≈ ${cuotasNumber} meses/periodos` : "—"}
                            </p>
                        </div>
                    </div>

                    {/* Plan/tipo chips + input libre */}
                    <div className="grid gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-300">Plan o tipo</label>
                        <div className="flex flex-wrap gap-2">
                            {["Diario", "Semanal", "Mensual"].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, plan: p }))}
                                    className={[
                                        "rounded-full border px-3 py-1 text-xs",
                                        form.plan === p
                                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300"
                                            : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900",
                                    ].join(" ")}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <input
                            name="plan"
                            value={form.plan}
                            onChange={handleChange}
                            placeholder="Ej: Diario / Semanal / Mensual"
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                    </div>
                </div>

                {/* Columna derecha: resumen */}
                <aside className="lg:col-span-1 space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">Resumen</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-500">Plan</div>
                            <div className="text-right">{form.plan || "—"}</div>
                            <div className="text-gray-500">Monto</div>
                            <div className="text-right">
                                {montoNumber
                                    ? montoNumber.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
                                    : "—"}
                            </div>
                            <div className="text-gray-500">Cuotas</div>
                            <div className="text-right">{cuotasNumber || "—"}</div>
                            <div className="text-gray-500">Cuota estimada</div>
                            <div className="text-right">
                                {cuotaEstim
                                    ? cuotaEstim.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
                                    : "—"}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                            Previsualización de cuotas <span className="text-xs text-gray-500">(primeras 6)</span>
                        </h3>

                        {/* Cards en móvil / tabla en desktop */}
                        <div className="grid gap-2 sm:hidden">
                            {preview.length === 0 ? (
                                <p className="text-sm text-gray-500">Completá monto y cuotas para ver la previsualización.</p>
                            ) : (
                                preview.map((q) => (
                                    <div
                                        key={q.nro}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                                    >
                                        <span className="text-gray-500">Cuota {q.nro}</span>
                                        <span className="font-medium">
                                            {q.importe.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="hidden overflow-x-auto sm:block">
                            <table className="w-full text-left text-sm">
                                <thead className="text-gray-500">
                                    <tr>
                                        <th className="py-2 pr-3 font-medium">#</th>
                                        <th className="py-2 font-medium">Importe</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {preview.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="py-4 text-sm text-gray-500">
                                                Completá monto y cuotas para ver la previsualización.
                                            </td>
                                        </tr>
                                    ) : (
                                        preview.map((q) => (
                                            <tr key={q.nro}>
                                                <td className="py-2 pr-3">Cuota {q.nro}</td>
                                                <td className="py-2">
                                                    {q.importe.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </aside>

                {/* Acciones */}
                <div className="lg:col-span-3 mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => navigate("/creditos")}
                        className="w-full rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 sm:w-auto"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-auto"
                    >
                        Guardar
                    </button>
                </div>
            </form>
        </div>
    );
}
