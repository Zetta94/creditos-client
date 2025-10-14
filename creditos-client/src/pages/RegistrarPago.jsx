import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { mockClients, mockCredits } from "../mocks/mockData";
import { HiArrowLeft, HiTrash, HiPlus } from "react-icons/hi";

export default function RegistrarPago() {
    const { creditoId } = useParams(); // 👈 cambio acá
    const navigate = useNavigate();

    const credito = mockCredits.find((cr) => cr.id === creditoId);
    const cliente = mockClients.find((c) => c.id === credito?.clientId); // 👈 busca el cliente asociado

    const [pagos, setPagos] = useState([{ metodo: "efectivo", monto: "", id: Date.now() }]);
    const [nota, setNota] = useState("");

    if (!credito || !cliente) {
        return (
            <div className="p-6 text-center text-red-500">
                Crédito o cliente no encontrado.
            </div>
        );
    }

    const total = pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);

    function agregarPago() {
        setPagos((prev) => [...prev, { metodo: "efectivo", monto: "", id: Date.now() }]);
    }

    function eliminarPago(id) {
        setPagos((prev) => prev.filter((p) => p.id !== id));
    }

    function actualizarPago(id, campo, valor) {
        setPagos((prev) => prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)));
    }

    function handleSubmit(e) {
        e.preventDefault();
        const pagosValidos = pagos.filter((p) => p.metodo && Number(p.monto) > 0);
        if (pagosValidos.length === 0) {
            toast.error("Debes ingresar al menos un pago válido 🧾");
            return;
        }

        toast.success(`Pago total registrado: $${total.toLocaleString("es-AR")}`, {
            icon: "💰",
        });

        setTimeout(() => navigate(-1), 1500);
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                >
                    <HiArrowLeft className="h-5 w-5" /> Volver
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Registrar pago
                </h1>
            </div>

            {/* Cliente */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p className="text-gray-900 dark:text-gray-100 font-medium text-lg">
                    {cliente.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{cliente.address}</p>
                <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
                    Crédito activo:{" "}
                    <strong>${credito.amount.toLocaleString("es-AR")}</strong> — Cuota:{" "}
                    <strong>${credito.installmentAmount.toLocaleString("es-AR")}</strong>
                </p>
            </div>

            {/* Formulario */}
            <form
                onSubmit={handleSubmit}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-5"
            >
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Detalle de pagos
                </h2>

                {pagos.map((p) => (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-end gap-3 border-b pb-4 last:border-none">
                        {/* Método */}
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Medio de pago
                            </label>
                            <select
                                value={p.metodo}
                                onChange={(e) => actualizarPago(p.id, "metodo", e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            >
                                <option value="efectivo">Efectivo</option>
                                <option value="mercadopago">Mercado Pago</option>
                                <option value="transferencia">Transferencia</option>
                            </select>
                        </div>

                        {/* Monto */}
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Monto abonado
                            </label>
                            <input
                                type="number"
                                value={p.monto}
                                onChange={(e) => actualizarPago(p.id, "monto", e.target.value)}
                                min="0"
                                step="100"
                                placeholder="0"
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            />
                        </div>

                        {/* Eliminar */}
                        {pagos.length > 1 && (
                            <button
                                type="button"
                                onClick={() => eliminarPago(p.id)}
                                className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1 mt-1 sm:mt-0"
                            >
                                <HiTrash className="h-4 w-4" /> Quitar
                            </button>
                        )}
                    </div>
                ))}

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={agregarPago}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 font-medium"
                    >
                        <HiPlus className="h-4 w-4" /> Agregar otro medio de pago
                    </button>
                </div>

                <div className="text-right text-sm font-medium text-gray-800 dark:text-gray-200 border-t pt-3">
                    Total a registrar:{" "}
                    <span className="text-lg font-bold text-blue-600">
                        ${total.toLocaleString("es-AR")}
                    </span>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nota (opcional)
                    </label>
                    <textarea
                        value={nota}
                        onChange={(e) => setNota(e.target.value)}
                        placeholder="Ej: parte en efectivo, parte por MP."
                        rows={3}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-500 focus:ring-2 focus:ring-blue-300"
                >
                    Registrar pago
                </button>
            </form>
        </div>
    );
}
