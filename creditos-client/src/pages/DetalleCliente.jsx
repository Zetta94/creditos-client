// pages/ClienteDetalle.jsx
import { useNavigate, useParams } from "react-router-dom";

const clientesMock = [
    { id: "c1", nombre: "Juan Pérez", telefono: "+54 9 2664 000000", documento: "30123456", direccion: "Calle Falsa 123", ciudad: "San Luis", provincia: "San Luis", confianza: "Alta", notas: "" },
    { id: "c2", nombre: "Laura Gómez", telefono: "+54 9 2664 123456", documento: "28999888", direccion: "Av. Siempreviva 742", ciudad: "San Luis", provincia: "San Luis", confianza: "Baja", notas: "Llamar antes" },
];

const creditosMock = [
    { id: "cr1", clientId: "c1", monto: 100000, cuotas: 10, pagadas: 6, estado: "PENDING", inicio: "2025-06-10" },
    { id: "cr3", clientId: "c1", monto: 80000, cuotas: 8, pagadas: 4, estado: "OVERDUE", inicio: "2025-03-01" },
    { id: "cr2", clientId: "c2", monto: 150000, cuotas: 12, pagadas: 12, estado: "PAID", inicio: "2025-02-15" },
];

export default function ClienteDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();

    const cliente = clientesMock.find((c) => c.id === id);
    const creditos = creditosMock.filter((cr) => cr.clientId === id);

    if (!cliente) {
        return (
            <div className="p-6">
                <p className="text-red-300 mb-4">Cliente no encontrado.</p>
                <button onClick={() => navigate("/clientes")} className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600">Volver</button>
            </div>
        );
    }

    const badge = (estado) =>
    ({
        PENDING: "bg-yellow-900/40 text-yellow-200 border-yellow-700",
        PAID: "bg-green-900/40 text-green-200 border-green-700",
        OVERDUE: "bg-red-900/40 text-red-200 border-red-700",
    }[estado]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{cliente.nombre}</h1>
                    <p className="text-gray-300">{cliente.telefono} • DNI: {cliente.documento}</p>
                    <p className="text-gray-400">{cliente.direccion} — {cliente.ciudad}, {cliente.provincia}</p>
                    <p className="text-gray-400">Confianza: <b>{cliente.confianza}</b></p>
                    {cliente.notas && <p className="text-gray-400 italic mt-1">Notas: {cliente.notas}</p>}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate(`/clientes/${cliente.id}/editar`)} className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600">Editar</button>
                    <button onClick={() => navigate("/clientes")} className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600">Volver</button>
                </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">Créditos del cliente</h2>
                    <button onClick={() => navigate("/creditos/nuevo")} className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">
                        + Nuevo crédito
                    </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-700">
                    <table className="min-w-full text-sm text-left text-gray-300">
                        <thead className="text-xs uppercase bg-gray-700 text-gray-200">
                            <tr>
                                <th className="px-4 py-3">Crédito</th>
                                <th className="px-4 py-3">Monto</th>
                                <th className="px-4 py-3">Cuotas</th>
                                <th className="px-4 py-3">Pagadas</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {creditos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">Sin créditos para este cliente.</td>
                                </tr>
                            ) : (
                                creditos.map((cr) => (
                                    <tr key={cr.id} className="border-t border-gray-700 bg-gray-800">
                                        <td className="px-4 py-3">{cr.id}</td>
                                        <td className="px-4 py-3">${cr.monto.toLocaleString("es-AR")}</td>
                                        <td className="px-4 py-3">{cr.cuotas}</td>
                                        <td className="px-4 py-3">{cr.pagadas}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs border ${badge(cr.estado)}`}>
                                                {cr.estado === "PENDING" ? "Pendiente" : cr.estado === "PAID" ? "Pagado" : "Vencido"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => navigate(`/creditos/${cr.id}`)}
                                                className="px-3 py-2 rounded-md bg-sky-700 hover:bg-sky-600 text-white"
                                            >
                                                Ver crédito
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
