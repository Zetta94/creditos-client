import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { mockCredits, mockClients } from "../mocks/mockData.js";

export default function CancelarCredito() {
    const { id } = useParams();
    const navigate = useNavigate();

    const credito = mockCredits.find((c) => c.id === id);
    const cliente = mockClients.find((c) => c.id === credito?.clientId);

    const [form, setForm] = useState({
        metodo: "",
        efectivo: "",
        mercadopago: "",
        producto: "",
        montoRecibido: "",
        observaciones: "",
    });

    if (!credito)
        return (
            <div className="text-center text-red-500 py-10">
                Crédito no encontrado
            </div>
        );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    // === Calcular totales y descuentos ===
    const montoOriginal = credito.amount || 0;
    const totalRecibido = useMemo(() => {
        if (form.metodo === "mixto") {
            const e = Number(form.efectivo) || 0;
            const mp = Number(form.mercadopago) || 0;
            return e + mp;
        }
        return Number(form.montoRecibido) || 0;
    }, [form.metodo, form.efectivo, form.mercadopago, form.montoRecibido]);

    const descuento = Math.max(0, montoOriginal - totalRecibido);

    const handleSubmit = (e) => {
        e.preventDefault();

        const data = {
            ...form,
            totalRecibido,
            descuento,
        };

        console.log("💰 Cancelación registrada:", data);
        credito.status = "PAID"; // simular cierre del crédito

        alert(
            `Crédito cancelado correctamente ✅\nTotal recibido: $${totalRecibido.toLocaleString(
                "es-AR"
            )}`
        );
        navigate(`/creditos/${id}`);
    };

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Cancelar crédito
            </h1>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p className="text-gray-700 dark:text-gray-300">
                    <strong>Cliente:</strong> {cliente?.name}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                    <strong>Monto original:</strong>{" "}
                    ${montoOriginal.toLocaleString("es-AR")}
                </p>
                {descuento > 0 && (
                    <p className="text-red-500 font-medium">
                        Descuento aplicado: -$
                        {descuento.toLocaleString("es-AR")}
                    </p>
                )}
                <p className="text-blue-600 dark:text-blue-400 font-semibold mt-2">
                    Total recibido: $
                    {totalRecibido.toLocaleString("es-AR")}
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 dark:border-gray-700 dark:bg-gray-800"
            >
                {/* Método */}
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Método de cancelación
                    </label>
                    <select
                        name="metodo"
                        value={form.metodo}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    >
                        <option value="">Seleccionar método…</option>
                        <option value="efectivo">Pago total en efectivo</option>
                        <option value="mercadopago">Pago total en MercadoPago</option>
                        <option value="mixto">Mitad efectivo / mitad MP</option>
                        <option value="producto">Abonó con otro producto</option>
                    </select>
                </div>

                {/* Campos según método */}
                {form.metodo === "mixto" && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Monto en efectivo"
                            name="efectivo"
                            type="number"
                            value={form.efectivo}
                            onChange={handleChange}
                            placeholder="Ej: 50000"
                        />
                        <Input
                            label="Monto en MercadoPago"
                            name="mercadopago"
                            type="number"
                            value={form.mercadopago}
                            onChange={handleChange}
                            placeholder="Ej: 50000"
                        />
                    </div>
                )}

                {form.metodo === "producto" && (
                    <Input
                        label="Descripción del producto"
                        name="producto"
                        value={form.producto}
                        onChange={handleChange}
                        placeholder="Ej: Televisor 32 pulgadas"
                    />
                )}

                {["efectivo", "mercadopago"].includes(form.metodo) && (
                    <Input
                        label="Monto recibido total"
                        name="montoRecibido"
                        type="number"
                        value={form.montoRecibido}
                        onChange={handleChange}
                        placeholder="Ej: 80000"
                    />
                )}

                {/* Observaciones */}
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Observaciones
                    </label>
                    <textarea
                        name="observaciones"
                        value={form.observaciones}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        placeholder="Notas adicionales..."
                    />
                </div>

                {/* Resumen dinámico */}
                <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Total recibido:</strong>{" "}
                        {totalRecibido > 0
                            ? `$${totalRecibido.toLocaleString("es-AR")}`
                            : "—"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Descuento aplicado: $
                        {descuento.toLocaleString("es-AR")}
                    </p>
                </div>

                {/* Botones */}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4">
                    <button
                        type="button"
                        onClick={() => navigate(`/creditos/${id}`)}
                        className="w-full sm:w-auto rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                    >
                        Volver
                    </button>
                    <button
                        type="submit"
                        className="w-full sm:w-auto rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                        Confirmar cancelación
                    </button>
                </div>
            </form>
        </div>
    );
}

/* === Subcomponente Input reutilizable === */
function Input({ label, ...props }) {
    return (
        <div className="space-y-1.5">
            <label
                htmlFor={props.name}
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
                {label}
            </label>
            <input
                {...props}
                id={props.name}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
        </div>
    );
}
