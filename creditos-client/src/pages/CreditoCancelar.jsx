import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { fetchCredit, updateCredit } from "../services/creditsService";


export default function CancelarCredito() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [credito, setCredito] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        metodo: "",
        efectivo: "",
        mercadopago: "",
        producto: "",
        montoRecibido: "",
        otrosDescripcion: "",
        otrosMonto: "",
        observaciones: "",
    });

    useEffect(() => {
        setLoading(true);
        fetchCredit(id)
            .then(res => {
                setCredito(res.data);
                setError(null);
            })
            .catch(() => setError("Crédito no encontrado"))
            .finally(() => setLoading(false));
    }, [id]);

    // Definir hooks y variables derivadas SIEMPRE antes de cualquier return condicional
    const cliente = credito?.client;
    const montoOriginal = credito?.amount || 0;
    const totalRecibido = useMemo(() => {
        switch (form.metodo) {
            case "mixto": {
                const e = Number(form.efectivo) || 0;
                const mp = Number(form.mercadopago) || 0;
                return e + mp;
            }
            case "otros":
                return Number(form.otrosMonto) || 0;
            case "efectivo":
            case "mercadopago":
                return Number(form.montoRecibido) || 0;
            default:
                return Number(form.montoRecibido) || 0;
        }
    }, [form.metodo, form.efectivo, form.mercadopago, form.montoRecibido, form.otrosMonto]);
    const descuento = Math.max(0, montoOriginal - totalRecibido);

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else if (id) {
            navigate(`/creditos/${id}`);
        } else {
            navigate("/creditos");
        }
    };

    if (loading) return <div className="text-center text-gray-500 py-10">Cargando crédito...</div>;
    if (error || !credito) return <div className="text-center text-red-500 py-10">{error || "Crédito no encontrado"}</div>;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const producto = (form.producto || "").trim();
        const otrosDescripcion = (form.otrosDescripcion || "").trim();

        if (!form.metodo) {
            alert("Elegí un método de cancelación");
            return;
        }

        if (form.metodo === "producto" && !producto) {
            alert("Indicá qué producto se entregó.");
            return;
        }

        if (form.metodo === "otros") {
            if (!otrosDescripcion) {
                alert("Detallá qué se entregó en la cancelación.");
                return;
            }
            if (form.otrosMonto && Number(form.otrosMonto) < 0) {
                alert("El monto reconocido no puede ser negativo.");
                return;
            }
        }

        const data = {
            ...form,
            producto,
            otrosDescripcion,
            efectivo: Number(form.efectivo) || 0,
            mercadopago: Number(form.mercadopago) || 0,
            montoRecibido: Number(form.montoRecibido) || 0,
            otrosMonto: Number(form.otrosMonto) || 0,
            observaciones: (form.observaciones || "").trim(),
            totalRecibido,
            descuento,
        };
        try {
            await updateCredit(id, { status: "PAID", ...data });
            alert(
                `Crédito cancelado correctamente ✅\nTotal recibido: $${totalRecibido.toLocaleString("es-AR")}`
            );
            navigate("/creditos");
        } catch {
            alert("Error al cancelar el crédito");
        }
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
                        <option value="otros">Otros medios / entregas</option>
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
                        required
                    />
                )}

                {form.metodo === "otros" && (
                    <div className="space-y-4">
                        <Input
                            label="Detalle de lo entregado"
                            name="otrosDescripcion"
                            value={form.otrosDescripcion}
                            onChange={handleChange}
                            placeholder="Ej: Auto usado, moto, electrodoméstico"
                            required
                        />
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="otrosMonto">
                                Monto reconocido (si aplica)
                            </label>
                            <input
                                id="otrosMonto"
                                name="otrosMonto"
                                type="number"
                                value={form.otrosMonto}
                                onChange={handleChange}
                                placeholder="Ej: 150000"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Si el acuerdo incluye dinero, registrá el monto para sumarlo al total.
                            </p>
                        </div>
                    </div>
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
                    {form.metodo === "producto" && form.producto ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Producto entregado: {form.producto}
                        </p>
                    ) : null}
                    {form.metodo === "otros" && form.otrosDescripcion ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Detalle entrega: {form.otrosDescripcion}
                        </p>
                    ) : null}
                </div>

                {/* Botones */}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4">
                    <button
                        type="button"
                        onClick={handleBack}
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
