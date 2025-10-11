// pages/Clientes.jsx
import { useNavigate } from "react-router-dom";
import { HiPencilAlt, HiEye, HiUserAdd, HiUserRemove } from "react-icons/hi";

const data = [
    { id: "c1", nombre: "Juan Pérez", telefono: "+54 9 2664 000000", activo: true, confianza: "Alta", pago: "Al día" },
    { id: "c2", nombre: "Laura Gómez", telefono: "+54 9 2664 123456", activo: false, confianza: "Baja", pago: "Atrasado" },
    { id: "c3", nombre: "Carlos Díaz", telefono: "+54 9 2664 987654", activo: true, confianza: "Media", pago: "Regular" },
];

export default function Clientes() {
    const navigate = useNavigate();

    const toggleActivo = (id) => {
        // TODO: PATCH /api/clientes/:id/estado
        console.log("toggle activo", id);
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-4">Clientes</h1>
            <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="min-w-full text-sm text-left text-gray-300">
                    <thead className="text-xs uppercase bg-gray-700 text-gray-200">
                        <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Teléfono</th>
                            <th className="px-4 py-3">Activo</th>
                            <th className="px-4 py-3">Estatus de pago</th>
                            <th className="px-4 py-3">Confianza</th>
                            <th className="px-4 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((c) => (
                            <tr key={c.id} className="border-t border-gray-700 bg-gray-800">
                                <td className="px-4 py-3">{c.nombre}</td>
                                <td className="px-4 py-3">{c.telefono}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${c.activo
                                            ? "bg-green-900/40 text-green-300 border border-green-800"
                                            : "bg-red-900/40 text-red-300 border border-red-800"
                                            }`}
                                    >
                                        <span className={`h-2 w-2 rounded-full ${c.activo ? "bg-green-400" : "bg-red-400"}`} />
                                        {c.activo ? "Activo" : "Inactivo"}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${c.pago === "Al día"
                                            ? "bg-green-900/40 text-green-300 border-green-800"
                                            : c.pago === "Atrasado"
                                                ? "bg-red-900/40 text-red-300 border-red-800"
                                                : "bg-yellow-900/40 text-yellow-300 border-yellow-800"
                                            }`}
                                    >
                                        {c.pago}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{c.confianza}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button
                                            title="Editar"
                                            className="p-2 rounded-md bg-gray-700 hover:bg-gray-600"
                                            onClick={() => navigate(`/clientes/${c.id}/editar`)}
                                        >
                                            <HiPencilAlt className="h-4 w-4" />
                                        </button>
                                        <button
                                            title={c.activo ? "Deshabilitar" : "Habilitar"}
                                            className={`p-2 rounded-md ${c.activo ? "bg-red-700 hover:bg-red-600" : "bg-green-700 hover:bg-green-600"
                                                }`}
                                            onClick={() => toggleActivo(c.id)}
                                        >
                                            {c.activo ? <HiUserRemove className="h-4 w-4" /> : <HiUserAdd className="h-4 w-4" />}
                                        </button>
                                        <button
                                            title="Ver cliente"
                                            className="p-2 rounded-md bg-sky-700 hover:bg-sky-600"
                                            onClick={() => navigate(`/clientes/${c.id}`)}
                                        >
                                            <HiEye className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
