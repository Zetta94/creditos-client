// pages/ClienteEditar.jsx
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

const clientesMock = [
    { id: "c1", nombre: "Juan Pérez", telefono: "+54 9 2664 000000", documento: "30123456", direccion: "Calle Falsa 123", ciudad: "San Luis", provincia: "San Luis", confianza: "Alta", notas: "" },
    { id: "c2", nombre: "Laura Gómez", telefono: "+54 9 2664 123456", documento: "28999888", direccion: "Av. Siempreviva 742", ciudad: "San Luis", provincia: "San Luis", confianza: "Baja", notas: "Llamar antes" },
];

export default function ClienteEditar() {
    const { id } = useParams();
    const navigate = useNavigate();
    const current = clientesMock.find((c) => c.id === id);

    const [form, setForm] = useState(
        current ?? {
            nombre: "",
            telefono: "",
            documento: "",
            direccion: "",
            ciudad: "",
            provincia: "",
            confianza: "Media",
            notas: "",
        }
    );

    const handle = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    const submit = async (e) => {
        e.preventDefault();
        // TODO: PUT /api/clientes/:id con { ...form }
        console.log("Editar cliente", id, form);
        navigate(`/clientes/${id}`);
    };

    if (!current) {
        return (
            <div className="p-6">
                <p className="text-red-300 mb-4">Cliente no encontrado.</p>
                <button onClick={() => navigate("/clientes")} className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600">Volver</button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Editar cliente</h1>

            <form onSubmit={submit} className="max-w-2xl bg-gray-800 rounded-xl p-6 space-y-4 border border-gray-700">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 text-sm">Nombre completo</label>
                        <input name="nombre" value={form.nombre} onChange={handle} required className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm">Teléfono</label>
                        <input name="telefono" value={form.telefono} onChange={handle} required className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm">Documento</label>
                        <input name="documento" value={form.documento} onChange={handle} required className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm">Confianza</label>
                        <select name="confianza" value={form.confianza} onChange={handle} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2">
                            <option>Alta</option>
                            <option>Media</option>
                            <option>Baja</option>
                            <option>Moroso</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block mb-1 text-sm">Dirección</label>
                        <input name="direccion" value={form.direccion} onChange={handle} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm">Ciudad</label>
                        <input name="ciudad" value={form.ciudad} onChange={handle} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm">Provincia</label>
                        <input name="provincia" value={form.provincia} onChange={handle} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2" />
                    </div>
                </div>

                <div>
                    <label className="block mb-1 text-sm">Notas</label>
                    <textarea name="notas" value={form.notas} onChange={handle} rows={3} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2" />
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => navigate(`/clientes/${id}`)} className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600">
                        Cancelar
                    </button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">
                        Guardar cambios
                    </button>
                </div>
            </form>
        </div>
    );
}
