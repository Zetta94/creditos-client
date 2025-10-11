import { useState } from "react";
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
        plan: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: POST /api/creditos
        console.log("Nuevo crédito:", form);
        navigate("/creditos");
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Nuevo crédito</h1>

            <form
                onSubmit={handleSubmit}
                className="max-w-xl bg-gray-800 rounded-xl p-6 space-y-4 border border-gray-700"
            >
                <div>
                    <label className="block mb-1 text-sm">Cliente</label>
                    <select
                        name="clienteId"
                        value={form.clienteId}
                        onChange={handleChange}
                        required
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
                    >
                        <option value="">Seleccionar cliente...</option>
                        {clientesMock.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nombre}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => navigate("/clientes/nuevo")}
                        className="text-sm text-blue-400 hover:underline mt-1"
                    >
                        + Crear nuevo cliente
                    </button>
                </div>

                <div>
                    <label className="block mb-1 text-sm">Monto total</label>
                    <input
                        name="monto"
                        type="number"
                        value={form.monto}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm">Cantidad de cuotas</label>
                    <input
                        name="cuotas"
                        type="number"
                        value={form.cuotas}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm">Plan o tipo</label>
                    <input
                        name="plan"
                        value={form.plan}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
                        placeholder="Ej: Diario / Semanal / Mensual"
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/creditos")}
                        className="px-4 py-2 bg-gray-700 rounded-md"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                        Guardar
                    </button>
                </div>
            </form>
        </div>
    );
}
